import multer from 'multer'
import type { RequestHandler } from 'express'
import { env } from '../config/env.js'
import { ApiError } from '../utils/api-error.js'

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true)
      return
    }
    callback(new ApiError(400, 'Attachment must be a PDF, Word document, or supported image'))
  },
}).single('attachment')

export const announcementUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new ApiError(400, `Attachment must not exceed ${env.MAX_UPLOAD_MB} MB`))
      return
    }
    next(error)
  })
}
