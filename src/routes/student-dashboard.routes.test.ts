import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('../services/student-dashboard.service.js', () => ({
  getStudentDashboardSummary: vi.fn(),
}))

const authService = await import('../services/auth.service.js')
const studentDashboardService = await import('../services/student-dashboard.service.js')
const { app } = await import('../app.js')

const user = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Hammad Student',
  email: 'student@example.com',
  role: 'student' as AuthenticatedUser['role'],
  isActive: true,
  mustChangePassword: false,
}

function authenticateAs(role: AuthenticatedUser['role']) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user: { ...user, role },
  } as never)
}

describe('student dashboard routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(studentDashboardService.getStudentDashboardSummary).mockReset()
  })

  it('returns the signed-in student attendance dashboard', async () => {
    authenticateAs('student')
    vi.mocked(studentDashboardService.getStudentDashboardSummary).mockResolvedValue({
      attendance: {
        summaries: [{ attendancePercentage: 62.5, isBelowThreshold: true }],
      },
    } as never)

    const response = await request(app)
      .get('/api/student-dashboard')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(studentDashboardService.getStudentDashboardSummary).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id, role: 'student' })
    )
    expect(response.body).toEqual({
      attendance: {
        summaries: [{ attendancePercentage: 62.5, isBelowThreshold: true }],
      },
    })
  })

  it('blocks non-students from the student dashboard', async () => {
    authenticateAs('teacher')

    await request(app)
      .get('/api/student-dashboard')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)

    expect(studentDashboardService.getStudentDashboardSummary).not.toHaveBeenCalled()
  })
})
