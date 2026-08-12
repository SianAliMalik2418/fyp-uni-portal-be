import { Router } from 'express'
import {
  getAttendanceSessionController,
  getAttendanceConfigurationController,
  getAcademicPerformanceContextController,
  getAttendancePlaceholder,
  getAssessmentCategoriesController,
  createAssessmentController,
  listAssessmentsController,
  getMarkSheetController,
  saveMarkSheetDraftController,
  getWeightedMarksSummaryController,
  getResultsPlaceholder,
  getStudentAttendanceSummariesController,
  listAttendanceHistoryController,
  listAcademicPerformanceOfferingStudentsController,
  listAcademicPerformanceOfferingsController,
  listLowAttendanceStudentsController,
  saveAttendanceSessionController,
  updateAttendanceSessionController,
  updateAttendanceConfigurationController,
} from '../controllers/academic-performance.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'
import { getAcademicPerformanceAllowedRoles } from '../services/academic-performance.service.js'

export const attendanceRoutes = Router()
export const assessmentsRoutes = Router()
export const marksRoutes = Router()
export const resultsRoutes = Router()
export const academicPerformanceRoutes = Router()

academicPerformanceRoutes.use(requireAuth, requireRoles('student', 'teacher', 'hod', 'admin'))
academicPerformanceRoutes.get('/context', getAcademicPerformanceContextController)
academicPerformanceRoutes.get('/offerings', listAcademicPerformanceOfferingsController)
academicPerformanceRoutes.get(
  '/offerings/:offeringId/students',
  listAcademicPerformanceOfferingStudentsController
)

attendanceRoutes.use(requireAuth, requireRoles(...getAcademicPerformanceAllowedRoles('attendance')))
attendanceRoutes.get('/', getAttendancePlaceholder)
attendanceRoutes.get('/configuration', getAttendanceConfigurationController)
attendanceRoutes.put(
  '/configuration',
  requireRoles('admin'),
  updateAttendanceConfigurationController
)
attendanceRoutes.get(
  '/sessions',
  requireRoles('teacher', 'hod', 'admin'),
  listAttendanceHistoryController
)
attendanceRoutes.post('/sessions', requireRoles('teacher'), saveAttendanceSessionController)
attendanceRoutes.get('/sessions/:sessionId', getAttendanceSessionController)
attendanceRoutes.put(
  '/sessions/:sessionId',
  requireRoles('teacher'),
  updateAttendanceSessionController
)
attendanceRoutes.get('/student', requireRoles('student'), getStudentAttendanceSummariesController)
attendanceRoutes.get(
  '/shortages',
  requireRoles('hod', 'admin'),
  listLowAttendanceStudentsController
)

assessmentsRoutes.use(
  requireAuth,
  requireRoles(...getAcademicPerformanceAllowedRoles('assessments'))
)
assessmentsRoutes.get('/categories', getAssessmentCategoriesController)
assessmentsRoutes.get('/', listAssessmentsController)
assessmentsRoutes.post('/', requireRoles('teacher'), createAssessmentController)

marksRoutes.use(requireAuth, requireRoles(...getAcademicPerformanceAllowedRoles('marks')))
marksRoutes.get('/summary', getWeightedMarksSummaryController)
marksRoutes.get('/:assessmentId', getMarkSheetController)
marksRoutes.put('/:assessmentId/draft', requireRoles('teacher'), saveMarkSheetDraftController)

resultsRoutes.use(requireAuth, requireRoles(...getAcademicPerformanceAllowedRoles('results')))
resultsRoutes.get('/', getResultsPlaceholder)
