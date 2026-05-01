import { z } from 'zod';

const idSchema = z.string().min(1);

export const PasteEventSchema = z.object({
  text: z.string(),
  at: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  source: z.enum(['clipboard', 'autocomplete', 'ime']),
});

export const FieldMetaSchema = z.object({
  activeMs: z.number().int().nonnegative(),
  keystrokes: z.number().int().nonnegative(),
  deletes: z.number().int().nonnegative(),
  firstFocusAt: z.number().int().nonnegative().optional(),
  lastEditAt: z.number().int().nonnegative().optional(),
});

export const FieldValueSchema = z.object({
  text: z.string(),
  pastes: z.array(PasteEventSchema),
  meta: FieldMetaSchema,
});

export const TableRowSchema = z.record(idSchema, FieldValueSchema);
export const TableDataSchema = z.array(TableRowSchema);

export const BlobRefSchema = z.object({
  idbKey: z.string().min(1),
  mime: z.string().min(1),
  bytes: z.number().int().nonnegative(),
});

export const FitResultSchema = z.object({
  model: z.string().min(1),
  parameters: z.record(z.string(), z.number()),
  r2: z.number().optional(),
});

export const LabAnswersMetaSchema = z.object({
  studentName: z.string(),
  semester: z.enum(['Spring', 'Summer', 'Fall']),
  session: z.enum(['A', 'B', 'C']),
  year: z.string(),
  taName: z.string(),
});

export const LabAnswersSchema = z.object({
  schemaVersion: z.literal(2),
  meta: LabAnswersMetaSchema,
  integrity: z.object({
    signedAs: z.string(),
  }),
  fields: z.record(idSchema, FieldValueSchema),
  tables: z.record(idSchema, TableDataSchema),
  selectedFits: z.record(idSchema, z.string().min(1).nullable()),
  images: z.record(idSchema, BlobRefSchema),
  fits: z.record(idSchema, FitResultSchema),
  status: z.object({
    submitted: z.boolean(),
    lastSavedAt: z.number().int().nonnegative(),
  }),
});

export type PasteEvent = z.infer<typeof PasteEventSchema>;
export type FieldMeta = z.infer<typeof FieldMetaSchema>;
export type FieldValue = z.infer<typeof FieldValueSchema>;
export type TableRow = z.infer<typeof TableRowSchema>;
export type TableData = z.infer<typeof TableDataSchema>;
export type BlobRef = z.infer<typeof BlobRefSchema>;
export type FitResult = z.infer<typeof FitResultSchema>;
export type LabAnswers = z.infer<typeof LabAnswersSchema>;
