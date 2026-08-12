import { isValidObjectId } from 'mongoose'
import { CourseOfferingModel } from '../models/course-offering.model.js'
import { NotificationModel, type NotificationDocument } from '../models/notification.model.js'
import type { ResultDocument } from '../models/result.model.js'
import type { UserDocument } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'

export type SerializedNotification = {
  id: string
  type: 'result_published'
  title: string
  message: string
  resultId?: string
  isRead: boolean
  createdAt?: Date
}

function serializeNotification(notification: NotificationDocument): SerializedNotification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    resultId: notification.result?.toString(),
    isRead: Boolean(notification.readAt),
    createdAt: notification.createdAt,
  }
}

export async function publishResultNotifications(result: ResultDocument) {
  const offering = await CourseOfferingModel.findById(result.courseOffering)
    .populate('course')
    .exec()
  const courseTitle =
    offering?.course && typeof offering.course === 'object' && 'title' in offering.course
      ? String(offering.course.title)
      : 'Your course'

  await NotificationModel.bulkWrite(
    result.records.map((record) => ({
      updateOne: {
        filter: { recipient: record.student, type: 'result_published', result: result._id },
        update: {
          $setOnInsert: {
            recipient: record.student,
            type: 'result_published',
            result: result._id,
            title: 'Result published',
            message: `${courseTitle} has been approved. Your grade is ${record.letterGrade}.`,
          },
        },
        upsert: true,
      },
    }))
  )
}

export async function listNotifications(user: UserDocument) {
  const notifications = await NotificationModel.find({ recipient: user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .exec()

  return notifications.map(serializeNotification)
}

export async function markNotificationRead(user: UserDocument, notificationId: string) {
  if (!isValidObjectId(notificationId)) throw new ApiError(400, 'Invalid notification ID')

  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, recipient: user._id },
    { $set: { readAt: new Date() } },
    { new: true }
  ).exec()

  if (!notification) throw new ApiError(404, 'Notification not found')
  return serializeNotification(notification)
}
