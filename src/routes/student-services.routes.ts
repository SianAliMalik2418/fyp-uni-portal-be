import { Router } from 'express'
import type { RequestHandler } from 'express'
import {
  getAiAssistantPlaceholder,
  getAnnouncementsPlaceholder,
  getExamsPlaceholder,
  getFeesPlaceholder,
  getMaterialsPlaceholder,
  listNotificationsController,
  markNotificationReadController,
  getStudentServiceContextController,
  getTimetablePlaceholder,
} from '../controllers/student-services.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'
import {
  getStudentServiceAllowedRoles,
  type StudentServiceModule,
} from '../services/student-services.service.js'

function createStudentServiceRoutes(module: StudentServiceModule, handler: RequestHandler) {
  const routes = Router()

  routes.use(requireAuth, requireRoles(...getStudentServiceAllowedRoles(module)))
  routes.get('/', handler)

  return routes
}

export const feesRoutes = createStudentServiceRoutes('fees', getFeesPlaceholder)
export const timetableRoutes = createStudentServiceRoutes('timetable', getTimetablePlaceholder)
export const examsRoutes = createStudentServiceRoutes('exams', getExamsPlaceholder)
export const materialsRoutes = createStudentServiceRoutes('materials', getMaterialsPlaceholder)
export const studentServicesRoutes = Router()

studentServicesRoutes.use(requireAuth, requireRoles('student', 'teacher', 'hod', 'admin'))
studentServicesRoutes.get('/context', getStudentServiceContextController)

export const announcementsRoutes = createStudentServiceRoutes(
  'announcements',
  getAnnouncementsPlaceholder
)
export const notificationsRoutes = Router()
notificationsRoutes.use(
  requireAuth,
  requireRoles(...getStudentServiceAllowedRoles('notifications'))
)
notificationsRoutes.get('/', listNotificationsController)
notificationsRoutes.patch('/:notificationId/read', markNotificationReadController)
export const aiAssistantRoutes = createStudentServiceRoutes(
  'ai-assistant',
  getAiAssistantPlaceholder
)
