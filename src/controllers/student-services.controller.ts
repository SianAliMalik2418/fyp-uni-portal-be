import type { RequestHandler } from 'express'
import {
  getStudentServiceContext,
  getStudentServicePlaceholder,
  type StudentServiceModule,
} from '../services/student-services.service.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import { listNotifications, markNotificationRead } from '../services/notification.service.js'
import { notificationParamsSchema } from '../validators/notification.validator.js'

function createStudentServiceController(module: StudentServiceModule): RequestHandler {
  return (_req, res) => {
    res.json(getStudentServicePlaceholder(module))
  }
}

export const getFeesPlaceholder = createStudentServiceController('fees')
export const getMaterialsPlaceholder = createStudentServiceController('materials')
export const getAnnouncementsPlaceholder = createStudentServiceController('announcements')
export const getNotificationsPlaceholder = createStudentServiceController('notifications')
export const getAiAssistantPlaceholder = createStudentServiceController('ai-assistant')

export const getStudentServiceContextController = asyncHandler(async (req, res) => {
  const auth = req.auth

  if (!auth) {
    throw new ApiError(401, 'Authentication required')
  }

  const context = await getStudentServiceContext(auth.user.id, auth.user.role)

  res.status(200).json(context)
})

export const listNotificationsController = asyncHandler(async (req, res) => {
  const notifications = await listNotifications(req.auth!.user)
  res.status(200).json({ notifications })
})

export const markNotificationReadController = asyncHandler(async (req, res) => {
  const { notificationId } = notificationParamsSchema.parse(req.params)
  const notification = await markNotificationRead(req.auth!.user, notificationId)
  res.status(200).json({ message: 'Notification marked as read.', notification })
})
