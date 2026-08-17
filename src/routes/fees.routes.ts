import { Router } from 'express'
import {
  getOwnFeeController,
  getStudentFeeController,
  upsertStudentFeeController,
} from '../controllers/fees.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const feesRoutes = Router()

feesRoutes.use(requireAuth)
feesRoutes.get('/me', requireRoles('student'), getOwnFeeController)
feesRoutes.get('/students/:studentId', requireRoles('admin'), getStudentFeeController)
feesRoutes.put('/students/:studentId', requireRoles('admin'), upsertStudentFeeController)
