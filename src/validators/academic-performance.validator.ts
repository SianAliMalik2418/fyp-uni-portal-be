import { z } from 'zod'
import { attendanceStatuses } from '../models/attendance-session.model.js'

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

export type AttendanceSessionParams = z.infer<typeof attendanceSessionParamsSchema>
export type AttendanceSessionsQuery = z.infer<typeof attendanceSessionsQuerySchema>
export type AttendanceSessionPayload = z.infer<typeof attendanceSessionPayloadSchema>
