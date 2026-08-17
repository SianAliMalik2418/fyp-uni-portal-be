import type { RequestHandler } from 'express'
import {
  getStudentServiceContext,
  getStudentServicePlaceholder,
  type StudentServiceModule,
} from '../services/student-services.service.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import { listNotifications, markNotificationRead } from '../services/notification.service.js'
import { markAllNotificationsRead } from '../services/notification.service.js'
import { notificationParamsSchema } from '../validators/notification.validator.js'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementAttachment,
  listAnnouncements,
  updateAnnouncement,
} from '../services/announcement.service.js'
import {
  announcementParamsSchema,
  announcementQuerySchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../validators/announcement.validator.js'

function createStudentServiceController(module: StudentServiceModule): RequestHandler {
  return (_req, res) => {
    res.json(getStudentServicePlaceholder(module))
  }
}

export const getFeesPlaceholder = createStudentServiceController('fees')
export const getMaterialsPlaceholder = createStudentServiceController('materials')
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

export const markAllNotificationsReadController = asyncHandler(async (req, res) => {
  const updatedCount = await markAllNotificationsRead(req.auth!.user)
  res.status(200).json({ message: 'All notifications marked as read.', updatedCount })
})

export const listAnnouncementsController = asyncHandler(async (req, res) => {
  const query = announcementQuerySchema.parse(req.query)
  const result = await listAnnouncements(req.auth!.user, query)
  res.status(200).json(result)
})

export const createAnnouncementController = asyncHandler(async (req, res) => {
  const payload = createAnnouncementSchema.parse(req.body)
  const announcement = await createAnnouncement(req.auth!.user, payload, req.file)
  res.status(201).json({ message: 'Announcement created.', announcement })
})

export const updateAnnouncementController = asyncHandler(async (req, res) => {
  const { announcementId } = announcementParamsSchema.parse(req.params)
  const payload = updateAnnouncementSchema.parse(req.body)
  const announcement = await updateAnnouncement(announcementId, payload, req.file)
  res.status(200).json({ message: 'Announcement updated.', announcement })
})

export const deleteAnnouncementController = asyncHandler(async (req, res) => {
  const { announcementId } = announcementParamsSchema.parse(req.params)
  await deleteAnnouncement(announcementId)
  res.status(204).send()
})

export const getAnnouncementAttachmentController = asyncHandler(async (req, res, next) => {
  const { announcementId } = announcementParamsSchema.parse(req.params)
  const attachment = await getAnnouncementAttachment(announcementId, req.auth!.user)
  res.type(attachment.mimeType)
  res.download(attachment.path, attachment.name, (error) => {
    if (error) next(error)
  })
})
