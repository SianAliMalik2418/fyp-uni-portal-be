import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export const notificationTypes = ['result_published'] as const
export type NotificationType = (typeof notificationTypes)[number]

export interface Notification {
  recipient: Types.ObjectId
  type: NotificationType
  title: string
  message: string
  result?: Types.ObjectId
  readAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export type NotificationDocument = HydratedDocument<Notification>

const notificationSchema = new Schema<Notification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: notificationTypes, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    result: { type: Schema.Types.ObjectId, ref: 'Result', index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
)

notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index(
  { recipient: 1, type: 1, result: 1 },
  { unique: true, partialFilterExpression: { result: { $exists: true } } }
)

export const NotificationModel = model('Notification', notificationSchema)
