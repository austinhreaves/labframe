import { z } from 'zod';

const idSchema = z.string().min(1);

export const SectionOverridePatchSchema = z.object({
  sectionId: idSchema,
  hidden: z.boolean().optional(),
  points: z.number().nonnegative().optional(),
});

export const CourseLabRefSchema = z.object({
  ref: idSchema,
  labNumber: z.number().int().positive().optional(),
  enabled: z.boolean(),
  overrides: z
    .object({
      sections: z.array(SectionOverridePatchSchema).optional(),
    })
    .optional(),
});

export const CourseSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  storagePrefix: z.string().min(1),
  parentOriginAllowList: z.array(z.string().url()).default([]),
  telemetryEndpoint: z.string().url().optional(),
  labs: z.array(CourseLabRefSchema).min(1),
});

export type SectionOverridePatch = z.infer<typeof SectionOverridePatchSchema>;
export type CourseLabRef = z.infer<typeof CourseLabRefSchema>;
export type Course = z.infer<typeof CourseSchema>;
