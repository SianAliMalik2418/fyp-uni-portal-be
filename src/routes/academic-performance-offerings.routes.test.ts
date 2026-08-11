import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'
import type { SerializedCourseOffering } from '../services/course.service.js'
import { ApiError } from '../utils/api-error.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('../services/academic-performance.service.js', () => ({
  getAcademicPerformanceAllowedRoles: vi.fn((module: string) => {
    if (module === 'assessments' || module === 'marks') {
      return ['teacher', 'admin']
    }

    return ['student', 'teacher', 'hod', 'admin']
  }),
  getAcademicPerformanceContext: vi.fn(),
  getAcademicPerformancePlaceholder: vi.fn((module: string) => ({
    module,
    items: [],
    empty: true,
    message: `No ${module} records available yet.`,
    allowedRoles: ['student', 'teacher', 'hod', 'admin'],
  })),
  listAcademicPerformanceOfferingStudents: vi.fn(),
  listAcademicPerformanceOfferings: vi.fn(),
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
const academicPerformanceService = await import('../services/academic-performance.service.js')
const { app } = await import('../app.js')

const teacherDocument: MockUserDocument = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Tayabba Teacher',
  email: 'teacher@example.com',
  role: 'teacher',
  isActive: true,
  mustChangePassword: false,
}

const offering: SerializedCourseOffering = {
  id: '507f1f77bcf86cd799439012',
  course: {
    id: '507f1f77bcf86cd799439013',
    code: 'PF',
    title: 'Programming Fundamentals',
    creditHours: 3,
    department: {
      id: '507f1f77bcf86cd799439014',
      name: 'Computer Science',
      code: 'CS',
      isActive: true,
    },
    program: {
      id: '507f1f77bcf86cd799439015',
      name: 'BS Computer Science',
      code: 'BSCS',
      isActive: true,
    },
    semester: {
      id: '507f1f77bcf86cd799439016',
      name: 'Fall Semester',
      academicYear: '2026-2027',
      isActive: true,
      isClosed: false,
    },
    isActive: true,
  },
  section: {
    id: '507f1f77bcf86cd799439017',
    name: 'A',
    program: {
      id: '507f1f77bcf86cd799439015',
      name: 'BS Computer Science',
      code: 'BSCS',
      isActive: true,
    },
    semester: {
      id: '507f1f77bcf86cd799439016',
      name: 'Fall Semester',
      academicYear: '2026-2027',
      isActive: true,
      isClosed: false,
    },
    isActive: true,
  },
  teacher: {
    id: teacherDocument.id,
    fullName: teacherDocument.fullName,
    email: teacherDocument.email,
  },
  studentCount: 32,
  isActive: true,
}

function authenticateAs(user: MockUserDocument) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user,
  } as never)
}

describe('academic performance offering routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(academicPerformanceService.listAcademicPerformanceOfferings).mockReset()
    vi.mocked(academicPerformanceService.listAcademicPerformanceOfferingStudents).mockReset()
  })

  it('returns only the authenticated teacher course offerings', async () => {
    authenticateAs(teacherDocument)
    vi.mocked(academicPerformanceService.listAcademicPerformanceOfferings).mockResolvedValue([
      offering,
    ])

    const response = await request(app)
      .get('/api/academic-performance/offerings')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(academicPerformanceService.listAcademicPerformanceOfferings).toHaveBeenCalledWith(
      expect.objectContaining({ id: teacherDocument.id, role: 'teacher' })
    )
    expect(response.body).toEqual({ offerings: [offering] })
  })

  it('returns enrolled students for an accessible course offering', async () => {
    authenticateAs(teacherDocument)
    vi.mocked(academicPerformanceService.listAcademicPerformanceOfferingStudents).mockResolvedValue(
      {
        offering,
        students: [
          {
            id: '507f1f77bcf86cd799439018',
            name: 'Ayesha Noor',
            registrationNumber: 'NCBAE-2026-CS-001',
            academicStatus: 'active',
            isActive: true,
            department: offering.course.department,
            program: offering.course.program,
            batch: null,
            semester: offering.course.semester,
            section: {
              id: offering.section.id,
              name: offering.section.name,
            },
          },
        ],
      }
    )

    const response = await request(app)
      .get(`/api/academic-performance/offerings/${offering.id}/students`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(academicPerformanceService.listAcademicPerformanceOfferingStudents).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'teacher' }),
      offering.id
    )
    expect(response.body.students).toHaveLength(1)
  })

  it('rejects unauthorized course offering access', async () => {
    authenticateAs(teacherDocument)
    vi.mocked(academicPerformanceService.listAcademicPerformanceOfferingStudents).mockRejectedValue(
      new ApiError(403, 'Teacher can only access assigned course sections')
    )

    const response = await request(app)
      .get(`/api/academic-performance/offerings/${offering.id}/students`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)

    expect(response.body).toMatchObject({
      message: 'Teacher can only access assigned course sections',
    })
  })
})
