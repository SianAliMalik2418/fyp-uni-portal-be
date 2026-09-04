import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({ resolveSession: vi.fn() }))
vi.mock('../services/dashboard.service.js', () => ({ getRoleDashboard: vi.fn() }))

const authService = await import('../services/auth.service.js')
const dashboardService = await import('../services/dashboard.service.js')
const { dashboardRoutes } = await import('./dashboard.routes.js')
const { errorMiddleware } = await import('../middlewares/error.middleware.js')

const app = express()
app.use(cookieParser())
app.use('/api/dashboards', dashboardRoutes)
app.use(errorMiddleware)

function authenticateAs(role: AuthenticatedUser['role'], mustChangePassword = false) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user: {
      id: '507f1f77bcf86cd799439011',
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Portal User',
      email: `${role}@example.com`,
      role,
      isActive: true,
      mustChangePassword,
    },
  } as never)
}

describe('dashboard routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(dashboardService.getRoleDashboard).mockReset()
  })

  it.each(['student', 'teacher', 'hod', 'admin'] as const)(
    'returns the authenticated %s dashboard',
    async (role) => {
      authenticateAs(role)
      vi.mocked(dashboardService.getRoleDashboard).mockResolvedValue({
        role,
        summary: { total: 4 },
      } as never)

      const response = await request(app)
        .get('/api/dashboards/me')
        .set('Cookie', ['portal_session=raw-session-token'])
        .expect(200)

      expect(response.body).toEqual({ role, summary: { total: 4 } })
    }
  )

  it('requires authentication', async () => {
    await request(app).get('/api/dashboards/me').expect(401)
    expect(dashboardService.getRoleDashboard).not.toHaveBeenCalled()
  })

  it('blocks temporary-password sessions', async () => {
    authenticateAs('student', true)
    await request(app)
      .get('/api/dashboards/me')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)
    expect(dashboardService.getRoleDashboard).not.toHaveBeenCalled()
  })
})
