import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorMiddleware } from '../middlewares/error.middleware.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({ resolveSession: vi.fn() }))
vi.mock('../services/audit-log.service.js', () => ({ listAuditLogs: vi.fn() }))

const authService = await import('../services/auth.service.js')
const auditLogService = await import('../services/audit-log.service.js')
const { auditLogRoutes } = await import('./audit-log.routes.js')

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/audit-logs', auditLogRoutes)
app.use(errorMiddleware)

const admin = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Portal Admin',
  role: 'admin' as const,
  isActive: true,
  mustChangePassword: false,
}

describe('audit log routes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a filtered bounded audit list to administrators', async () => {
    vi.mocked(authService.resolveSession).mockResolvedValue({
      session: { id: 'session-id' },
      user: admin,
    } as never)
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValue({
      auditLogs: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    })

    await request(app)
      .get('/audit-logs?module=fees&actorRole=admin&page=1&limit=20')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200, { auditLogs: [], page: 1, limit: 20, total: 0, totalPages: 0 })

    expect(auditLogService.listAuditLogs).toHaveBeenCalledWith({
      module: 'fees',
      actorRole: 'admin',
      page: 1,
      limit: 20,
    })
  })

  it('blocks non-admin users and rejects unbounded requests', async () => {
    vi.mocked(authService.resolveSession).mockResolvedValue({
      session: { id: 'session-id' },
      user: { ...admin, role: 'teacher' },
    } as never)

    await request(app)
      .get('/audit-logs')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)

    vi.mocked(authService.resolveSession).mockResolvedValue({
      session: { id: 'session-id' },
      user: admin,
    } as never)
    await request(app)
      .get('/audit-logs?limit=500')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(400)
  })
})
