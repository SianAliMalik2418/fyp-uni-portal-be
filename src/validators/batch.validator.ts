import { z } from 'zod'

export const batchParamsSchema = z.object({
  batchId: z.string().trim().min(1, 'Batch ID is required'),
})

const currentYear = new Date().getFullYear()

const batchFields = {
  name: z.string().trim().min(2, 'Batch name is required'),
  programId: z.string().trim().min(1, 'Program is required'),
  startingYear: z
    .number()
    .int('Starting year must be a whole number')
    .min(2000, 'Starting year must be 2000 or later')
    .max(currentYear + 10, 'Starting year is too far in the future'),
  expectedGraduationYear: z
    .number()
    .int('Expected graduation year must be a whole number')
    .min(2000, 'Expected graduation year must be 2000 or later')
    .max(currentYear + 20, 'Expected graduation year is too far in the future'),
  isActive: z.boolean(),
}

function graduationAfterStart(value: { startingYear?: number; expectedGraduationYear?: number }) {
  if (value.startingYear === undefined || value.expectedGraduationYear === undefined) {
    return true
  }

  return value.expectedGraduationYear >= value.startingYear
}

export const createBatchSchema = z
  .object({
    ...batchFields,
    isActive: batchFields.isActive.default(true),
  })
  .refine(graduationAfterStart, {
    message: 'Expected graduation year must be after starting year',
    path: ['expectedGraduationYear'],
  })

export const updateBatchSchema = z
  .object(batchFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one batch field is required',
  })
  .refine(graduationAfterStart, {
    message: 'Expected graduation year must be after starting year',
    path: ['expectedGraduationYear'],
  })

export type CreateBatchPayload = z.infer<typeof createBatchSchema>
export type UpdateBatchPayload = z.infer<typeof updateBatchSchema>
