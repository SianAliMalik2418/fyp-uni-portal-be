import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'
import type { SerializedCourseOffering } from '../services/course.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('../services/academic-performance.service.js', () => ({
  getAttendanceSession: vi.fn(),
  getAcademicPerformanceAllowedRoles: vi.fn(() => ['student', 'teacher', 'hod', 'admin']),
  getAcademicPerformanceContext: vi.fn(),
  getAcademicPerformancePlaceholder: vi.fn((module: string) => ({
    module,
    items: [],
    empty: true,
    message: `No ${module} records available yet.`,
    allowedRoles: ['student', 'teacher', 'hod', 'admin'],
  })),
  getStudentAttendanceSummaries: vi.fn(),
  listAttendanceHistory: vi.fn(),
  listAcademicPerformanceOfferingStudents: vi.fn(),
  listAcademicPerformanceOfferings: vi.fn(),
  listLowAttendanceStudents: vi.fn(),
  saveAttendanceSession: vi.fn(),
  updateAttendanceSession: vi.fn(),
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

const studentDocument: MockUserDocument = {
  ...teacherDocument,
  id: '507f1f77bcf86cd799439018',
  _id: '507f1f77bcf86cd799439018',
  fullName: 'Ayesha Noor',
  email: 'student@example.com',
  role: 'student',
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
  studentCount: 1,
  isActive: true,
}

const attendanceSession = {
  id: '507f1f77bcf86cd799439019',
  offering,
  date: '2026-08-11',
  records: [
    {
      student: {
        id: studentDocument.id,
        name: studentDocument.fullName,
        registrationNumber: 'NCBAE-2026-CS-001',
        isActive: true,
        department: offering.course.department,
        program: offering.course.program,
        batch: null,
        semester: offering.course.semester,
        section: { id: offering.section.id, name: offering.section.name },
      },
      status: 'present',
    },
  ],
  studentCount: 1,
}

function authenticateAs(user: MockUserDocument) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user,
  } as never)
}

describe('attendance routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(academicPerformanceService.saveAttendanceSession).mockReset()
    vi.mocked(academicPerformanceService.getStudentAttendanceSummaries).mockReset()
    vi.mocked(academicPerformanceService.listLowAttendanceStudents).mockReset()
  })

  it('lets teachers save attendance sessions', async () => {
    authenticateAs(teacherDocument)
    vi.mocked(academicPerformanceService.saveAttendanceSession).mockResolvedValue(
      attendanceSession as never
    )

    const payload = {
      offeringId: offering.id,
      date: '2026-08-11',
      records: [{ studentId: studentDocument.id, status: 'present' }],
    }

    const response = await request(app)
      .post('/api/attendance/sessions')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send(payload)
      .expect(200)

    expect(academicPerformanceService.saveAttendanceSession).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'teacher' }),
      payload
    )
    expect(response.body).toEqual({
      message: 'Attendance saved successfully.',
      session: attendanceSession,
    })
  })

  it('returns student course attendance summaries', async () => {
    authenticateAs(studentDocument)
    vi.mocked(academicPerformanceService.getStudentAttendanceSummaries).mockResolvedValue([
      {
        offering,
        totalClasses: 1,
        present: 1,
        absent: 0,
        leave: 0,
        attendancePercentage: 100,
        requiredPercentage: 75,
        isBelowThreshold: false,
      },
    ])

    const response = await request(app)
      .get('/api/attendance/student')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(response.body.summaries).toHaveLength(1)
    expect(response.body.summaries[0]).toMatchObject({
      present: 1,
      attendancePercentage: 100,
    })
  })

  it('returns low-attendance students for HOD review', async () => {
    authenticateAs({ ...teacherDocument, role: 'hod' })
    vi.mocked(academicPerformanceService.listLowAttendanceStudents).mockResolvedValue([
      {
        student: attendanceSession.records[0].student,
        offering,
        totalClasses: 4,
        present: 2,
        absent: 2,
        leave: 0,
        attendancePercentage: 50,
        requiredPercentage: 75,
        isBelowThreshold: true,
      },
    ])

    const response = await request(app)
      .get('/api/attendance/shortages')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(response.body.shortages).toHaveLength(1)
    expect(response.body.shortages[0]).toMatchObject({
      attendancePercentage: 50,
      requiredPercentage: 75,
    })
  })
})
