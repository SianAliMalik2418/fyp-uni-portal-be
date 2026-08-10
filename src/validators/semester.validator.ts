import { z } from 'zod'

export const semesterParamsSchema = z.object({
  semesterId: z.string().trim().min(1, 'Semester ID is required'),
})

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? new Date(value) : undefined))
  .refine((value) => value === undefined || !Number.isNaN(value.getTime()), {
    message: 'Date must be valid',
  })

const semesterFields = {
  name: z.string().trim().min(2, 'Semester name is required'),
  academicYear: z
    .string()
    .trim()
    .min(4, 'Academic year is required')
    .max(16, 'Academic year must be 16 characters or less'),
  startsAt: optionalDate,
  endsAt: optionalDate,
  isActive: z.boolean(),
  isClosed: z.boolean(),
}

function endAfterStart(value: { startsAt?: Date; endsAt?: Date }) {
  if (!value.startsAt || !value.endsAt) {
    return true
  }

  return value.endsAt >= value.startsAt
}

export const createSemesterSchema = z
  .object({
    ...semesterFields,
    isActive: semesterFields.isActive.default(false),
    isClosed: semesterFields.isClosed.default(false),
  })
  .refine(endAfterStart, {
    message: 'End date must be after start date',
    path: ['endsAt'],
  })

export const updateSemesterSchema = z
  .object(semesterFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one semester field is required',
  })
  .refine(endAfterStart, {
    message: 'End date must be after start date',
    path: ['endsAt'],
  })

export type CreateSemesterPayload = z.infer<typeof createSemesterSchema>
export type UpdateSemesterPayload = z.infer<typeof updateSemesterSchema>
