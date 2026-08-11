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
  deleteUser: vi.fn(),
  getUser: vi.fn(),
  listUsers: vi.fn(),
  resetUserPassword: vi.fn(),
  updateUser: vi.fn(),
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
    vi.mocked(userService.deleteUser).mockReset()
    vi.mocked(userService.getUser).mockReset()
    vi.mocked(userService.listUsers).mockReset()
    vi.mocked(userService.resetUserPassword).mockReset()
    vi.mocked(userService.updateUser).mockReset()
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
        departmentId: '507f1f77bcf86cd799439012',
        designation: 'Lecturer',
      })
      .expect(201)

    expect(userService.createUser).toHaveBeenCalledWith({
      fullName: 'Sian Teacher',
      email: 'teacher@example.com',
      role: 'teacher',
      employeeId: 'EMP-001',
      departmentId: '507f1f77bcf86cd799439012',
      designation: 'Lecturer',
      isActive: true,
    })
    expect(response.body).toEqual({
      message: 'User account created',
      user: teacherAccount,
      temporaryPassword: '@Abc1234',
    })
  })

  it('lets authenticated users read their own profile', async () => {
    authenticateAs({ ...adminDocument, role: 'student' })
    vi.mocked(userService.getUser).mockResolvedValue({
      ...teacherAccount,
      id: adminDocument.id,
      fullName: 'Sian Student',
      email: 'student@example.com',
      role: 'student',
      registrationNumber: 'REG-001',
    })

    const response = await request(app)
      .get('/api/users/me')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(userService.getUser).toHaveBeenCalledWith(adminDocument.id)
    expect(response.body.user).toMatchObject({
      fullName: 'Sian Student',
      role: 'student',
      registrationNumber: 'REG-001',
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

  it('updates user profiles for admins', async () => {
    authenticateAs(adminDocument)
    vi.mocked(userService.updateUser).mockResolvedValue({
      ...teacherAccount,
      designation: 'Assistant Professor',
    })

    const response = await request(app)
      .patch('/api/users/507f1f77bcf86cd799439012')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        fullName: 'Sian Teacher',
        email: 'teacher@example.com',
        role: 'teacher',
        employeeId: 'EMP-001',
        departmentId: '507f1f77bcf86cd799439013',
        designation: 'Assistant Professor',
        isActive: true,
      })
      .expect(200)

    expect(userService.updateUser).toHaveBeenCalledWith('507f1f77bcf86cd799439012', {
      fullName: 'Sian Teacher',
      email: 'teacher@example.com',
      role: 'teacher',
      employeeId: 'EMP-001',
      departmentId: '507f1f77bcf86cd799439013',
      designation: 'Assistant Professor',
      isActive: true,
    })
    expect(response.body).toEqual({
      message: 'User account updated',
      user: { ...teacherAccount, designation: 'Assistant Professor' },
    })
  })

  it('resets user passwords for admins', async () => {
    authenticateAs(adminDocument)
    vi.mocked(userService.resetUserPassword).mockResolvedValue({
      user: teacherAccount,
      temporaryPassword: '@Abc1234',
    })

    const response = await request(app)
      .patch('/api/users/507f1f77bcf86cd799439012/reset-password')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(userService.resetUserPassword).toHaveBeenCalledWith('507f1f77bcf86cd799439012')
    expect(response.body).toEqual({
      message: 'Temporary password issued',
      user: teacherAccount,
      temporaryPassword: '@Abc1234',
    })
  })

  it('deletes user accounts for admins', async () => {
    authenticateAs(adminDocument)
    vi.mocked(userService.deleteUser).mockResolvedValue()

    const response = await request(app)
      .delete('/api/users/507f1f77bcf86cd799439012')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(userService.deleteUser).toHaveBeenCalledWith('507f1f77bcf86cd799439012')
    expect(response.body).toEqual({ message: 'User account deleted' })
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
