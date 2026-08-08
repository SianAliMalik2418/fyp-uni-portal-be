import { Router } from 'express'
import {
  getAssessmentsPlaceholder,
  getAttendancePlaceholder,
  getMarksPlaceholder,
  getResultsPlaceholder,
} from '../controllers/academic-performance.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'
import { getAcademicPerformanceAllowedRoles } from '../services/academic-performance.service.js'

export const attendanceRoutes = Router()
export const assessmentsRoutes = Router()
export const marksRoutes = Router()
export const resultsRoutes = Router()

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
