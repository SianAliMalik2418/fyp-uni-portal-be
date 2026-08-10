import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'
import type { SerializedBatch } from '../services/batch.service.js'
import type { SerializedSection } from '../services/section.service.js'
import type { SerializedSemester } from '../services/semester.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('../services/batch.service.js', () => ({
  createBatch: vi.fn(),
  deleteBatch: vi.fn(),
  listBatches: vi.fn(),
  updateBatch: vi.fn(),
}))

vi.mock('../services/semester.service.js', () => ({
  activateSemester: vi.fn(),
  closeSemester: vi.fn(),
  createSemester: vi.fn(),
  deleteSemester: vi.fn(),
  listSemesters: vi.fn(),
  updateSemester: vi.fn(),
}))

vi.mock('../services/section.service.js', () => ({
  createSection: vi.fn(),
  deleteSection: vi.fn(),
  listSections: vi.fn(),
  updateSection: vi.fn(),
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
const batchService = await import('../services/batch.service.js')
const semesterService = await import('../services/semester.service.js')
const sectionService = await import('../services/section.service.js')
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

const program = {
  id: '507f1f77bcf86cd799439012',
  name: 'BS Computer Science',
  code: 'BSCS',
  isActive: true,
}

const batch: SerializedBatch = {
  id: '507f1f77bcf86cd799439013',
  name: 'Fall 2026',
  program,
  startingYear: 2026,
  expectedGraduationYear: 2030,
  isActive: true,
}

const semester: SerializedSemester = {
  id: '507f1f77bcf86cd799439014',
  name: 'Fall Semester',
  academicYear: '2026-2027',
  isActive: false,
  isClosed: false,
}

const section: SerializedSection = {
  id: '507f1f77bcf86cd799439015',
  name: 'A',
  program,
  batch: {
    id: batch.id,
    name: batch.name,
    startingYear: batch.startingYear,
    expectedGraduationYear: batch.expectedGraduationYear,
    isActive: batch.isActive,
  },
  semester: {
    id: semester.id,
    name: semester.name,
    academicYear: semester.academicYear,
    isActive: semester.isActive,
    isClosed: semester.isClosed,
  },
  isActive: true,
}

function authenticateAs(user: MockUserDocument) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user,
  } as never)
}

describe('academic structure routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(batchService.createBatch).mockReset()
    vi.mocked(batchService.listBatches).mockReset()
    vi.mocked(semesterService.activateSemester).mockReset()
    vi.mocked(semesterService.closeSemester).mockReset()
    vi.mocked(semesterService.createSemester).mockReset()
    vi.mocked(semesterService.listSemesters).mockReset()
    vi.mocked(sectionService.createSection).mockReset()
    vi.mocked(sectionService.listSections).mockReset()
  })

  it('lets admins create and list batches', async () => {
    authenticateAs(adminDocument)
    vi.mocked(batchService.createBatch).mockResolvedValue(batch)
    vi.mocked(batchService.listBatches).mockResolvedValue([batch])

    await request(app)
      .post('/api/batches')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        name: 'Fall 2026',
        programId: program.id,
        startingYear: 2026,
        expectedGraduationYear: 2030,
        isActive: true,
      })
      .expect(201)

    const response = await request(app)
      .get('/api/batches')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(batchService.createBatch).toHaveBeenCalledWith({
      name: 'Fall 2026',
      programId: program.id,
      startingYear: 2026,
      expectedGraduationYear: 2030,
      isActive: true,
    })
    expect(response.body).toEqual({ batches: [batch] })
  })

  it('supports semester activation and close actions', async () => {
    authenticateAs(adminDocument)
    vi.mocked(semesterService.activateSemester).mockResolvedValue({ ...semester, isActive: true })
    vi.mocked(semesterService.closeSemester).mockResolvedValue({
      ...semester,
      isActive: false,
      isClosed: true,
    })

    await request(app)
      .patch(`/api/semesters/${semester.id}/activate`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    await request(app)
      .patch(`/api/semesters/${semester.id}/close`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(semesterService.activateSemester).toHaveBeenCalledWith(semester.id)
    expect(semesterService.closeSemester).toHaveBeenCalledWith(semester.id)
  })

  it('validates section relationships before calling the service', async () => {
    authenticateAs(adminDocument)

    await request(app)
      .post('/api/sections')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ name: '', programId: '', batchId: '', semesterId: '' })
      .expect(400)

    expect(sectionService.createSection).not.toHaveBeenCalled()
  })

  it('lets admins create and list sections', async () => {
    authenticateAs(adminDocument)
    vi.mocked(sectionService.createSection).mockResolvedValue(section)
    vi.mocked(sectionService.listSections).mockResolvedValue([section])

    await request(app)
      .post('/api/sections')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        name: 'A',
        programId: program.id,
        batchId: batch.id,
        semesterId: semester.id,
        isActive: true,
      })
      .expect(201)

    const response = await request(app)
      .get('/api/sections')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(sectionService.createSection).toHaveBeenCalledWith({
      name: 'A',
      programId: program.id,
      batchId: batch.id,
      semesterId: semester.id,
      isActive: true,
    })
    expect(response.body).toEqual({ sections: [section] })
  })

  it('blocks non-admin users from managing academic structure', async () => {
    authenticateAs({ ...adminDocument, role: 'teacher' })

    await request(app)
      .post('/api/batches')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        name: 'Fall 2026',
        programId: program.id,
        startingYear: 2026,
        expectedGraduationYear: 2030,
      })
      .expect(403)

    expect(batchService.createBatch).not.toHaveBeenCalled()
  })
})
