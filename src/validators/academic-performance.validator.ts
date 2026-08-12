import { z } from 'zod'
import { attendanceStatuses } from '../models/attendance-session.model.js'
import { assessmentCategories } from '../models/assessment.model.js'
import { markStatuses } from '../models/mark-sheet.model.js'

export const academicPerformanceOfferingParamsSchema = z.object({
  offeringId: z.string().trim().min(1, 'Course offering ID is required'),
})

export type AcademicPerformanceOfferingParams = z.infer<
  typeof academicPerformanceOfferingParamsSchema
>

export const attendanceSessionParamsSchema = z.object({
  sessionId: z.string().trim().min(1, 'Attendance session ID is required'),
})

export const attendanceSessionsQuerySchema = z.object({
  offeringId: z.string().trim().optional(),
})

export const attendanceRecordSchema = z.object({
  studentId: z.string().trim().min(1, 'Student ID is required'),
  status: z.enum(attendanceStatuses),
})

export const attendanceSessionPayloadSchema = z.object({
  offeringId: z.string().trim().min(1, 'Course offering ID is required'),
  date: z.iso.date('Attendance date must use YYYY-MM-DD format'),
  records: z.array(attendanceRecordSchema).min(1, 'At least one attendance record is required'),
})

export const attendanceConfigurationPayloadSchema = z.object({
  minimumAttendancePercentage: z
    .number()
    .int('Minimum attendance percentage must be a whole number')
    .min(1, 'Minimum attendance percentage must be at least 1')
    .max(100, 'Minimum attendance percentage cannot exceed 100'),
})

export const assessmentsQuerySchema = z.object({
  offeringId: z.string().trim().min(1, 'Course offering ID is required'),
})

export const assessmentParamsSchema = z.object({
  assessmentId: z.string().trim().min(1, 'Assessment ID is required'),
})

export const assessmentPayloadSchema = z.object({
  offeringId: z.string().trim().min(1, 'Course offering ID is required'),
  name: z.string().trim().min(1, 'Assessment name is required').max(100),
  category: z.enum(assessmentCategories),
  maximumMarks: z
    .number()
    .positive('Maximum marks must be greater than zero')
    .max(1000, 'Maximum marks cannot exceed 1000'),
})

export const markRecordSchema = z
  .object({
    studentId: z.string().trim().min(1, 'Student ID is required'),
    obtainedMarks: z.number().min(0, 'Marks cannot be negative').optional(),
    status: z.enum(markStatuses).optional(),
  })
  .refine((record) => record.obtainedMarks === undefined || record.status === undefined, {
    message: 'A mark record cannot contain both numeric marks and a special status',
  })

export const markSheetPayloadSchema = z.object({
  records: z.array(markRecordSchema),
})

export type AttendanceSessionParams = z.infer<typeof attendanceSessionParamsSchema>
export type AttendanceSessionsQuery = z.infer<typeof attendanceSessionsQuerySchema>
export type AttendanceSessionPayload = z.infer<typeof attendanceSessionPayloadSchema>
export type AttendanceConfigurationPayload = z.infer<typeof attendanceConfigurationPayloadSchema>
export type AssessmentPayload = z.infer<typeof assessmentPayloadSchema>
export type MarkSheetPayload = z.infer<typeof markSheetPayloadSchema>
