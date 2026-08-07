import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { ApiError } from '../utils/api-error.js'

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    logger.warn(
      { err: error, method: req.method, path: req.path, requestId: req.id },
      'Request validation failed'
    )

    res.status(400).json({
      message: 'Validation failed',
      errors: error.issues,
    })
    return
  }

  if (error instanceof ApiError) {
    logger.warn(
      {
        err: error,
        method: req.method,
        path: req.path,
        requestId: req.id,
        statusCode: error.statusCode,
      },
      'Request failed with expected API error'
    )

    res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    })
    return
  }

  logger.error(
    { err: error, method: req.method, path: req.path, requestId: req.id },
    'Unhandled error'
  )

  res.status(500).json({
    message: 'Internal server error',
    ...(env.NODE_ENV === 'development' ? { error: String(error) } : {}),
  })
}
