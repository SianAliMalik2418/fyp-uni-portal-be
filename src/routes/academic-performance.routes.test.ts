import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

type MockUserDocument = {
  id: string
  _id: string
  fullName: string
  email: string
  role: AuthenticatedUser['role']
  isActive: boolean
  mustChangePassword: boolean
}

const authService = await import('../services/auth.service.js')
const { app } = await import('../app.js')

const baseUser: MockUserDocument = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Portal User',
  email: 'user@example.com',
  role: 'student',
  isActive: true,
  mustChangePassword: false,
}

function authenticateAs(role: AuthenticatedUser['role']) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user: { ...baseUser, role },
  } as never)
}

describe('academic performance placeholder routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
  })

  it('returns the attendance placeholder for authenticated students', async () => {
    authenticateAs('student')

    const response = await request(app)
      .get('/api/attendance')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(response.body).toEqual({
      module: 'attendance',
      items: [],
      empty: true,
      message: 'No attendance records available yet.',
      allowedRoles: ['student', 'teacher', 'hod', 'admin'],
    })
  })

  it('returns the results placeholder for HOD approval boundaries', async () => {
    authenticateAs('hod')

    const response = await request(app)
      .get('/api/results')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(response.body).toMatchObject({
      module: 'results',
      items: [],
      empty: true,
    })
  })

  it('blocks students from teacher-owned assessment placeholders', async () => {
    authenticateAs('student')

    await request(app)
      .get('/api/assessments')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)
  })

  it('blocks temporary-password users from academic performance placeholders', async () => {
    vi.mocked(authService.resolveSession).mockResolvedValue({
      session: { id: 'session-id' },
      user: { ...baseUser, role: 'teacher', mustChangePassword: true },
    } as never)

    await request(app)
      .get('/api/marks')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)
  })
})
