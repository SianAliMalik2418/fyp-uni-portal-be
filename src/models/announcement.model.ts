import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export type AnnouncementAttachment = {
  storedName: string
  originalName: string
  mimeType: string
  size: number
}

export interface Announcement {
  title: string
  description: string
  publishDate: Date
  expiryDate?: Date
  attachment?: AnnouncementAttachment
  isPinned: boolean
  isActive: boolean
  createdBy: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export type AnnouncementDocument = HydratedDocument<Announcement>

const attachmentSchema = new Schema<AnnouncementAttachment>(
  {
    storedName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const announcementSchema = new Schema<Announcement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    publishDate: { type: Date, required: true, index: true },
    expiryDate: { type: Date, index: true },
    attachment: attachmentSchema,
    isPinned: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

announcementSchema.index({ isActive: 1, isPinned: -1, publishDate: -1 })
announcementSchema.index({ expiryDate: 1, isActive: 1 })

export const AnnouncementModel = model('Announcement', announcementSchema)
