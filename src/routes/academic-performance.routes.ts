import { Router } from 'express'
import {
  getAcademicPerformanceContextController,
  getAssessmentsPlaceholder,
  getAttendancePlaceholder,
  getMarksPlaceholder,
  getResultsPlaceholder,
  listAcademicPerformanceOfferingStudentsController,
  listAcademicPerformanceOfferingsController,
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

assessmentsRoutes.use(
  requireAuth,
  requireRoles(...getAcademicPerformanceAllowedRoles('assessments'))
)
assessmentsRoutes.get('/', getAssessmentsPlaceholder)

marksRoutes.use(requireAuth, requireRoles(...getAcademicPerformanceAllowedRoles('marks')))
marksRoutes.get('/', getMarksPlaceholder)

resultsRoutes.use(requireAuth, requireRoles(...getAcademicPerformanceAllowedRoles('results')))
resultsRoutes.get('/', getResultsPlaceholder)
