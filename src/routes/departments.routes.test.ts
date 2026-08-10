import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'
import type { SerializedDepartment } from '../services/department.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('../services/department.service.js', () => ({
  createDepartment: vi.fn(),
  deleteDepartment: vi.fn(),
  listDepartments: vi.fn(),
  updateDepartment: vi.fn(),
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
const departmentService = await import('../services/department.service.js')
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

const computerScienceDepartment: SerializedDepartment = {
  id: '507f1f77bcf86cd799439012',
  name: 'Computer Science',
  code: 'CS',
  description: 'Computing and software programs',
  isActive: true,
}

function authenticateAs(user: MockUserDocument) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user,
  } as never)
}

describe('departments routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(departmentService.createDepartment).mockReset()
    vi.mocked(departmentService.deleteDepartment).mockReset()
    vi.mocked(departmentService.listDepartments).mockReset()
    vi.mocked(departmentService.updateDepartment).mockReset()
  })

  it('lists departments for admins', async () => {
    authenticateAs(adminDocument)
    vi.mocked(departmentService.listDepartments).mockResolvedValue([computerScienceDepartment])

    const response = await request(app)
      .get('/api/departments')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(departmentService.listDepartments).toHaveBeenCalled()
    expect(response.body).toEqual({ departments: [computerScienceDepartment] })
  })

  it('lets admins create departments', async () => {
    authenticateAs(adminDocument)
    vi.mocked(departmentService.createDepartment).mockResolvedValue(computerScienceDepartment)

    const response = await request(app)
      .post('/api/departments')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        name: 'Computer Science',
        code: 'CS',
        description: 'Computing and software programs',
        isActive: true,
      })
      .expect(201)

    expect(departmentService.createDepartment).toHaveBeenCalledWith({
      name: 'Computer Science',
      code: 'CS',
      description: 'Computing and software programs',
      isActive: true,
    })
    expect(response.body).toEqual({
      message: 'Department created',
      department: computerScienceDepartment,
    })
  })

  it('lets admins update departments', async () => {
    authenticateAs(adminDocument)
    vi.mocked(departmentService.updateDepartment).mockResolvedValue({
      ...computerScienceDepartment,
      isActive: false,
    })

    const response = await request(app)
      .patch('/api/departments/507f1f77bcf86cd799439012')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ isActive: false })
      .expect(200)

    expect(departmentService.updateDepartment).toHaveBeenCalledWith('507f1f77bcf86cd799439012', {
      isActive: false,
    })
    expect(response.body.department.isActive).toBe(false)
  })

  it('lets admins delete departments', async () => {
    authenticateAs(adminDocument)
    vi.mocked(departmentService.deleteDepartment).mockResolvedValue(undefined)

    const response = await request(app)
      .delete('/api/departments/507f1f77bcf86cd799439012')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(departmentService.deleteDepartment).toHaveBeenCalledWith('507f1f77bcf86cd799439012')
    expect(response.body).toEqual({ message: 'Department deleted' })
  })

  it('validates required department fields', async () => {
    authenticateAs(adminDocument)

    await request(app)
      .post('/api/departments')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ name: '', code: '' })
      .expect(400)

    expect(departmentService.createDepartment).not.toHaveBeenCalled()
  })

  it('blocks non-admin users from managing departments', async () => {
    authenticateAs({ ...adminDocument, role: 'teacher' })

    await request(app)
      .post('/api/departments')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ name: 'Computer Science', code: 'CS' })
      .expect(403)

    expect(departmentService.createDepartment).not.toHaveBeenCalled()
  })
})
