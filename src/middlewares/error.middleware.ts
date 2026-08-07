import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { ApiError } from '../utils/api-error.js'

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      errors: error.issues,
    })
    return
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    })
    return
  }

  res.status(500).json({
    message: 'Internal server error',
    ...(env.NODE_ENV === 'development' ? { error: String(error) } : {}),
  })
}
