import { isValidObjectId, type Types } from 'mongoose'
import { CourseOfferingModel } from '../models/course-offering.model.js'
import { NotificationModel, type NotificationDocument } from '../models/notification.model.js'
import type { AttendanceSessionDocument } from '../models/attendance-session.model.js'
import type { ResultDocument } from '../models/result.model.js'
import type { UserDocument } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'

export type SerializedNotification = {
  id: string
  type: NotificationDocument['type']
  title: string
  message: string
  resultId?: string
  resourcePath?: string
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
    resourcePath: notification.resourcePath,
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

  await upsertNotifications(
    result.records.map((record) => ({
      recipient: record.student,
      type: 'result_published' as const,
      notificationKey: `result_published:${result._id.toString()}:${record.student.toString()}`,
      result: result._id,
      title: 'Result published',
      message: `${courseTitle} has been approved. Your grade is ${record.letterGrade}.`,
      resourcePath: '/results',
    }))
  )
}

type NotificationInput = {
  recipient: Types.ObjectId
  type: NotificationDocument['type']
  notificationKey: string
  title: string
  message: string
  resourcePath?: string
  result?: Types.ObjectId
  refresh?: boolean
}

async function upsertNotifications(inputs: NotificationInput[]) {
  if (!inputs.length) return
  await NotificationModel.bulkWrite(
    inputs.map(({ refresh, ...notification }) => {
      const filter = {
        recipient: notification.recipient,
        notificationKey: notification.notificationKey,
      }
      return {
        updateOne: {
          filter,
          update: refresh
            ? {
                $set: notification,
                $unset: { readAt: 1 },
              }
            : { $setOnInsert: notification },
          upsert: true,
        },
      }
    })
  )
}

export async function notifyAccountCreated(user: UserDocument) {
  await upsertNotifications([
    {
      recipient: user._id,
      type: 'account_created',
      notificationKey: `account_created:${user.id}`,
      title: 'Account created',
      message:
        'Your university portal account is ready. Change your temporary password to continue.',
      resourcePath: '/profile',
    },
  ])
}

export async function notifyCourseAssigned(
  recipient: Types.ObjectId,
  offeringId: string,
  courseTitle: string
) {
  await upsertNotifications([
    {
      recipient,
      type: 'course_assigned',
      notificationKey: `course_assigned:${offeringId}:${String(recipient)}`,
      title: 'Course assigned',
      message: `${courseTitle} has been assigned to you.`,
      resourcePath: '/courses',
      refresh: true,
    },
  ])
}

export async function notifyAttendanceUpdated(session: AttendanceSessionDocument) {
  await upsertNotifications(
    session.records.map((record) => ({
      recipient: record.student,
      type: 'attendance_updated' as const,
      notificationKey: `attendance_updated:${session._id.toString()}:${record.student.toString()}`,
      title: 'Attendance updated',
      message: `Your attendance for ${session.dateKey} has been updated.`,
      resourcePath: '/attendance',
      refresh: true,
    }))
  )
}

export async function notifyResultReturned(result: ResultDocument, comment: string) {
  await upsertNotifications([
    {
      recipient: result.teacher,
      type: 'result_returned',
      notificationKey: `result_returned:${result._id.toString()}`,
      title: 'Result returned',
      message: `A submitted result was returned for changes: ${comment}`,
      resourcePath: '/results',
      result: result._id,
      refresh: true,
    },
  ])
}

export async function notifyResultApproved(result: ResultDocument) {
  await upsertNotifications([
    {
      recipient: result.teacher,
      type: 'result_approved',
      notificationKey: `result_approved:${result._id.toString()}`,
      title: 'Result approved',
      message: 'Your submitted result has been approved and published to students.',
      resourcePath: '/results',
      result: result._id,
    },
  ])
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

export async function markAllNotificationsRead(user: UserDocument) {
  const result = await NotificationModel.updateMany(
    { recipient: user._id, readAt: { $exists: false } },
    { $set: { readAt: new Date() } }
  ).exec()
  return result.modifiedCount
}
