import type { RequestHandler } from 'express'
import { getDatabaseStatus } from '../config/db.js'

export const healthCheck: RequestHandler = (_req, res) => {
  res.json({
    status: 'ok',
    service: 'fyp-uni-portal-be',
    database: getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  })
}
