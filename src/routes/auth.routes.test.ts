import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
  resolveSession: vi.fn(),
  serializeUser: vi.fn((user: MockUser) => ({
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    accountStatus: user.isActive ? 'active' : 'inactive',
    isActive: user.isActive,
    passwordChangeRequired: user.mustChangePassword,
  })),
}))

type MockUser = {
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

const user: AuthenticatedUser = {
  id: '507f1f77bcf86cd799439011',
  name: 'Sian Student',
  email: 'sian.student@gmail.com',
  role: 'student',
  accountStatus: 'active',
  isActive: true,
  passwordChangeRequired: true,
}

const userDocument: MockUser = {
  id: user.id,
  _id: user.id,
  fullName: user.name,
  email: user.email,
  role: user.role,
  isActive: true,
  mustChangePassword: true,
}

describe('auth routes', () => {
  beforeEach(() => {
    vi.mocked(authService.login).mockReset()
    vi.mocked(authService.logout).mockReset()
    vi.mocked(authService.changePassword).mockReset()
    vi.mocked(authService.resolveSession).mockReset()
  })

  it('logs in with email and password and returns session user information', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      token: 'raw-session-token',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      user,
    })

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sian.student@gmail.com', password: 'temporary-password' })
      .expect(200)

    expect(authService.login).toHaveBeenCalledWith('sian.student@gmail.com', 'temporary-password')
    expect(response.body).toEqual({
      message: 'Login successful',
      user,
      expiresAt: '2030-01-01T00:00:00.000Z',
    })
    expect(response.headers['set-cookie'][0]).toContain('portal_session=raw-session-token')
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
  })

  it('rejects invalid login payloads before hitting auth logic', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'temporary-password' })
      .expect(400)

    expect(authService.login).not.toHaveBeenCalled()
  })

  it('returns the current authenticated user', async () => {
    vi.mocked(authService.resolveSession).mockResolvedValue({
      session: { id: 'session-id' },
      user: userDocument,
    } as never)

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(authService.resolveSession).toHaveBeenCalledWith('raw-session-token')
    expect(response.body).toEqual({ user })
  })

  it('changes the password for an authenticated user', async () => {
    const updatedUser = { ...user, passwordChangeRequired: false }
    vi.mocked(authService.resolveSession).mockResolvedValue({
      session: { id: 'session-id' },
      user: userDocument,
    } as never)
    vi.mocked(authService.changePassword).mockResolvedValue(updatedUser)

    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        currentPassword: 'temporary-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      })
      .expect(200)

    expect(authService.changePassword).toHaveBeenCalledWith(
      user.id,
      'temporary-password',
      'new-password'
    )
    expect(response.body).toEqual({
      message: 'Password changed successfully',
      user: updatedUser,
    })
  })

  it('logs out by revoking the active session token', async () => {
    vi.mocked(authService.resolveSession).mockResolvedValue({
      session: { id: 'session-id' },
      user: userDocument,
    } as never)

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(authService.logout).toHaveBeenCalledWith('raw-session-token')
    expect(response.body).toEqual({ message: 'Logout successful' })
  })
})
