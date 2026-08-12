import type { RequestHandler } from 'express'
import {
  getAttendanceSession,
  getAcademicPerformanceContext,
  getAcademicPerformancePlaceholder,
  getStudentAttendanceSummaries,
  listAttendanceHistory,
  listAcademicPerformanceOfferings,
  listAcademicPerformanceOfferingStudents,
  listLowAttendanceStudents,
  saveAttendanceSession,
  updateAttendanceSession,
  type AcademicPerformanceModule,
} from '../services/academic-performance.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  academicPerformanceOfferingParamsSchema,
  attendanceSessionParamsSchema,
  attendanceSessionPayloadSchema,
  attendanceSessionsQuerySchema,
} from '../validators/academic-performance.validator.js'

function createAcademicPerformanceController(module: AcademicPerformanceModule): RequestHandler {
  return (_req, res) => {
    res.json(getAcademicPerformancePlaceholder(module))
  }
}

export const getAttendancePlaceholder = createAcademicPerformanceController('attendance')
export const getAssessmentsPlaceholder = createAcademicPerformanceController('assessments')
export const getMarksPlaceholder = createAcademicPerformanceController('marks')
export const getResultsPlaceholder = createAcademicPerformanceController('results')

export const getAcademicPerformanceContextController = asyncHandler(async (req, res) => {
  const context = await getAcademicPerformanceContext(req.auth?.user.id)

  res.status(200).json(context)
})

export const listAcademicPerformanceOfferingsController = asyncHandler(async (req, res) => {
  const offerings = await listAcademicPerformanceOfferings(req.auth!.user)

  res.status(200).json({ offerings })
})

export const listAcademicPerformanceOfferingStudentsController = asyncHandler(async (req, res) => {
  const { offeringId } = academicPerformanceOfferingParamsSchema.parse(req.params)
  const context = await listAcademicPerformanceOfferingStudents(req.auth!.user, offeringId)

  res.status(200).json(context)
})

export const saveAttendanceSessionController = asyncHandler(async (req, res) => {
  const payload = attendanceSessionPayloadSchema.parse(req.body)
  const session = await saveAttendanceSession(req.auth!.user, payload)

  res.status(200).json({ message: 'Attendance saved successfully.', session })
})

export const updateAttendanceSessionController = asyncHandler(async (req, res) => {
  const { sessionId } = attendanceSessionParamsSchema.parse(req.params)
  const payload = attendanceSessionPayloadSchema.parse(req.body)
  const session = await updateAttendanceSession(req.auth!.user, sessionId, payload)

  res.status(200).json({ message: 'Attendance updated successfully.', session })
})

export const listAttendanceHistoryController = asyncHandler(async (req, res) => {
  const { offeringId } = attendanceSessionsQuerySchema.parse(req.query)
  const sessions = await listAttendanceHistory(req.auth!.user, offeringId)

  res.status(200).json({ sessions })
})

export const getAttendanceSessionController = asyncHandler(async (req, res) => {
  const { sessionId } = attendanceSessionParamsSchema.parse(req.params)
  const session = await getAttendanceSession(req.auth!.user, sessionId)

  res.status(200).json({ session })
})

export const getStudentAttendanceSummariesController = asyncHandler(async (req, res) => {
  const summaries = await getStudentAttendanceSummaries(req.auth!.user)

  res.status(200).json({ summaries })
})

export const listLowAttendanceStudentsController = asyncHandler(async (req, res) => {
  const shortages = await listLowAttendanceStudents(req.auth!.user)

  res.status(200).json({ shortages })
})
