import { z } from 'zod'

export const programParamsSchema = z.object({
  programId: z.string().trim().min(1, 'Program ID is required'),
})

const programFields = {
  name: z.string().trim().min(2, 'Program name is required'),
  code: z
    .string()
    .trim()
    .min(2, 'Program code is required')
    .max(16, 'Program code must be 16 characters or less')
    .regex(/^[A-Za-z0-9-]+$/, 'Program code can only contain letters, numbers, and hyphens'),
  departmentId: z.string().trim().min(1, 'Department is required'),
  totalSemesters: z
    .number()
    .int('Total semesters must be a whole number')
    .min(1, 'Total semesters must be at least 1')
    .max(16, 'Total semesters must be 16 or less'),
  duration: z
    .number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1')
    .max(120, 'Duration must be 120 or less'),
  durationUnit: z.enum(['years', 'months'], {
    error: 'Duration unit must be years or months',
  }),
  isActive: z.boolean(),
}

export const createProgramSchema = z.object({
  ...programFields,
  isActive: programFields.isActive.default(true),
})

export const updateProgramSchema = z
  .object(programFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one program field is required',
  })

export type CreateProgramPayload = z.infer<typeof createProgramSchema>
export type UpdateProgramPayload = z.infer<typeof updateProgramSchema>
