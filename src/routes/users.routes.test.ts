import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'
import type { ProvisionedUserAccount } from '../services/user.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
  hashPassword: vi.fn((password: string) => `hashed:${password}`),
}))

vi.mock('../services/user.service.js', () => ({
  createUser: vi.fn(),
  listUsers: vi.fn(),
  DEFAULT_TEMPORARY_PASSWORD: '@Abc1234',
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
const userService = await import('../services/user.service.js')
const { app } = await import('../app.js')

const adminDocument: MockUserDocument = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Portal Admin',
  email: 'admin@example.com',
  role: 'admin',
  isActive: true,
  mustChangePassword: false,
}

const teacherAccount: ProvisionedUserAccount = {
  id: 'teacher-1',
  fullName: 'Sian Teacher',
  email: 'teacher@example.com',
  role: 'teacher',
  employeeId: 'EMP-001',
  accountStatus: 'active',
  isActive: true,
  passwordChangeRequired: true,
}

function authenticateAs(user: MockUserDocument) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user,
  } as never)
}

describe('users routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(userService.createUser).mockReset()
    vi.mocked(userService.listUsers).mockReset()
  })

  it('lists provisioned users for admins', async () => {
    authenticateAs(adminDocument)
    vi.mocked(userService.listUsers).mockResolvedValue([teacherAccount])

    const response = await request(app)
      .get('/api/users')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(userService.listUsers).toHaveBeenCalled()
    expect(response.body).toEqual({ users: [teacherAccount] })
  })

  it('lets admins create accounts with a temporary password', async () => {
    authenticateAs(adminDocument)
    vi.mocked(userService.createUser).mockResolvedValue({
      user: teacherAccount,
      temporaryPassword: '@Abc1234',
    })

    const response = await request(app)
      .post('/api/users')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        fullName: 'Sian Teacher',
        email: 'teacher@example.com',
        role: 'teacher',
        employeeId: 'EMP-001',
      })
      .expect(201)

    expect(userService.createUser).toHaveBeenCalledWith({
      fullName: 'Sian Teacher',
      email: 'teacher@example.com',
      role: 'teacher',
      employeeId: 'EMP-001',
      isActive: true,
    })
    expect(response.body).toEqual({
      message: 'User account created',
      user: teacherAccount,
      temporaryPassword: '@Abc1234',
    })
  })

  it('requires registration numbers for student accounts', async () => {
    authenticateAs(adminDocument)

    await request(app)
      .post('/api/users')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        fullName: 'Sian Student',
        email: 'student@example.com',
        role: 'student',
      })
      .expect(400)

    expect(userService.createUser).not.toHaveBeenCalled()
  })

  it('requires employee IDs for teacher and HOD accounts', async () => {
    authenticateAs(adminDocument)

    await request(app)
      .post('/api/users')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        fullName: 'Sian Teacher',
        email: 'teacher@example.com',
        role: 'teacher',
      })
      .expect(400)

    expect(userService.createUser).not.toHaveBeenCalled()
  })

  it('blocks non-admin users from provisioning accounts', async () => {
    authenticateAs({ ...adminDocument, role: 'teacher' })

    await request(app)
      .post('/api/users')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        fullName: 'Sian Student',
        email: 'student@example.com',
        role: 'student',
      })
      .expect(403)

    expect(userService.createUser).not.toHaveBeenCalled()
  })
})
