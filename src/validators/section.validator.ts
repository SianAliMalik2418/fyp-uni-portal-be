import { z } from 'zod'

export const sectionParamsSchema = z.object({
  sectionId: z.string().trim().min(1, 'Section ID is required'),
})

const sectionFields = {
  name: z.string().trim().min(1, 'Section name is required').max(32, 'Section name is too long'),
  programId: z.string().trim().min(1, 'Program is required'),
  batchId: z.string().trim().min(1, 'Batch is required'),
  semesterId: z.string().trim().min(1, 'Semester is required'),
  isActive: z.boolean(),
}

export const createSectionSchema = z.object({
  ...sectionFields,
  isActive: sectionFields.isActive.default(true),
})

export const updateSectionSchema = z
  .object(sectionFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one section field is required',
  })

export type CreateSectionPayload = z.infer<typeof createSectionSchema>
export type UpdateSectionPayload = z.infer<typeof updateSectionSchema>
