import { z } from 'zod';

const idSchema = z.string().min(1);
const nonEmptyText = z.string().min(1);

export const NumericRowSchema = z.record(z.string(), z.number());

export const InputColumnSchema = z.object({
  id: idSchema,
  label: nonEmptyText,
  kind: z.literal('input'),
  unit: z.string().min(1).optional(),
});

export const DerivedColumnSchema = z.object({
  id: idSchema,
  label: nonEmptyText,
  kind: z.literal('derived'),
  formulaLabel: z.string().optional(),
  deps: z.array(idSchema).min(1),
  formula: z.function().args(NumericRowSchema).returns(z.number()),
  precision: z.number().int().min(0).optional(),
});

export const ColumnSchema = z.discriminatedUnion('kind', [InputColumnSchema, DerivedColumnSchema]);

export const SimulationSchema = z.object({
  url: z.string().url(),
  title: nonEmptyText,
  allow: z.string().min(1).optional(),
});

export const StudentInfoOverridesSchema = z
  .object({
    requireTaName: z.boolean().optional(),
    integrityAgreementText: z.string().min(1).optional(),
  })
  .strict();

/** Shared optional fields for table-of-contents authoring on every section variant. */
export const SectionMetadataSchema = z.object({
  tocHidden: z.boolean().optional(),
  tocLabel: z.string().optional(),
  /** Omit this section from the PDF body and Process Record (presentation only).
   *  It still renders on screen and never affects the signed envelope. Used to
   *  drop background/theory/reference blocks from the report (Track P, P-C). */
  pdfHidden: z.boolean().optional(),
});

export const InstructionsSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('instructions'),
  html: z.string(),
  points: z.number().nonnegative().optional(),
});

export const ObjectiveSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('objective'),
  fieldId: idSchema,
  prompt: z.string().optional(),
  rows: z.number().int().positive().optional(),
  points: z.number().nonnegative().optional(),
});

export const MeasurementSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('measurement'),
  fieldId: idSchema,
  label: nonEmptyText,
  unit: z.string().min(1).optional(),
  points: z.number().nonnegative().optional(),
});

export const MultiMeasurementSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('multiMeasurement'),
  rows: z
    .array(
      z.object({
        id: idSchema,
        label: nonEmptyText,
        unit: z.string().min(1).optional(),
      }),
    )
    .min(1),
  points: z.number().nonnegative().optional(),
});

export const DataTableSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('dataTable'),
  tableId: idSchema,
  columns: z.array(ColumnSchema).min(1),
  rowCount: z.number().int().positive(),
  points: z.number().nonnegative().optional(),
});

// GRAPHING_EXPANSION_SPEC.md section 8 sketches a discriminated union; until a
// fit variant carries extra fields (Phase B transforms), an id enum gives the
// same validation with less noise. Convert to z.discriminatedUnion when a
// variant gains per-fit fields. Unknown fit ids fail at validateLab time
// (enforced repo-wide by `npm run verify:labs`), not at render time.
export const FitOptionSchema = z.object({
  id: z.enum(['linear', 'proportional', 'powerTransfer']),
  label: nonEmptyText,
});

export const PlotSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('plot'),
  plotId: idSchema,
  sourceTableId: idSchema,
  xCol: idSchema,
  yCol: idSchema,
  xLabel: nonEmptyText,
  yLabel: nonEmptyText,
  title: z.string().optional(),
  fits: z.array(FitOptionSchema).optional(),
  points: z.number().nonnegative().optional(),
});

export const ImageSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('image'),
  imageId: idSchema,
  captionFieldId: idSchema,
  maxMB: z.number().positive().optional(),
  points: z.number().nonnegative().optional(),
});

export const CalculationSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('calculation'),
  fieldId: idSchema,
  prompt: nonEmptyText,
  equationEditor: z.boolean().optional(),
  responseMode: z.enum(['text', 'image', 'draw']).optional(),
  responseModes: z
    .array(z.enum(['text', 'draw', 'image']))
    .min(1)
    .optional(),
  imageId: idSchema.optional(),
  maxMB: z.number().positive().optional(),
  points: z.number().nonnegative().optional(),
});

export const ConceptSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('concept'),
  fieldId: idSchema,
  /** Optional markdown preamble rendered above the response field. Used to inline
   *  procedural steps so they sit visually with the prompt that follows them,
   *  cutting down on standalone `instructions` blocks. */
  preamble: z.string().optional(),
  prompt: nonEmptyText,
  rows: z.number().int().positive().optional(),
  points: z.number().nonnegative().optional(),
});

export const SectionSchema = z.discriminatedUnion('kind', [
  InstructionsSectionSchema,
  ObjectiveSectionSchema,
  MeasurementSectionSchema,
  MultiMeasurementSectionSchema,
  DataTableSectionSchema,
  PlotSectionSchema,
  ImageSectionSchema,
  CalculationSectionSchema,
  ConceptSectionSchema,
]);

/**
 * Pass 5: an optional grouping layer over the flat `sections` array. Each part
 * owns one simulation and covers a contiguous index range of sections. Parts
 * cover a prefix `[0, R)` of the sections; anything after `R` is the sim-less
 * "review tail" (discussion / conclusion), surfaced in Finish & Review.
 */
export const PartSchema = z.object({
  /** Short key used in the `?part=` URL param, e.g. "1A". */
  key: nonEmptyText,
  /** Display title shown in the sticky header and part nav. */
  title: nonEmptyText,
  /** Key into the lab's `simulations` record; reuse across parts is allowed. */
  simulationId: idSchema,
  /** `[startIndex, endIndexExclusive)` into `lab.sections`. */
  sectionRange: z.tuple([z.number().int().nonnegative(), z.number().int().positive()]),
});

export const LabSchema = z
  .object({
    id: idSchema,
    title: nonEmptyText,
    description: z.string(),
    category: nonEmptyText,
    simulations: z.record(idSchema, SimulationSchema),
    studentInfo: StudentInfoOverridesSchema.optional(),
    sections: z.array(SectionSchema).min(1),
    parts: z.array(PartSchema).min(2).optional(),
  })
  .superRefine((lab, ctx) => {
    if (!lab.parts || lab.parts.length === 0) {
      return;
    }
    const parts = lab.parts;
    const sectionCount = lab.sections.length;

    parts.forEach((part, index) => {
      const [start, end] = part.sectionRange;
      const at = (message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['parts', index] });

      // Rule 0: "review" is reserved for the Finish & Review step, which shares
      // the ?part= namespace; a real part keyed "review" would be unreachable.
      if (part.key === 'review') {
        at('part key "review" is reserved for the Finish & Review step');
      }

      // Rule 1: simulationId resolves to a key in lab.simulations (reuse allowed).
      if (!(part.simulationId in lab.simulations)) {
        at(`part "${part.key}" references unknown simulationId "${part.simulationId}"`);
      }

      // Rule 3: range is well-formed and within bounds.
      if (start >= end) {
        at(`part "${part.key}" has an empty or inverted sectionRange [${start}, ${end})`);
      }
      if (end > sectionCount) {
        at(`part "${part.key}" sectionRange end ${end} exceeds sections length ${sectionCount}`);
      }

      // Rule 2: parts form a contiguous run starting at 0 (no gaps, no overlap).
      const expectedStart = index === 0 ? 0 : parts[index - 1]!.sectionRange[1];
      if (start !== expectedStart) {
        at(
          `part "${part.key}" must start at index ${expectedStart} ` +
            `(contiguous with the previous part), got ${start}`,
        );
      }
    });

    // Rule 4: parts cover a prefix [0, R); sections [R, length) are the review
    // tail and are allowed (possibly empty). Sections before R must all belong
    // to a part, which the contiguity check above already guarantees.
  });

export type NumericRow = z.infer<typeof NumericRowSchema>;
export type InputColumn = z.infer<typeof InputColumnSchema>;
export type DerivedColumn = z.infer<typeof DerivedColumnSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type FitOption = z.infer<typeof FitOptionSchema>;
export type InstructionsSection = z.infer<typeof InstructionsSectionSchema>;
export type ObjectiveSection = z.infer<typeof ObjectiveSectionSchema>;
export type MeasurementSection = z.infer<typeof MeasurementSectionSchema>;
export type MultiMeasurementSection = z.infer<typeof MultiMeasurementSectionSchema>;
export type DataTableSection = z.infer<typeof DataTableSectionSchema>;
export type PlotSection = z.infer<typeof PlotSectionSchema>;
export type ImageSection = z.infer<typeof ImageSectionSchema>;
export type CalculationSection = z.infer<typeof CalculationSectionSchema>;
export type ConceptSection = z.infer<typeof ConceptSectionSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Part = z.infer<typeof PartSchema>;
export type Lab = z.infer<typeof LabSchema>;
