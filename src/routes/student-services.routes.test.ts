import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('../services/section.service.js', () => ({
  listSections: vi.fn(),
}))

vi.mock('../services/semester.service.js', () => ({
  listSemesters: vi.fn(),
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
const sectionService = await import('../services/section.service.js')
const semesterService = await import('../services/semester.service.js')
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

const currentSemester = {
  id: '507f1f77bcf86cd799439012',
  name: 'Semester 8',
  academicYear: '2026-2027',
  isActive: true,
  isClosed: false,
}

const activeSection = {
  id: '507f1f77bcf86cd799439013',
  name: 'A',
  program: {
    id: '507f1f77bcf86cd799439014',
    name: 'BS Computer Science',
    code: 'BSCS',
    isActive: true,
  },
  batch: {
    id: '507f1f77bcf86cd799439015',
    name: 'Fall 2023',
    startingYear: 2023,
    expectedGraduationYear: 2027,
    isActive: true,
  },
  semester: {
    id: currentSemester.id,
    name: currentSemester.name,
    academicYear: currentSemester.academicYear,
    isActive: true,
    isClosed: false,
  },
  isActive: true,
}

describe('student services placeholder routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(sectionService.listSections).mockReset()
    vi.mocked(semesterService.listSemesters).mockReset()
  })

  it('returns the fees placeholder for authenticated students', async () => {
    authenticateAs('student')

    const response = await request(app)
      .get('/api/fees')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(response.body).toEqual({
      module: 'fees',
      items: [],
      empty: true,
      message: 'No fee records available yet.',
      allowedRoles: ['student', 'admin'],
    })
  })

  it('returns the announcements placeholder for all authenticated portal roles', async () => {
    authenticateAs('hod')

    const response = await request(app)
      .get('/api/announcements')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(response.body).toMatchObject({
      module: 'announcements',
      items: [],
      empty: true,
      allowedRoles: ['student', 'teacher', 'hod', 'admin'],
    })
  })

  it('blocks teachers from student-only AI assistant placeholder', async () => {
    authenticateAs('teacher')

    await request(app)
      .get('/api/ai-assistant')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)
  })

  it('blocks temporary-password users from student service placeholders', async () => {
    vi.mocked(authService.resolveSession).mockResolvedValue({
      session: { id: 'session-id' },
      user: { ...baseUser, role: 'student', mustChangePassword: true },
    } as never)

    await request(app)
      .get('/api/notifications')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)
  })

  it('returns academic structure context for timetable, exam, and AI references', async () => {
    authenticateAs('admin')
    vi.mocked(semesterService.listSemesters).mockResolvedValue([currentSemester])
    vi.mocked(sectionService.listSections).mockResolvedValue([activeSection])

    const response = await request(app)
      .get('/api/student-services/context')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(response.body).toEqual({
      currentSemester,
      availableSections: [activeSection],
      timetableScope: {
        canReferenceProgram: true,
        canReferenceSemester: true,
        canReferenceSection: true,
      },
      examScope: {
        canReferenceProgram: true,
        canReferenceSemester: true,
        canReferenceSection: true,
      },
      aiScope: {
        canReferenceProgram: true,
        canReferenceSemester: true,
        canReferenceSection: true,
      },
    })
  })
})
