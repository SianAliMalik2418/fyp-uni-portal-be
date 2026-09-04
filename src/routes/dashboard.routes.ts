import { Router } from 'express'
import { getRoleDashboardController } from '../controllers/dashboard.controller.js'
import { requireAuth, requirePasswordChanged } from '../middlewares/auth.middleware.js'

export const dashboardRoutes = Router()

dashboardRoutes.use(requireAuth, requirePasswordChanged)
dashboardRoutes.get('/me', getRoleDashboardController)
