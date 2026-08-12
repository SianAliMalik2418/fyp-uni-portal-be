import type { RequestHandler } from 'express'
import {
  getAttendanceSession,
  getAttendanceConfiguration,
  getAcademicPerformanceContext,
  getAcademicPerformancePlaceholder,
  getStudentAttendanceSummaries,
  listAttendanceHistory,
  listAcademicPerformanceOfferings,
  listAcademicPerformanceOfferingStudents,
  listLowAttendanceStudents,
  saveAttendanceSession,
  updateAttendanceSession,
  updateAttendanceConfiguration,
  type AcademicPerformanceModule,
} from '../services/academic-performance.service.js'
import {
  createAssessment,
  getAssessmentCategories,
  getMarkSheet,
  getWeightedMarksSummary,
  listAssessments,
  saveMarkSheetDraft,
} from '../services/assessment.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  academicPerformanceOfferingParamsSchema,
  attendanceConfigurationPayloadSchema,
  attendanceSessionParamsSchema,
  attendanceSessionPayloadSchema,
  attendanceSessionsQuerySchema,
  assessmentParamsSchema,
  assessmentPayloadSchema,
  assessmentsQuerySchema,
  markSheetPayloadSchema,
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

export const getAssessmentCategoriesController: RequestHandler = (_req, res) => {
  res.status(200).json({ categories: getAssessmentCategories() })
}

export const createAssessmentController = asyncHandler(async (req, res) => {
  const payload = assessmentPayloadSchema.parse(req.body)
  const assessment = await createAssessment(req.auth!.user, payload)

  res.status(201).json({ message: 'Assessment created successfully.', assessment })
})

export const listAssessmentsController = asyncHandler(async (req, res) => {
  const { offeringId } = assessmentsQuerySchema.parse(req.query)
  const assessments = await listAssessments(req.auth!.user, offeringId)

  res.status(200).json({ assessments })
})

export const getMarkSheetController = asyncHandler(async (req, res) => {
  const { assessmentId } = assessmentParamsSchema.parse(req.params)
  const sheet = await getMarkSheet(req.auth!.user, assessmentId)

  res.status(200).json({ sheet })
})

export const saveMarkSheetDraftController = asyncHandler(async (req, res) => {
  const { assessmentId } = assessmentParamsSchema.parse(req.params)
  const payload = markSheetPayloadSchema.parse(req.body)
  const sheet = await saveMarkSheetDraft(req.auth!.user, assessmentId, payload)

  res.status(200).json({ message: 'Marks draft saved successfully.', sheet })
})

export const getWeightedMarksSummaryController = asyncHandler(async (req, res) => {
  const { offeringId } = assessmentsQuerySchema.parse(req.query)
  const summaries = await getWeightedMarksSummary(req.auth!.user, offeringId)

  res.status(200).json({ summaries })
})

export const getAttendanceConfigurationController = asyncHandler(async (_req, res) => {
  const configuration = await getAttendanceConfiguration()

  res.status(200).json({ configuration })
})

export const updateAttendanceConfigurationController = asyncHandler(async (req, res) => {
  const payload = attendanceConfigurationPayloadSchema.parse(req.body)
  const configuration = await updateAttendanceConfiguration(payload)

  res.status(200).json({
    message: 'Attendance settings updated.',
    configuration,
  })
})

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
