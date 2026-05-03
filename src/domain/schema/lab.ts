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

export const FitOptionSchema = z.object({
  id: idSchema,
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
  points: z.number().nonnegative().optional(),
});

export const ConceptSectionSchema = SectionMetadataSchema.extend({
  kind: z.literal('concept'),
  fieldId: idSchema,
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

export const LabSchema = z.object({
  id: idSchema,
  title: nonEmptyText,
  description: z.string(),
  category: nonEmptyText,
  simulations: z.record(idSchema, SimulationSchema),
  studentInfo: StudentInfoOverridesSchema.optional(),
  sections: z.array(SectionSchema).min(1),
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
export type Lab = z.infer<typeof LabSchema>;
