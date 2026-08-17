import { Router } from 'express'
import type { RequestHandler } from 'express'
import {
  getAiAssistantPlaceholder,
  createAnnouncementController,
  deleteAnnouncementController,
  getAnnouncementAttachmentController,
  listAnnouncementsController,
  getMaterialsPlaceholder,
  listNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  updateAnnouncementController,
  getStudentServiceContextController,
} from '../controllers/student-services.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'
import { announcementUpload } from '../middlewares/announcement-upload.middleware.js'
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

export const materialsRoutes = createStudentServiceRoutes('materials', getMaterialsPlaceholder)
export const studentServicesRoutes = Router()

studentServicesRoutes.use(requireAuth, requireRoles('student', 'teacher', 'hod', 'admin'))
studentServicesRoutes.get('/context', getStudentServiceContextController)

export const announcementsRoutes = Router()
announcementsRoutes.use(
  requireAuth,
  requireRoles(...getStudentServiceAllowedRoles('announcements'))
)
announcementsRoutes.get('/', listAnnouncementsController)
announcementsRoutes.get('/:announcementId/attachment', getAnnouncementAttachmentController)
announcementsRoutes.post(
  '/',
  requireRoles('admin'),
  announcementUpload,
  createAnnouncementController
)
announcementsRoutes.patch(
  '/:announcementId',
  requireRoles('admin'),
  announcementUpload,
  updateAnnouncementController
)
announcementsRoutes.delete('/:announcementId', requireRoles('admin'), deleteAnnouncementController)
export const notificationsRoutes = Router()
notificationsRoutes.use(
  requireAuth,
  requireRoles(...getStudentServiceAllowedRoles('notifications'))
)
notificationsRoutes.get('/', listNotificationsController)
notificationsRoutes.patch('/read-all', markAllNotificationsReadController)
notificationsRoutes.patch('/:notificationId/read', markNotificationReadController)
export const aiAssistantRoutes = createStudentServiceRoutes(
  'ai-assistant',
  getAiAssistantPlaceholder
)
