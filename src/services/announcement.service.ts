import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { isValidObjectId } from 'mongoose'
import { env } from '../config/env.js'
import {
  AnnouncementModel,
  type AnnouncementAttachment,
  type AnnouncementDocument,
} from '../models/announcement.model.js'
import type { UserDocument } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'
import type {
  AnnouncementQuery,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../validators/announcement.validator.js'

function serializeAnnouncement(announcement: AnnouncementDocument) {
  return {
    id: announcement.id,
    title: announcement.title,
    description: announcement.description,
    publishDate: announcement.publishDate,
    expiryDate: announcement.expiryDate,
    attachment: announcement.attachment
      ? {
          name: announcement.attachment.originalName,
          mimeType: announcement.attachment.mimeType,
          size: announcement.attachment.size,
          url: `/announcements/${announcement.id}/attachment`,
        }
      : undefined,
    isPinned: announcement.isPinned,
    isActive: announcement.isActive,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  }
}

function ensureValidAnnouncementId(announcementId: string) {
  if (!isValidObjectId(announcementId)) {
    throw new ApiError(400, 'Invalid announcement ID')
  }
}

function statusFilter(status: AnnouncementQuery['status'], now: Date) {
  if (status === 'expired') return { expiryDate: { $lte: now } }
  if (status === 'scheduled') return { isActive: true, publishDate: { $gt: now } }
  if (status === 'all') return {}

  return {
    isActive: true,
    publishDate: { $lte: now },
    $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }],
  }
}

export async function listAnnouncements(user: UserDocument, query: AnnouncementQuery) {
  const now = new Date()
  const effectiveStatus = user.role === 'admin' ? query.status : 'active'
  const filter = statusFilter(effectiveStatus, now)
  const skip = (query.page - 1) * query.limit
  const [announcements, total] = await Promise.all([
    AnnouncementModel.find(filter)
      .sort({ isPinned: -1, publishDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .exec(),
    AnnouncementModel.countDocuments(filter).exec(),
  ])

  return {
    announcements: announcements.map(serializeAnnouncement),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  }
}

function attachmentDirectory() {
  return path.resolve(env.UPLOAD_DIR, 'announcements')
}

async function saveAttachment(file: Express.Multer.File): Promise<AnnouncementAttachment> {
  const extension = path.extname(file.originalname).slice(0, 12)
  const storedName = `${randomUUID()}${extension}`
  await mkdir(attachmentDirectory(), { recursive: true })
  await writeFile(path.join(attachmentDirectory(), storedName), file.buffer)
  return {
    storedName,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  }
}

async function removeAttachment(attachment?: AnnouncementAttachment) {
  if (!attachment) return
  await unlink(path.join(attachmentDirectory(), attachment.storedName)).catch((error: unknown) => {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
  })
}

export async function createAnnouncement(
  user: UserDocument,
  payload: CreateAnnouncementPayload,
  file?: Express.Multer.File
) {
  const attachment = file ? await saveAttachment(file) : undefined
  try {
    const announcement = await AnnouncementModel.create({
      ...payload,
      attachment,
      createdBy: user._id,
    })
    return serializeAnnouncement(announcement)
  } catch (error) {
    await removeAttachment(attachment)
    throw error
  }
}

export async function updateAnnouncement(
  announcementId: string,
  payload: UpdateAnnouncementPayload,
  file?: Express.Multer.File
) {
  ensureValidAnnouncementId(announcementId)
  const announcement = await AnnouncementModel.findById(announcementId).exec()
  if (!announcement) throw new ApiError(404, 'Announcement not found')

  const publishDate = payload.publishDate ?? announcement.publishDate
  const expiryDate = payload.clearExpiry
    ? undefined
    : (payload.expiryDate ?? announcement.expiryDate)
  if (expiryDate && expiryDate <= publishDate) {
    throw new ApiError(400, 'Expiry date must be after the publish date')
  }

  const previousAttachment = announcement.attachment
  const nextAttachment = file ? await saveAttachment(file) : undefined
  const { removeAttachment: shouldRemoveAttachment, clearExpiry, ...updates } = payload
  Object.assign(announcement, updates)
  if (clearExpiry) announcement.expiryDate = undefined
  if (shouldRemoveAttachment) announcement.attachment = undefined
  if (nextAttachment) announcement.attachment = nextAttachment
  try {
    await announcement.save()
  } catch (error) {
    await removeAttachment(nextAttachment)
    throw error
  }

  if ((shouldRemoveAttachment || nextAttachment) && previousAttachment) {
    await removeAttachment(previousAttachment)
  }
  return serializeAnnouncement(announcement)
}

export async function deleteAnnouncement(announcementId: string) {
  ensureValidAnnouncementId(announcementId)
  const announcement = await AnnouncementModel.findByIdAndDelete(announcementId).exec()
  if (!announcement) throw new ApiError(404, 'Announcement not found')
  await removeAttachment(announcement.attachment)
}

export async function getAnnouncementAttachment(announcementId: string, user: UserDocument) {
  ensureValidAnnouncementId(announcementId)
  const announcement = await AnnouncementModel.findById(announcementId).exec()
  if (!announcement?.attachment) throw new ApiError(404, 'Announcement attachment not found')
  const now = new Date()
  const canView =
    user.role === 'admin' ||
    (announcement.isActive &&
      announcement.publishDate <= now &&
      (!announcement.expiryDate || announcement.expiryDate > now))
  if (!canView) throw new ApiError(404, 'Announcement attachment not found')

  return {
    path: path.join(attachmentDirectory(), announcement.attachment.storedName),
    name: announcement.attachment.originalName,
    mimeType: announcement.attachment.mimeType,
  }
}
