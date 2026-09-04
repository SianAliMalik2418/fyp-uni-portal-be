import { Router } from 'express'
import { listAuditLogsController } from '../controllers/audit-log.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const auditLogRoutes = Router()

auditLogRoutes.use(requireAuth, requireRoles('admin'))
auditLogRoutes.get('/', listAuditLogsController)
