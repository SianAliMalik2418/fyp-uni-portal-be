import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'
import type { SerializedProgram } from '../services/program.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('../services/program.service.js', () => ({
  createProgram: vi.fn(),
  deleteProgram: vi.fn(),
  listPrograms: vi.fn(),
  updateProgram: vi.fn(),
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
const programService = await import('../services/program.service.js')
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

const computerScienceProgram: SerializedProgram = {
  id: '507f1f77bcf86cd799439013',
  name: 'BS Computer Science',
  code: 'BSCS',
  department: {
    id: '507f1f77bcf86cd799439012',
    name: 'Computer Science',
    code: 'CS',
    isActive: true,
  },
  totalSemesters: 8,
  duration: 4,
  durationUnit: 'years',
  isActive: true,
}

function authenticateAs(user: MockUserDocument) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user,
  } as never)
}

describe('programs routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(programService.createProgram).mockReset()
    vi.mocked(programService.deleteProgram).mockReset()
    vi.mocked(programService.listPrograms).mockReset()
    vi.mocked(programService.updateProgram).mockReset()
  })

  it('lists programs for admins', async () => {
    authenticateAs(adminDocument)
    vi.mocked(programService.listPrograms).mockResolvedValue([computerScienceProgram])

    const response = await request(app)
      .get('/api/programs')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(programService.listPrograms).toHaveBeenCalled()
    expect(response.body).toEqual({ programs: [computerScienceProgram] })
  })

  it('lets admins create programs', async () => {
    authenticateAs(adminDocument)
    vi.mocked(programService.createProgram).mockResolvedValue(computerScienceProgram)

    const response = await request(app)
      .post('/api/programs')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        name: 'BS Computer Science',
        code: 'BSCS',
        departmentId: '507f1f77bcf86cd799439012',
        totalSemesters: 8,
        duration: 4,
        durationUnit: 'years',
        isActive: true,
      })
      .expect(201)

    expect(programService.createProgram).toHaveBeenCalledWith({
      name: 'BS Computer Science',
      code: 'BSCS',
      departmentId: '507f1f77bcf86cd799439012',
      totalSemesters: 8,
      duration: 4,
      durationUnit: 'years',
      isActive: true,
    })
    expect(response.body).toEqual({
      message: 'Program created',
      program: computerScienceProgram,
    })
  })

  it('lets admins update programs', async () => {
    authenticateAs(adminDocument)
    vi.mocked(programService.updateProgram).mockResolvedValue({
      ...computerScienceProgram,
      totalSemesters: 10,
    })

    const response = await request(app)
      .patch('/api/programs/507f1f77bcf86cd799439013')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ totalSemesters: 10 })
      .expect(200)

    expect(programService.updateProgram).toHaveBeenCalledWith('507f1f77bcf86cd799439013', {
      totalSemesters: 10,
    })
    expect(response.body.program.totalSemesters).toBe(10)
  })

  it('lets admins delete programs', async () => {
    authenticateAs(adminDocument)
    vi.mocked(programService.deleteProgram).mockResolvedValue(undefined)

    const response = await request(app)
      .delete('/api/programs/507f1f77bcf86cd799439013')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(programService.deleteProgram).toHaveBeenCalledWith('507f1f77bcf86cd799439013')
    expect(response.body).toEqual({ message: 'Program deleted' })
  })

  it('validates required program fields', async () => {
    authenticateAs(adminDocument)

    await request(app)
      .post('/api/programs')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ name: '', code: '', departmentId: '', duration: 0 })
      .expect(400)

    expect(programService.createProgram).not.toHaveBeenCalled()
  })

  it('blocks non-admin users from managing programs', async () => {
    authenticateAs({ ...adminDocument, role: 'teacher' })

    await request(app)
      .post('/api/programs')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        name: 'BS Computer Science',
        code: 'BSCS',
        departmentId: '507f1f77bcf86cd799439012',
        totalSemesters: 8,
        duration: 4,
        durationUnit: 'years',
      })
      .expect(403)

    expect(programService.createProgram).not.toHaveBeenCalled()
  })
})
