import { z } from 'zod'

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/

function isCalendarDate(value: string) {
  if (!datePattern.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

export const examParamsSchema = z.object({
  examId: z.string().trim().min(1, 'Exam ID is required'),
})

export const adminExamQuerySchema = z.object({
  sectionId: z.string().trim().min(1, 'Section ID is required'),
})

export const saveExamSchema = z
  .object({
    examType: z.string().trim().min(1, 'Exam type is required').max(64),
    courseOfferingId: z.string().trim().min(1, 'Course offering is required'),
    examDate: z
      .string()
      .refine(isCalendarDate, 'Exam date must be a valid date in YYYY-MM-DD format'),
    startTime: z.string().regex(timePattern, 'Start time must use HH:MM format'),
    endTime: z.string().regex(timePattern, 'End time must use HH:MM format'),
    room: z.string().trim().min(1, 'Room is required').max(64),
    instructions: z.string().trim().max(1000).optional(),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })

export type SaveExamPayload = z.infer<typeof saveExamSchema>
