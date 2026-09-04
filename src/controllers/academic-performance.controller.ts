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
  getAssessmentStructure,
  getMarkSheet,
  getWeightedMarksSummary,
  listAssessments,
  saveMarkSheetDraft,
  updateAssessmentStructure,
} from '../services/assessment.service.js'
import {
  approveCourseResult,
  getCourseResult,
  getPublishedStudentResults,
  getStudentResultCard,
  reopenCourseResult,
  returnCourseResult,
  submitCourseResult,
} from '../services/result.service.js'
import { getGradingScale, updateGradingScale } from '../services/grading-scale.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import { recordAuditLog } from '../services/audit-log.service.js'
import {
  academicPerformanceOfferingParamsSchema,
  academicPerformanceOfferingsQuerySchema,
  attendanceConfigurationPayloadSchema,
  attendanceSessionParamsSchema,
  attendanceSessionPayloadSchema,
  attendanceSessionsQuerySchema,
  attendanceShortagesQuerySchema,
  assessmentParamsSchema,
  assessmentConfigurationPayloadSchema,
  assessmentPayloadSchema,
  assessmentsQuerySchema,
  markSheetPayloadSchema,
  resultCommentPayloadSchema,
  resultParamsSchema,
  semesterResultParamsSchema,
  gradingScalePayloadSchema,
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

export const getCourseResultController = asyncHandler(async (req, res) => {
  const { offeringId } = academicPerformanceOfferingParamsSchema.parse(req.params)
  const result = await getCourseResult(req.auth!.user, offeringId)
  res.status(200).json({ result })
})

export const submitCourseResultController = asyncHandler(async (req, res) => {
  const { offeringId } = academicPerformanceOfferingParamsSchema.parse(req.params)
  const result = await submitCourseResult(req.auth!.user, offeringId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'submitted',
    module: 'results',
    affectedRecord: { id: result.id ?? offeringId },
  })
  res.status(200).json({ message: 'Result submitted for HOD approval.', result })
})

export const approveCourseResultController = asyncHandler(async (req, res) => {
  const { resultId } = resultParamsSchema.parse(req.params)
  const result = await approveCourseResult(req.auth!.user, resultId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'approved',
    module: 'results',
    affectedRecord: { id: resultId },
  })
  res.status(200).json({ message: 'Result approved and published.', result })
})

export const returnCourseResultController = asyncHandler(async (req, res) => {
  const { resultId } = resultParamsSchema.parse(req.params)
  const payload = resultCommentPayloadSchema.parse(req.body)
  const result = await returnCourseResult(req.auth!.user, resultId, payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'returned',
    module: 'results',
    affectedRecord: { id: resultId },
    reason: payload.comment,
  })
  res.status(200).json({ message: 'Result returned to the teacher.', result })
})

export const reopenCourseResultController = asyncHandler(async (req, res) => {
  const { resultId } = resultParamsSchema.parse(req.params)
  const payload = resultCommentPayloadSchema.parse(req.body)
  const result = await reopenCourseResult(req.auth!.user, resultId, payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'reopened',
    module: 'results',
    affectedRecord: { id: resultId },
    reason: payload.comment,
  })
  res.status(200).json({ message: 'Result reopened for correction.', result })
})

export const getPublishedStudentResultsController = asyncHandler(async (req, res) => {
  const results = await getPublishedStudentResults(req.auth!.user)
  res.status(200).json(results)
})

export const getStudentResultCardController = asyncHandler(async (req, res) => {
  const { semesterId } = semesterResultParamsSchema.parse(req.params)
  const resultCard = await getStudentResultCard(req.auth!.user, semesterId)
  res.status(200).json({ resultCard })
})

export const getGradingScaleController = asyncHandler(async (_req, res) => {
  const gradingScale = await getGradingScale()
  res.status(200).json({ gradingScale })
})

export const updateGradingScaleController = asyncHandler(async (req, res) => {
  const payload = gradingScalePayloadSchema.parse(req.body)
  const gradingScale = await updateGradingScale(payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'updated',
    module: 'results',
    affectedRecord: { id: 'grading-scale', label: 'Grading scale' },
  })
  res.status(200).json({ message: 'Grading scale updated.', gradingScale })
})

export const getAssessmentStructureController = asyncHandler(async (_req, res) => {
  const structure = await getAssessmentStructure()

  res.status(200).json({ structure })
})

export const updateAssessmentStructureController = asyncHandler(async (req, res) => {
  const payload = assessmentConfigurationPayloadSchema.parse(req.body)
  const structure = await updateAssessmentStructure(payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'updated',
    module: 'assessments',
    affectedRecord: { id: 'assessment-structure', label: 'Assessment structure' },
  })

  res.status(200).json({
    message: 'Assessment structure updated.',
    structure,
  })
})

export const createAssessmentController = asyncHandler(async (req, res) => {
  const payload = assessmentPayloadSchema.parse(req.body)
  const assessment = await createAssessment(req.auth!.user, payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'created',
    module: 'assessments',
    affectedRecord: { id: assessment.id, label: assessment.name },
  })

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
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'saved',
    module: 'marks',
    affectedRecord: { id: assessmentId, label: 'Marks draft' },
  })

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
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'updated',
    module: 'attendance',
    affectedRecord: { id: 'attendance-configuration', label: 'Attendance configuration' },
  })

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
  const query = academicPerformanceOfferingsQuerySchema.parse(req.query)
  const offerings = await listAcademicPerformanceOfferings(req.auth!.user, query)

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
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'saved',
    module: 'attendance',
    affectedRecord: {
      id: session.id,
      label: `${session.offering.course.title} attendance for ${session.date}`,
    },
  })

  res.status(200).json({ message: 'Attendance saved successfully.', session })
})

export const updateAttendanceSessionController = asyncHandler(async (req, res) => {
  const { sessionId } = attendanceSessionParamsSchema.parse(req.params)
  const payload = attendanceSessionPayloadSchema.parse(req.body)
  const session = await updateAttendanceSession(req.auth!.user, sessionId, payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'updated',
    module: 'attendance',
    affectedRecord: {
      id: session.id,
      label: `${session.offering.course.title} attendance for ${session.date}`,
    },
  })

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
  const query = attendanceShortagesQuerySchema.parse(req.query)
  const result = await listLowAttendanceStudents(req.auth!.user, query)

  res.status(200).json(result)
})
