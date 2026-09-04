import { getStudentServiceContext } from '../services/student-services.service.js'
import { ApiError } from '../utils/api-error.js'
import { recordAuditLog } from '../services/audit-log.service.js'
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
import { aiChatRequestSchema } from '../validators/ai-assistant.validator.js'
import { askStudentAssistant } from '../services/ai-assistant.service.js'

export const askStudentAssistantController = asyncHandler(async (req, res) => {
  const request = aiChatRequestSchema.parse(req.body)
  const response = await askStudentAssistant(req.auth!.user, request)
  res.status(200).json(response)
})

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
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'created',
    module: 'announcements',
    affectedRecord: { id: announcement.id, label: announcement.title },
  })
  res.status(201).json({ message: 'Announcement created.', announcement })
})

export const updateAnnouncementController = asyncHandler(async (req, res) => {
  const { announcementId } = announcementParamsSchema.parse(req.params)
  const payload = updateAnnouncementSchema.parse(req.body)
  const announcement = await updateAnnouncement(announcementId, payload, req.file)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'updated',
    module: 'announcements',
    affectedRecord: { id: announcement.id, label: announcement.title },
  })
  res.status(200).json({ message: 'Announcement updated.', announcement })
})

export const deleteAnnouncementController = asyncHandler(async (req, res) => {
  const { announcementId } = announcementParamsSchema.parse(req.params)
  await deleteAnnouncement(announcementId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'deleted',
    module: 'announcements',
    affectedRecord: { id: announcementId },
  })
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
