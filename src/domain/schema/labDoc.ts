import { z } from 'zod';

import {
  CalculationSectionSchema,
  ConceptSectionSchema,
  ImageSectionSchema,
  InputColumnSchema,
  InstructionsSectionSchema,
  MeasurementSectionSchema,
  MultiMeasurementSectionSchema,
  ObjectiveSectionSchema,
  PlotSectionSchema,
  SectionMetadataSchema,
  SimulationSchema,
} from '@/domain/schema/lab';

// LabDoc is the stored, serializable, author-facing form of a lab. The runtime
// `Lab` (in ./lab.ts) stays the form the renderer consumes; `compileLabDoc`
// bridges the two. See docs/specs/ASSIGNMENT_CONSTRUCTOR_SPEC.md and ADR-0005.

const idSchema = z.string().min(1);
const nonEmptyText = z.string().min(1);

/**
 * Authored data tables are input-only at MVP. Derived columns ship in Phase E
 * via the arithmetic DSL (ADR-0007); they are deliberately not representable
 * here, so a LabDoc carries no executable formula.
 */
export const LabDocDataTableSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('dataTable'),
  tableId: idSchema,
  columns: z.array(InputColumnSchema).min(1),
  rowCount: z.number().int().positive(),
  points: z.number().nonnegative().optional(),
});

export const LabDocSectionSchema = z.discriminatedUnion('kind', [
  InstructionsSectionSchema,
  ObjectiveSectionSchema,
  MeasurementSectionSchema,
  MultiMeasurementSectionSchema,
  LabDocDataTableSectionSchema,
  PlotSectionSchema,
  ImageSectionSchema,
  CalculationSectionSchema,
  ConceptSectionSchema,
]);

export const LabDocMetaSchema = z
  .object({
    title: nonEmptyText,
    author: nonEmptyText,
    authorContact: z.string().min(1).optional(),
    humanVersion: z.string().min(1).optional(),
    createdAt: nonEmptyText,
    updatedAt: nonEmptyText,
  })
  .strict();

export const LabDocAssetMimeSchema = z.enum(['image/png', 'image/jpeg', 'image/webp']);

export const LabDocAssetSchema = z
  .object({
    mime: LabDocAssetMimeSchema,
    dataBase64: z.string().min(1),
    bytes: z.number().int().nonnegative(),
  })
  .strict();

export const LabDocSchema = z
  .object({
    schemaVersion: z.literal(1),
    meta: LabDocMetaSchema,
    simulations: z.record(idSchema, SimulationSchema),
    integrityAgreement: z.object({ customText: z.string().optional() }).strict().optional(),
    assets: z.record(idSchema, LabDocAssetSchema),
    sections: z.array(LabDocSectionSchema).min(1),
  })
  .strict();

export type LabDocSection = z.infer<typeof LabDocSectionSchema>;
export type LabDocMeta = z.infer<typeof LabDocMetaSchema>;
export type LabDocAsset = z.infer<typeof LabDocAssetSchema>;
export type LabDocAssetMime = z.infer<typeof LabDocAssetMimeSchema>;
export type LabDoc = z.infer<typeof LabDocSchema>;
