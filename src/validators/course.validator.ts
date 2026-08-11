import { z } from 'zod'

export const courseParamsSchema = z.object({
  courseId: z.string().trim().min(1, 'Course ID is required'),
})

export const courseOfferingParamsSchema = z.object({
  offeringId: z.string().trim().min(1, 'Course offering ID is required'),
})

export const sectionCourseParamsSchema = z.object({
  sectionId: z.string().trim().min(1, 'Section ID is required'),
})

const courseFields = {
  code: z
    .string()
    .trim()
    .min(2, 'Course code is required')
    .max(24, 'Course code must be 24 characters or less')
    .regex(/^[A-Za-z0-9-]+$/, 'Course code can only contain letters, numbers, and hyphens'),
  title: z.string().trim().min(2, 'Course title is required'),
  creditHours: z
    .number()
    .int('Credit hours must be a whole number')
    .min(1, 'Credit hours must be at least 1')
    .max(6, 'Credit hours must be 6 or less'),
  departmentId: z.string().trim().min(1, 'Department is required'),
  programId: z.string().trim().min(1, 'Program is required'),
  semesterId: z.string().trim().min(1, 'Semester is required'),
  description: z.string().trim().optional(),
  isActive: z.boolean(),
}

export const createCourseSchema = z.object({
  ...courseFields,
  isActive: courseFields.isActive.default(true),
})

export const updateCourseSchema = z
  .object(courseFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one course field is required',
  })

export const sectionCourseAssignmentSchema = z.object({
  courseIds: z.array(z.string().trim().min(1, 'Course ID is required')).default([]),
})

export const teacherAssignmentSchema = z.object({
  teacherId: z.string().trim().min(1, 'Teacher is required').nullable(),
})

export type CreateCoursePayload = z.infer<typeof createCourseSchema>
export type UpdateCoursePayload = z.infer<typeof updateCourseSchema>
export type SectionCourseAssignmentPayload = z.infer<typeof sectionCourseAssignmentSchema>
export type TeacherAssignmentPayload = z.infer<typeof teacherAssignmentSchema>
