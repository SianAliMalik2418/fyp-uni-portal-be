import type { RequestHandler } from 'express'
import multer from 'multer'
import { ApiError } from '../utils/api-error.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const csvFile = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')
    if (csvFile) {
      callback(null, true)
      return
    }
    callback(new ApiError(400, 'Student import must be a CSV file'))
  },
}).single('file')

export const studentImportUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new ApiError(400, 'Student import must not exceed 2 MB'))
      return
    }
    next(error)
  })
}
