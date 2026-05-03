#!/usr/bin/env node
/**
 * scripts/migrate-from-legacy.ts
 *
 * Migrates a legacy lab from physics-labs.up.railway.app/ into a draft *.lab.ts
 * file against src/domain/schema.
 *
 * BEST-EFFORT BY DESIGN. Every output gets manually reviewed. The script aims
 * to nail structural skeleton, prose extraction, and the common derived-formula
 * pattern; it marks fragile transformations (RecordTable, nested table data,
 * pre-filled rows) with explicit `// TODO(human)` markers.
 *
 * v2 changes (2026-05-02):
 * - Fix HTML-container bug: React components nested inside <div>/<span> now get
 *   dispatched to their handlers instead of being absorbed as prose text.
 * - Auto-translate the common derived-formula pattern (parseFloat + isNaN guard
 *   + .toFixed(N)) into clean TS with inferred deps and precision.
 * - Always emit Integrity Agreement at top + PDF Report Notes at bottom.
 * - Normalize objective fieldId to 'objective' regardless of legacy stateKey.
 * - Emit formulaLabel on derived columns (= column label by default).
 * - Emit deprecated alias export for backward compat.
 * - Run prettier on output for project-style consistency.
 *
 * Usage:
 *   npm run migrate -- --in <legacy-lab-dir> --out <output-file> [--strip-uncertainty]
 *
 * See scripts/MIGRATE_FROM_LEGACY.md for full documentation.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, basename, join } from 'node:path';
import { parse } from '@babel/parser';
import _traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import prettier from 'prettier';

// @babel/traverse ESM default-export workaround
const traverse = ((_traverse as unknown as { default?: typeof _traverse }).default ??
  _traverse) as typeof _traverse;

// ============================================================================
// Types
// ============================================================================

interface CliArgs {
  legacyPath: string;
  outputPath: string;
  stripUncertainty: boolean;
}

interface LabMetadata {
  id: string;
  title: string;
  description: string;
  category: string;
  simulations: Record<string, { url: string; title: string; allow?: string }>;
}

/** Sections we emit. Mirrors src/domain/schema/lab.ts SectionSchema. */
type Section =
  | { kind: 'instructions'; html: string; tocHidden?: boolean; points?: number }
  | { kind: 'objective'; fieldId: string; prompt?: string; rows?: number; points?: number }
  | { kind: 'measurement'; fieldId: string; label: string; unit?: string; points?: number }
  | {
      kind: 'multiMeasurement';
      rows: { id: string; label: string; unit?: string }[];
      points?: number;
    }
  | {
      kind: 'dataTable';
      tableId: string;
      columns: ColumnSpec[];
      rowCount: number;
      points?: number;
    }
  | {
      kind: 'plot';
      plotId: string;
      sourceTableId: string;
      xCol: string;
      yCol: string;
      xLabel: string;
      yLabel: string;
      fits?: { id: string; label: string }[];
      points?: number;
    }
  | { kind: 'image'; imageId: string; captionFieldId: string; maxMB?: number; points?: number }
  | {
      kind: 'calculation';
      fieldId: string;
      prompt: string;
      equationEditor?: boolean;
      points?: number;
    }
  | { kind: 'concept'; fieldId: string; prompt: string; rows?: number; points?: number };

type ColumnSpec =
  | { id: string; label: string; kind: 'input'; unit?: string }
  | {
      id: string;
      label: string;
      formulaLabel?: string;
      kind: 'derived';
      deps: string[];
      precision?: number;
      /** When set, the script translated the legacy formula and we emit it directly. */
      translatedFormula?: TranslatedFormula;
      /** Always set as a fallback — original legacy source slice for human review. */
      legacySource: string;
    };

interface TranslatedFormula {
  /** The local variable name introduced by the legacy code (e.g., 'angle', 'd'). */
  localName: string;
  /** The column id this formula reads from (e.g., 'incidentAngle'). */
  sourceCol: string;
  /** The math expression source (e.g., 'Math.sin((angle * Math.PI) / 180)'). */
  exprSrc: string;
}

/** A symbol table entry: const X = <object literal> at the top of a file. */
type SymbolValue = unknown;

/** Function values get wrapped so we can pattern-match on the AST later. */
interface FunctionSentinel {
  __fn: true;
  node: t.ArrowFunctionExpression | t.FunctionExpression | t.FunctionDeclaration;
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { legacyPath: '', outputPath: '', stripUncertainty: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--in') args.legacyPath = argv[++i];
    else if (a === '--out') args.outputPath = argv[++i];
    else if (a === '--strip-uncertainty') args.stripUncertainty = true;
    else if (a === '-h' || a === '--help') {
      console.log(USAGE);
      process.exit(0);
    }
  }
  if (!args.legacyPath || !args.outputPath) {
    console.error('Missing required args.\n');
    console.error(USAGE);
    process.exit(2);
  }
  return args;
}

const USAGE = `Usage: npm run migrate -- --in <legacy-lab-dir> --out <output-file> [--strip-uncertainty]

Required:
  --in <path>          Legacy lab directory containing labConfig.js + LabReportForm.js
  --out <path>         Output .lab.ts file path

Optional:
  --strip-uncertainty  Drop slope-uncertainty fields per the PHY 114 transformation
                       (NOTE: still emits a flag-only warning; full implementation deferred)
  -h, --help           Show this help
`;

// ============================================================================
// File parsing
// ============================================================================

async function readAndParse(filepath: string): Promise<{ ast: t.File; src: string }> {
  const src = await readFile(filepath, 'utf-8');
  const ast = parse(src, { sourceType: 'module', plugins: ['jsx'], errorRecovery: true });
  return { ast, src };
}

// ============================================================================
// Literal evaluator
// ============================================================================

const UNEVALUABLE = Symbol('unevaluable');

function evalNode(node: t.Node | null | undefined, symbols: Map<string, SymbolValue>): unknown {
  if (!node) return UNEVALUABLE;
  if (t.isStringLiteral(node)) return node.value;
  if (t.isNumericLiteral(node)) return node.value;
  if (t.isBooleanLiteral(node)) return node.value;
  if (t.isNullLiteral(node)) return null;
  if (t.isTemplateLiteral(node) && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked ?? q.value.raw).join('');
  }
  if (t.isArrayExpression(node)) {
    return node.elements.map((el) => (el ? evalNode(el, symbols) : null));
  }
  if (t.isObjectExpression(node)) {
    const out: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (t.isObjectProperty(prop)) {
        const key = propKeyToString(prop.key);
        if (key !== null) {
          out[key] = evalNode(prop.value as t.Node, symbols);
        }
      }
    }
    return out;
  }
  if (t.isIdentifier(node)) {
    if (symbols.has(node.name)) return symbols.get(node.name);
    return UNEVALUABLE;
  }
  if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
    const obj = evalNode(node.object, symbols);
    if (obj && typeof obj === 'object' && node.property.name in obj) {
      return (obj as Record<string, unknown>)[node.property.name];
    }
    return UNEVALUABLE;
  }
  if (
    t.isArrowFunctionExpression(node) ||
    t.isFunctionExpression(node) ||
    t.isFunctionDeclaration(node)
  ) {
    return { __fn: true, node } as FunctionSentinel;
  }
  if (t.isUnaryExpression(node) && node.operator === '-') {
    const inner = evalNode(node.argument, symbols);
    if (typeof inner === 'number') return -inner;
  }
  return UNEVALUABLE;
}

function propKeyToString(k: t.Node): string | null {
  if (t.isIdentifier(k)) return k.name;
  if (t.isStringLiteral(k)) return k.value;
  if (t.isNumericLiteral(k)) return String(k.value);
  return null;
}

function isFn(v: unknown): v is FunctionSentinel {
  return typeof v === 'object' && v !== null && (v as { __fn?: unknown }).__fn === true;
}

function sliceSource(node: t.Node, src: string): string {
  if (typeof node.start === 'number' && typeof node.end === 'number') {
    return src.slice(node.start, node.end);
  }
  return '/* could not extract source */';
}

// ============================================================================
// Phase 1: parse labConfig.js
// ============================================================================

function extractLabConfig(ast: t.File): {
  meta: LabMetadata;
  initialState: Record<string, unknown>;
} {
  const metadata: Partial<LabMetadata> = { simulations: {} };
  let initialState: Record<string, unknown> = {};
  const symbols = new Map<string, SymbolValue>();

  for (const stmt of ast.program.body) {
    const decl = t.isExportNamedDeclaration(stmt) ? stmt.declaration : stmt;
    if (t.isVariableDeclaration(decl)) {
      for (const v of decl.declarations) {
        if (t.isIdentifier(v.id) && v.init) {
          symbols.set(v.id.name, evalNode(v.init, symbols));
        }
      }
    }
  }

  const meta = symbols.get('metadata') as Record<string, unknown> | undefined;
  if (meta) {
    metadata.id = String(meta.id ?? '');
    metadata.title = String(meta.title ?? '');
    metadata.description = String(meta.description ?? '');
    metadata.category = String(meta.category ?? 'Physics');
  }

  const sims = symbols.get('simulations') as Record<string, unknown> | undefined;
  if (sims) {
    const out: Record<string, { url: string; title: string }> = {};
    for (const [k, v] of Object.entries(sims)) {
      if (v && typeof v === 'object') {
        const o = v as { url?: unknown; title?: unknown };
        out[camelize(k)] = { url: String(o.url ?? ''), title: String(o.title ?? '') };
      }
    }
    metadata.simulations = out;
  }

  const init = symbols.get('initialAnswersState') as Record<string, unknown> | undefined;
  if (init) initialState = init;

  return { meta: metadata as LabMetadata, initialState };
}

function camelize(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
}

// ============================================================================
// Phase 2: walk LabReportForm.js JSX → Section[]
// ============================================================================

interface WalkContext {
  symbols: Map<string, SymbolValue>;
  warnings: string[];
  rawSource: string;
}

function extractSectionsFromForm(
  ast: t.File,
  rawSource: string,
): { sections: Section[]; warnings: string[] } {
  const symbols = new Map<string, SymbolValue>();
  for (const stmt of ast.program.body) {
    if (t.isVariableDeclaration(stmt)) {
      for (const v of stmt.declarations) {
        if (t.isIdentifier(v.id) && v.init) {
          symbols.set(v.id.name, evalNode(v.init, symbols));
        }
      }
    }
  }

  let baseLabWrapper: t.JSXElement | null = null;
  traverse(ast, {
    VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
      if (t.isIdentifier(path.node.id) && path.node.init) {
        const name = path.node.id.name;
        if (!symbols.has(name)) {
          symbols.set(name, evalNode(path.node.init, symbols));
        }
      }
    },
    JSXElement(path: NodePath<t.JSXElement>) {
      const name = jsxElementName(path.node);
      if (name === 'BaseLabWrapper' && !baseLabWrapper) {
        baseLabWrapper = path.node;
      }
    },
  });

  if (!baseLabWrapper) {
    return {
      sections: [
        {
          kind: 'instructions',
          html: '⚠️ TODO(human): could not locate <BaseLabWrapper>. Migrate manually.',
        },
      ],
      warnings: ['No <BaseLabWrapper> root found.'],
    };
  }

  const ctx: WalkContext = { symbols, warnings: [], rawSource };
  const sections = walkChildren((baseLabWrapper as t.JSXElement).children, ctx);
  return { sections, warnings: ctx.warnings };
}

function jsxElementName(el: t.JSXElement): string {
  const n = el.openingElement.name;
  if (t.isJSXIdentifier(n)) return n.name;
  if (t.isJSXMemberExpression(n)) return jsxMemberToString(n);
  return '<unknown>';
}

function jsxMemberToString(n: t.JSXMemberExpression): string {
  const obj = t.isJSXIdentifier(n.object) ? n.object.name : jsxMemberToString(n.object);
  return `${obj}.${n.property.name}`;
}

/** True for transparent HTML wrappers that may contain React components. */
function isTransparentContainer(name: string): boolean {
  return name === 'div' || name === 'span' || name === 'section' || name === 'article';
}

/** True for an HTML element whose subtree contains any React (uppercase) component. */
function containsReactComponent(node: t.JSXElement): boolean {
  for (const c of node.children) {
    if (t.isJSXElement(c)) {
      const name = jsxElementName(c);
      if (!isHtmlTag(name)) return true;
      if (containsReactComponent(c)) return true;
    } else if (t.isJSXFragment(c)) {
      for (const fc of c.children) {
        if (t.isJSXElement(fc)) {
          if (!isHtmlTag(jsxElementName(fc))) return true;
          if (containsReactComponent(fc)) return true;
        }
      }
    }
  }
  return false;
}

/** Walk a sequence of JSX children, producing Section[] and grouping prose. */
function walkChildren(
  children: (
    | t.JSXElement
    | t.JSXText
    | t.JSXExpressionContainer
    | t.JSXFragment
    | t.JSXSpreadChild
  )[],
  ctx: WalkContext,
): Section[] {
  const sections: Section[] = [];
  let proseBuffer: string[] = [];

  const flushProse = () => {
    const text = proseBuffer.join('\n').trim();
    proseBuffer = [];
    if (text) sections.push({ kind: 'instructions', html: text });
  };

  for (const child of children) {
    if (t.isJSXText(child)) {
      const trimmed = child.value.trim();
      if (trimmed) proseBuffer.push(trimmed);
      continue;
    }

    if (t.isJSXExpressionContainer(child)) continue; // comments and similar — skip silently

    if (t.isJSXElement(child)) {
      const name = jsxElementName(child);

      if (isHtmlTag(name)) {
        // HTML element. If it's a transparent container that wraps a React component,
        // recurse so the component gets dispatched. Otherwise treat as prose.
        if (isTransparentContainer(name) && containsReactComponent(child)) {
          flushProse();
          const inner = walkChildren(child.children, ctx);
          for (const s of inner) sections.push(s);
        } else {
          proseBuffer.push(jsxToMarkdown(child));
        }
        continue;
      }

      // React component — flush any pending prose first
      flushProse();

      const handler = COMPONENT_HANDLERS[name];
      if (handler) {
        const out = handler(child, ctx);
        for (const s of out) sections.push(s);
      } else {
        ctx.warnings.push(`Unknown component <${name}> — emitted as TODO instructions.`);
        sections.push({
          kind: 'instructions',
          html: `⚠️ TODO(human): legacy used <${name}>. Port manually.`,
        });
      }
      continue;
    }

    if (t.isJSXFragment(child)) {
      const inner = walkChildren(child.children, ctx);
      for (const s of inner) sections.push(s);
    }
  }

  flushProse();
  return sections;
}

function isHtmlTag(name: string): boolean {
  return name.length > 0 && name[0] === name[0].toLowerCase();
}

// ============================================================================
// JSX → markdown best-effort converter (for prose)
// ============================================================================

function jsxToMarkdown(
  node:
    | t.JSXElement
    | t.JSXText
    | t.JSXExpressionContainer
    | t.JSXFragment
    | t.JSXSpreadChild,
): string {
  if (t.isJSXText(node)) return node.value.replace(/\s+/g, ' ');
  if (t.isJSXExpressionContainer(node)) {
    if (t.isStringLiteral(node.expression)) return node.expression.value;
    if (t.isTemplateLiteral(node.expression) && node.expression.expressions.length === 0) {
      return node.expression.quasis.map((q) => q.value.cooked ?? q.value.raw).join('');
    }
    return '';
  }
  if (t.isJSXFragment(node)) return node.children.map(jsxToMarkdown).join('');
  if (!t.isJSXElement(node)) return '';

  const name = jsxElementName(node);
  const inner = node.children.map(jsxToMarkdown).join('').trim();

  switch (name) {
    case 'h1':
      return `\n\n# ${inner}\n\n`;
    case 'h2':
      return `\n\n## ${inner}\n\n`;
    case 'h3':
      return `\n\n### ${inner}\n\n`;
    case 'h4':
      return `\n\n#### ${inner}\n\n`;
    case 'p':
      return `\n\n${inner}\n\n`;
    case 'strong':
    case 'b':
      return `**${inner}**`;
    case 'em':
    case 'i':
      return `*${inner}*`;
    case 'sub':
      return `<sub>${inner}</sub>`;
    case 'sup':
      return `<sup>${inner}</sup>`;
    case 'code':
      return `\`${inner}\``;
    case 'br':
      return '\n';
    case 'ol': {
      const items: string[] = [];
      let n = 1;
      const startAttr = getAttrLiteral(node, 'start');
      if (typeof startAttr === 'string' || typeof startAttr === 'number') n = Number(startAttr);
      for (const c of node.children) {
        if (t.isJSXElement(c) && jsxElementName(c) === 'li') {
          items.push(`${n}. ${c.children.map(jsxToMarkdown).join('').trim()}`);
          n++;
        }
      }
      return `\n\n${items.join('\n')}\n\n`;
    }
    case 'ul': {
      const items: string[] = [];
      for (const c of node.children) {
        if (t.isJSXElement(c) && jsxElementName(c) === 'li') {
          items.push(`- ${c.children.map(jsxToMarkdown).join('').trim()}`);
        }
      }
      return `\n\n${items.join('\n')}\n\n`;
    }
    case 'li':
    case 'div':
    case 'span':
      return inner;
    default:
      return inner;
  }
}

function getAttrLiteral(el: t.JSXElement, attrName: string): unknown {
  for (const a of el.openingElement.attributes) {
    if (t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === attrName) {
      if (!a.value) return true;
      if (t.isStringLiteral(a.value)) return a.value.value;
      if (t.isJSXExpressionContainer(a.value)) {
        return evalNode(a.value.expression as t.Node, new Map());
      }
    }
  }
  return undefined;
}

function getAttr(el: t.JSXElement, attrName: string, ctx?: WalkContext): unknown {
  const symbols = ctx?.symbols ?? new Map();
  for (const a of el.openingElement.attributes) {
    if (t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === attrName) {
      if (!a.value) return true;
      if (t.isStringLiteral(a.value)) return a.value.value;
      if (t.isJSXExpressionContainer(a.value)) {
        return evalNode(a.value.expression as t.Node, symbols);
      }
    }
  }
  return undefined;
}

// ============================================================================
// Derived-formula auto-translation
// ============================================================================

/**
 * Pattern-match the common legacy formula:
 *   (rowData) => {
 *     const X = parseFloat(rowData.COL);
 *     if (!isNaN(X) [&& maybe more]) {
 *       return EXPR.toFixed(N);
 *     }
 *     return '';
 *   }
 *
 * Returns a TranslatedFormula on match; null otherwise.
 */
function tryTranslateFormula(
  fnNode: t.Node,
  rawSource: string,
): { translated: TranslatedFormula; precision?: number } | null {
  if (!t.isArrowFunctionExpression(fnNode) && !t.isFunctionExpression(fnNode)) return null;
  if (fnNode.params.length !== 1) return null;
  const param = fnNode.params[0];
  if (!t.isIdentifier(param)) return null;
  const rowDataName = param.name; // typically 'rowData', 'row', '_rowData'

  if (!t.isBlockStatement(fnNode.body)) return null;
  const body = fnNode.body.body;
  if (body.length < 2 || body.length > 3) return null;

  // Stmt 1: const X = parseFloat(rowData.COL);
  const decl = body[0];
  if (!t.isVariableDeclaration(decl) || decl.declarations.length !== 1) return null;
  const dec = decl.declarations[0];
  if (!t.isIdentifier(dec.id) || !dec.init) return null;
  const localName = dec.id.name;

  if (!t.isCallExpression(dec.init)) return null;
  if (!t.isIdentifier(dec.init.callee)) return null;
  if (dec.init.callee.name !== 'parseFloat') return null;
  if (dec.init.arguments.length !== 1) return null;

  const arg = dec.init.arguments[0];
  if (!t.isMemberExpression(arg) || arg.computed) return null;
  if (!t.isIdentifier(arg.object) || arg.object.name !== rowDataName) return null;
  if (!t.isIdentifier(arg.property)) return null;
  const sourceCol = arg.property.name;

  // Stmt 2: if (!isNaN(X) [...]) { return EXPR[.toFixed(N)]; }
  const ifStmt = body[1];
  if (!t.isIfStatement(ifStmt)) return null;

  // Verify the test starts with !isNaN(X)
  let test: t.Expression = ifStmt.test;
  if (t.isLogicalExpression(test) && test.operator === '&&') {
    test = test.left;
  }
  if (!t.isUnaryExpression(test) || test.operator !== '!') return null;
  if (!t.isCallExpression(test.argument)) return null;
  if (!t.isIdentifier(test.argument.callee) || test.argument.callee.name !== 'isNaN') return null;
  if (test.argument.arguments.length !== 1) return null;
  const isNaNArg = test.argument.arguments[0];
  if (!t.isIdentifier(isNaNArg) || isNaNArg.name !== localName) return null;

  // Consequent must be a block with a return
  if (!t.isBlockStatement(ifStmt.consequent)) return null;
  const consequentBody = ifStmt.consequent.body;
  if (consequentBody.length !== 1 || !t.isReturnStatement(consequentBody[0])) return null;
  const ret = consequentBody[0].argument;
  if (!ret) return null;

  // ret could be EXPR.toFixed(N) or just EXPR
  let exprNode: t.Expression = ret;
  let precision: number | undefined = undefined;
  if (
    t.isCallExpression(ret) &&
    t.isMemberExpression(ret.callee) &&
    !ret.callee.computed &&
    t.isIdentifier(ret.callee.property) &&
    ret.callee.property.name === 'toFixed' &&
    ret.arguments.length === 1 &&
    t.isNumericLiteral(ret.arguments[0])
  ) {
    exprNode = ret.callee.object as t.Expression;
    precision = ret.arguments[0].value;
  }

  const exprSrc = sliceSource(exprNode, rawSource);
  return { translated: { localName, sourceCol, exprSrc }, precision };
}

// ============================================================================
// Component handlers
// ============================================================================

type ComponentHandler = (el: t.JSXElement, ctx: WalkContext) => Section[];

const COMPONENT_HANDLERS: Record<string, ComponentHandler> = {
  StudentInfoSection: () => [],
  ConfigurableQuestion: handleConfigurableQuestion,
  MultiMeasurementField: handleMultiMeasurementField,
  DataTable: handleDataTable,
  Graph: handleGraph,
  GenericImageUploader: handleGenericImageUploader,
  RecordTable: handleRecordTable,
};

function handleConfigurableQuestion(el: t.JSXElement, ctx: WalkContext): Section[] {
  const config = getAttr(el, 'config', ctx) as
    | {
        mainTitle?: string;
        mainDescription?: string;
        inputAreas?: Array<{
          stateKey?: string;
          label?: string;
          rows?: number;
          enableEquationEditor?: boolean;
        }>;
      }
    | undefined;
  const totalPoints = numberOrUndef(getAttr(el, 'points', ctx));

  if (!config) {
    return [
      { kind: 'instructions', html: '⚠️ TODO(human): <ConfigurableQuestion> with no extractable config.' },
    ];
  }

  const out: Section[] = [];
  const intro: string[] = [];
  if (config.mainTitle) intro.push(`## ${config.mainTitle}`);
  if (config.mainDescription) intro.push(config.mainDescription);

  const inputAreas = config.inputAreas ?? [];
  const isObjective = (config.mainTitle ?? '').trim().toUpperCase() === 'OBJECTIVE';

  if (isObjective && inputAreas.length === 1) {
    const area = inputAreas[0];
    out.push({
      kind: 'objective',
      // Normalized per project convention; legacy used 'q1' but we always emit 'objective'.
      fieldId: 'objective',
      prompt: config.mainDescription,
      rows: area.rows,
      points: totalPoints,
    });
    return out;
  }

  if (intro.length > 0 && inputAreas.length > 1) {
    out.push({ kind: 'instructions', html: intro.join('\n\n') });
  }

  const perAreaPoints = distributePoints(inputAreas, totalPoints);

  for (let i = 0; i < inputAreas.length; i++) {
    const area = inputAreas[i];
    const pts = perAreaPoints[i];
    const fieldId = area.stateKey ?? `unknown_${i}`;
    const prompt = (area.label ?? config.mainDescription ?? '').trim();

    if (area.enableEquationEditor) {
      out.push({
        kind: 'calculation',
        fieldId,
        prompt: prompt || '⚠️ TODO(human): missing prompt',
        equationEditor: true,
        points: pts,
      });
    } else if (intro.length > 0 && inputAreas.length === 1) {
      const folded = [intro.join('\n\n'), prompt].filter(Boolean).join('\n\n');
      out.push({
        kind: 'concept',
        fieldId,
        prompt: folded || '⚠️ TODO(human): missing prompt',
        rows: area.rows,
        points: pts,
      });
    } else {
      out.push({
        kind: 'concept',
        fieldId,
        prompt: prompt || '⚠️ TODO(human): missing prompt',
        rows: area.rows,
        points: pts,
      });
    }
  }

  return out;
}

function distributePoints(
  inputAreas: Array<{ label?: string }>,
  total: number | undefined,
): Array<number | undefined> {
  if (total === undefined) return inputAreas.map(() => undefined);
  const explicit: Array<number | undefined> = inputAreas.map((a) => {
    const m = (a.label ?? '').match(/\(([\d.]+)\s*p(?:oint)?s?\)/i);
    return m ? parseFloat(m[1]) : undefined;
  });
  const explicitSum = explicit.reduce<number>((acc, v) => acc + (v ?? 0), 0);
  const allExplicit = explicit.every((v) => v !== undefined);
  if (allExplicit && Math.abs(explicitSum - total) < 0.01) return explicit;
  const each = total / inputAreas.length;
  return inputAreas.map(() => each);
}

function handleMultiMeasurementField(el: t.JSXElement, ctx: WalkContext): Section[] {
  const config = getAttr(el, 'config', ctx) as
    | Array<{ label?: string; valueKey?: string; unitKey?: string }>
    | undefined;
  const points = numberOrUndef(getAttr(el, 'points', ctx));

  if (!config || !Array.isArray(config) || config.length === 0) {
    return [
      { kind: 'instructions', html: '⚠️ TODO(human): <MultiMeasurementField> with no extractable config.' },
    ];
  }

  if (config.length === 1) {
    const item = config[0];
    return [
      {
        kind: 'measurement',
        fieldId: String(item.valueKey ?? 'unknown'),
        label: String(item.label ?? '').trim(),
        unit: undefined,
        points,
      },
    ];
  }

  return [
    {
      kind: 'multiMeasurement',
      rows: config.map((item) => ({
        id: String(item.valueKey ?? 'unknown'),
        label: String(item.label ?? '').trim(),
        unit: undefined,
      })),
      points,
    },
  ];
}

function handleDataTable(el: t.JSXElement, ctx: WalkContext): Section[] {
  const columnConfigs = getAttr(el, 'columnConfigs', ctx) as
    | Array<Record<string, unknown>>
    | undefined;
  const numberOfRows = numberOrUndef(getAttr(el, 'numberOfRows', ctx));
  const points = numberOrUndef(getAttr(el, 'points', ctx));
  const unitValues = (getAttr(el, 'unitValues', ctx) as Record<string, unknown> | undefined) ?? {};
  const tableId = inferTableId(el) ?? 'unknownTable';

  if (!columnConfigs || !Array.isArray(columnConfigs)) {
    return [
      { kind: 'instructions', html: `⚠️ TODO(human): <DataTable id=${tableId}> columnConfigs not extractable.` },
    ];
  }

  const columns: ColumnSpec[] = columnConfigs.map((c) => {
    const id = String(c.id ?? c.prefix ?? 'col');
    const label = String(c.label ?? id);
    const unitKey = c.unitKey ? String(c.unitKey) : undefined;
    const unit = unitKey && unitKey in unitValues ? String(unitValues[unitKey]) : undefined;

    if (c.type === 'calculated') {
      const formula = c.formula;
      const legacySrc = isFn(formula) ? sliceSource(formula.node, ctx.rawSource) : '/* (no formula source) */';
      let translated: TranslatedFormula | undefined;
      let precision: number | undefined = 4; // default for derived columns

      if (isFn(formula)) {
        const result = tryTranslateFormula(formula.node, ctx.rawSource);
        if (result) {
          translated = result.translated;
          if (result.precision !== undefined) precision = result.precision;
        } else {
          ctx.warnings.push(
            `Derived column "${id}" formula did not match the auto-translation pattern; emitting TODO stub.`,
          );
        }
      }

      const deps = translated ? [translated.sourceCol] : ['TODO_DEPS'];

      return {
        id,
        label,
        formulaLabel: label, // sane default; humans can adjust to use distinct notation
        kind: 'derived',
        deps,
        precision,
        translatedFormula: translated,
        legacySource: legacySrc,
      };
    }
    return { id, label, kind: 'input', unit };
  });

  return [
    { kind: 'dataTable', tableId, rowCount: numberOfRows ?? 1, columns, points },
  ];
}

function inferTableId(el: t.JSXElement): string | undefined {
  for (const a of el.openingElement.attributes) {
    if (
      t.isJSXAttribute(a) &&
      t.isJSXIdentifier(a.name) &&
      a.name.name === 'rawData' &&
      a.value &&
      t.isJSXExpressionContainer(a.value)
    ) {
      let expr: t.Node = a.value.expression;
      if (t.isLogicalExpression(expr)) expr = expr.left;
      if (t.isMemberExpression(expr) && t.isIdentifier(expr.property)) {
        return expr.property.name.replace(/Data$/, 'Table');
      }
    }
  }
  return undefined;
}

function handleGraph(el: t.JSXElement, ctx: WalkContext): Section[] {
  const id = String(getAttr(el, 'id', ctx) ?? 'unknownPlot');
  const xCol = String(getAttr(el, 'xColumnId', ctx) ?? 'TODO_X');
  const yCol = String(getAttr(el, 'yColumnId', ctx) ?? 'TODO_Y');
  const xLabel = String(getAttr(el, 'xAxisLabel', ctx) ?? xCol);
  const yLabel = String(getAttr(el, 'yAxisLabel', ctx) ?? yCol);
  const enableFitting = Boolean(getAttr(el, 'enableFitting', ctx));
  const points = numberOrUndef(getAttr(el, 'points', ctx));

  let sourceTableId = 'TODO_TABLE_ID';
  for (const a of el.openingElement.attributes) {
    if (
      t.isJSXAttribute(a) &&
      t.isJSXIdentifier(a.name) &&
      a.name.name === 'dataTableConfig' &&
      a.value &&
      t.isJSXExpressionContainer(a.value) &&
      t.isIdentifier(a.value.expression)
    ) {
      sourceTableId = a.value.expression.name.replace(/Config$/, '');
    }
  }

  const fits = enableFitting
    ? [
        { id: 'linear', label: 'Linear (y = mx + b)' },
        { id: 'proportional', label: 'Proportional (y = mx)' },
      ]
    : undefined;

  return [
    { kind: 'plot', plotId: id, sourceTableId, xCol, yCol, xLabel, yLabel, fits, points },
  ];
}

function handleGenericImageUploader(el: t.JSXElement, ctx: WalkContext): Section[] {
  const id = String(getAttr(el, 'id', ctx) ?? 'unknownImage');
  const points = numberOrUndef(getAttr(el, 'points', ctx));
  const imageKey = String(getAttr(el, 'imageKey', ctx) ?? id);
  const captionFieldId = imageKey.replace(/Image$/, 'Caption');

  return [{ kind: 'image', imageId: id, captionFieldId, maxMB: 5, points }];
}

function handleRecordTable(_el: t.JSXElement, ctx: WalkContext): Section[] {
  ctx.warnings.push(
    '<RecordTable> encountered — emitted as TODO; nested-table handling not implemented.',
  );
  return [
    {
      kind: 'instructions',
      html: [
        '⚠️ TODO(human): legacy used <RecordTable> here.',
        'The migration script does not parse RecordTable into a schema section.',
        'Hand-port this section. See LEGACY_PARITY_INVENTORY.md for the legacy column/row config.',
      ].join('\n\n'),
    },
  ];
}

function numberOrUndef(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

// ============================================================================
// Phase 3: cross-validate fieldIds against initialAnswersState
// ============================================================================

function validateFieldIds(
  sections: Section[],
  initialState: Record<string, unknown>,
  warn: (msg: string) => void,
): void {
  const stateKeys = new Set(Object.keys(initialState));
  // 'objective' is normalized; legacy may have used 'q1' or similar — don't flag.
  stateKeys.add('objective');
  for (const s of sections) {
    const fieldId = (s as { fieldId?: string }).fieldId;
    if (fieldId && !stateKeys.has(fieldId) && !fieldId.startsWith('unknown')) {
      if (!fieldId.includes('.')) warn(`fieldId "${fieldId}" not found in initialAnswersState`);
    }
    if (s.kind === 'multiMeasurement') {
      for (const r of s.rows) {
        if (!stateKeys.has(r.id) && !r.id.startsWith('unknown')) {
          warn(`multiMeasurement row id "${r.id}" not found in initialAnswersState`);
        }
      }
    }
  }
}

// ============================================================================
// Phase 4: emit TypeScript output (boilerplate + sections + alias)
// ============================================================================

const INTEGRITY_AGREEMENT_SECTION: Section = {
  kind: 'instructions',
  tocHidden: true,
  html: [
    '## Integrity Agreement',
    'Your report includes a process record. You may use any tools you wish, but pastes, autocomplete suggestions, and edit timing are logged with timestamps and rendered in the final PDF.',
  ].join('\n\n'),
};

const PDF_REPORT_NOTES_SECTION: Section = {
  kind: 'instructions',
  tocHidden: true,
  html: [
    '## PDF Report Notes',
    'The generated PDF should include Student Info, worksheet responses, table and derived values, fit summaries, and a Process Record appendix.',
    'Review your entries before export. The signed report is the submission artifact for grading.',
  ].join('\n\n'),
};

function needsNumericRowImport(sections: Section[]): boolean {
  return sections.some(
    (s) => s.kind === 'dataTable' && s.columns.some((c) => c.kind === 'derived'),
  );
}

function emitLab(opts: {
  meta: LabMetadata;
  sections: Section[];
  legacyPath: string;
  warnings: string[];
  course: string;
}): string {
  const exportName = `${opts.course}${capitalize(opts.meta.id)}Lab`;
  const aliasName = `${opts.meta.id}Lab`;
  const allSections = [INTEGRITY_AGREEMENT_SECTION, ...opts.sections, PDF_REPORT_NOTES_SECTION];

  const lines: string[] = [];
  const importTypes = needsNumericRowImport(allSections) ? 'Lab, NumericRow' : 'Lab';
  lines.push(`import type { ${importTypes} } from '@/domain/schema';`);
  lines.push('');
  lines.push(
    `// Auto-generated by scripts/migrate-from-legacy.ts on ${new Date().toISOString().slice(0, 10)}.`,
  );
  lines.push(`// Source: ${opts.legacyPath}`);
  lines.push('//');
  lines.push('// This is a DRAFT. Every TODO(human) marker below needs review before this lab');
  lines.push('// is enabled in a course manifest. See scripts/MIGRATE_FROM_LEGACY.md for details.');
  if (opts.warnings.length > 0) {
    lines.push('//');
    lines.push('// Migration warnings:');
    for (const w of opts.warnings) lines.push(`//   - ${w}`);
  }
  lines.push('');

  lines.push(`export const ${exportName}: Lab = {`);
  lines.push(`  id: ${tsString(opts.meta.id)},`);
  lines.push(`  title: ${tsString(opts.meta.title)},`);
  lines.push(`  description: ${tsString(opts.meta.description)},`);
  lines.push(`  category: ${tsString(opts.meta.category)},`);

  lines.push('  simulations: {');
  for (const [k, v] of Object.entries(opts.meta.simulations)) {
    lines.push(`    ${k}: {`);
    lines.push(`      title: ${tsString(v.title)},`);
    lines.push(`      url: ${tsString(v.url)},`);
    lines.push(`      allow: 'fullscreen',`);
    lines.push(`    },`);
  }
  lines.push('  },');

  lines.push('  sections: [');
  for (const s of allSections) {
    lines.push(...indentLines(emitSection(s), 4));
  }
  lines.push('  ],');

  lines.push('};');
  lines.push('');
  lines.push(`/** @deprecated Prefer \`${exportName}\`; kept for incremental test refactors. */`);
  lines.push(`export const ${aliasName} = ${exportName};`);
  lines.push('');
  return lines.join('\n');
}

function emitSection(s: Section): string[] {
  switch (s.kind) {
    case 'instructions':
      return [
        '{',
        `  kind: 'instructions',`,
        ...optionalBoolLine('tocHidden', s.tocHidden),
        `  html: ${tsString(s.html)},`,
        ...optionalLine('points', s.points),
        '},',
      ];
    case 'objective':
      return [
        '{',
        `  kind: 'objective',`,
        `  fieldId: ${tsString(s.fieldId)},`,
        ...(s.prompt ? [`  prompt: ${tsString(s.prompt)},`] : []),
        ...optionalLine('rows', s.rows),
        ...optionalLine('points', s.points),
        '},',
      ];
    case 'measurement':
      return [
        '{',
        `  kind: 'measurement',`,
        `  fieldId: ${tsString(s.fieldId)},`,
        `  label: ${tsString(s.label)},`,
        ...(s.unit ? [`  unit: ${tsString(s.unit)},`] : []),
        ...optionalLine('points', s.points),
        '},',
      ];
    case 'multiMeasurement': {
      const rowLines: string[] = ['  rows: ['];
      for (const r of s.rows) {
        rowLines.push(
          `    { id: ${tsString(r.id)}, label: ${tsString(r.label)}${
            r.unit ? `, unit: ${tsString(r.unit)}` : ''
          } },`,
        );
      }
      rowLines.push('  ],');
      return [
        '{',
        `  kind: 'multiMeasurement',`,
        ...rowLines,
        ...optionalLine('points', s.points),
        '},',
      ];
    }
    case 'dataTable': {
      const colLines: string[] = ['  columns: ['];
      for (const c of s.columns) {
        if (c.kind === 'input') {
          colLines.push(
            `    { id: ${tsString(c.id)}, label: ${tsString(c.label)}, kind: 'input'${
              c.unit ? `, unit: ${tsString(c.unit)}` : ''
            } },`,
          );
        } else {
          colLines.push('    {');
          colLines.push(`      id: ${tsString(c.id)},`);
          colLines.push(`      label: ${tsString(c.label)},`);
          if (c.formulaLabel) colLines.push(`      formulaLabel: ${tsString(c.formulaLabel)},`);
          colLines.push(`      kind: 'derived',`);
          colLines.push(`      deps: ${jsonArray(c.deps)},`);
          if (c.precision !== undefined) colLines.push(`      precision: ${c.precision},`);

          if (c.translatedFormula) {
            const { localName, sourceCol, exprSrc } = c.translatedFormula;
            colLines.push(
              `      formula: (row: NumericRow): number => {`,
            );
            colLines.push(`        const ${localName} = row.${sourceCol} ?? 0;`);
            colLines.push(`        return ${exprSrc};`);
            colLines.push(`      },`);
          } else {
            colLines.push(`      // TODO(human): port the legacy formula:`);
            const commented = c.legacySource
              .split('\n')
              .map((l) => `      // ${l}`)
              .join('\n');
            colLines.push(commented);
            colLines.push(`      formula: (_row: NumericRow): number => 0, // TODO(human)`);
          }
          colLines.push('    },');
        }
      }
      colLines.push('  ],');
      return [
        '{',
        `  kind: 'dataTable',`,
        `  tableId: ${tsString(s.tableId)},`,
        `  rowCount: ${s.rowCount},`,
        ...colLines,
        ...optionalLine('points', s.points),
        '},',
      ];
    }
    case 'plot':
      return [
        '{',
        `  kind: 'plot',`,
        `  plotId: ${tsString(s.plotId)},`,
        `  sourceTableId: ${tsString(s.sourceTableId)},`,
        `  xCol: ${tsString(s.xCol)},`,
        `  yCol: ${tsString(s.yCol)},`,
        `  xLabel: ${tsString(s.xLabel)},`,
        `  yLabel: ${tsString(s.yLabel)},`,
        ...(s.fits
          ? [
              `  fits: [`,
              ...s.fits.map(
                (f) => `    { id: ${tsString(f.id)}, label: ${tsString(f.label)} },`,
              ),
              `  ],`,
            ]
          : []),
        ...optionalLine('points', s.points),
        '},',
      ];
    case 'image':
      return [
        '{',
        `  kind: 'image',`,
        `  imageId: ${tsString(s.imageId)},`,
        `  captionFieldId: ${tsString(s.captionFieldId)},`,
        ...(s.maxMB ? [`  maxMB: ${s.maxMB},`] : []),
        ...optionalLine('points', s.points),
        '},',
      ];
    case 'calculation':
      return [
        '{',
        `  kind: 'calculation',`,
        `  fieldId: ${tsString(s.fieldId)},`,
        `  prompt: ${tsString(s.prompt)},`,
        ...(s.equationEditor ? [`  equationEditor: true,`] : []),
        ...optionalLine('points', s.points),
        '},',
      ];
    case 'concept':
      return [
        '{',
        `  kind: 'concept',`,
        `  fieldId: ${tsString(s.fieldId)},`,
        `  prompt: ${tsString(s.prompt)},`,
        ...optionalLine('rows', s.rows),
        ...optionalLine('points', s.points),
        '},',
      ];
  }
}

function optionalLine(name: string, val: number | undefined): string[] {
  return val === undefined ? [] : [`  ${name}: ${val},`];
}

function optionalBoolLine(name: string, val: boolean | undefined): string[] {
  return val === undefined ? [] : [`  ${name}: ${val},`];
}

function tsString(s: string): string {
  // Multi-line content uses a backtick template literal; single-line uses a single-quoted string
  // (prettier will normalize either way per project config).
  if (s.includes('\n')) {
    const escaped = s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return '`' + escaped + '`';
  }
  // Use single-quoted form, escape internal single quotes and backslashes
  const escaped = s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${escaped}'`;
}

function jsonArray(arr: string[]): string {
  return '[' + arr.map((x) => tsString(x)).join(', ') + ']';
}

function indentLines(lines: string[], spaces: number): string[] {
  const pad = ' '.repeat(spaces);
  return lines.map((l) => pad + l);
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let course = 'lab';
  if (args.outputPath.includes('/phy132/') || args.outputPath.includes('\\phy132\\')) {
    course = 'phy132';
  } else if (args.outputPath.includes('/phy114/') || args.outputPath.includes('\\phy114\\')) {
    course = 'phy114';
  }

  const configPath = join(args.legacyPath, 'labConfig.js');
  const formPath = join(args.legacyPath, 'LabReportForm.js');

  const [{ ast: configAst }, { ast: formAst, src: formSrc }] = await Promise.all([
    readAndParse(configPath),
    readAndParse(formPath),
  ]);

  const { meta, initialState } = extractLabConfig(configAst);
  const { sections, warnings } = extractSectionsFromForm(formAst, formSrc);

  const validationWarnings: string[] = [];
  validateFieldIds(sections, initialState, (m) => validationWarnings.push(m));

  if (args.stripUncertainty) {
    warnings.push(
      '--strip-uncertainty was passed; this version still requires manual deletion of `*Uncertainty*` fields/sections.',
    );
  }

  const allWarnings = [...warnings, ...validationWarnings];
  let out = emitLab({
    meta,
    sections,
    legacyPath: args.legacyPath,
    warnings: allWarnings,
    course,
  });

  // Run prettier so the output matches project style (single-quote, 2-space indent, etc.)
  try {
    const config = (await prettier.resolveConfig(args.outputPath)) ?? {};
    out = await prettier.format(out, { ...config, parser: 'typescript' });
  } catch (err) {
    console.warn(`Prettier formatting failed (${(err as Error).message}); writing unformatted output.`);
  }

  await mkdir(dirname(args.outputPath), { recursive: true });
  await writeFile(args.outputPath, out, 'utf-8');

  console.log(`✓ Wrote ${args.outputPath}`);
  console.log(`  ${sections.length} sections from ${basename(args.legacyPath)}`);
  if (allWarnings.length > 0) {
    console.log(`  ${allWarnings.length} warnings:`);
    for (const w of allWarnings) console.log(`    - ${w}`);
  }
  console.log('');
  console.log('Next: open the output file, address every TODO(human) marker, then run');
  console.log('  npm run typecheck && npm run lint');
  console.log('to verify the result compiles.');
}

main().catch((err) => {
  console.error('Migration failed:');
  console.error(err);
  process.exit(1);
});
