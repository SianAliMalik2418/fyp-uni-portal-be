import { Router } from 'express'
import { getStudentDashboardController } from '../controllers/student-dashboard.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const studentDashboardRoutes = Router()

studentDashboardRoutes.use(requireAuth, requireRoles('student'))
studentDashboardRoutes.get('/', getStudentDashboardController)
