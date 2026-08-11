import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'
import type { SerializedCourse, SerializedCourseOffering } from '../services/course.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('../services/course.service.js', () => ({
  assignCoursesToSection: vi.fn(),
  assignTeacherToOffering: vi.fn(),
  createCourse: vi.fn(),
  deleteCourse: vi.fn(),
  getSectionCourseOfferings: vi.fn(),
  listAssignableTeachers: vi.fn(),
  listCourses: vi.fn(),
  listCourseOfferings: vi.fn(),
  listStudentCourses: vi.fn(),
  listTeacherCourseOfferings: vi.fn(),
  updateCourse: vi.fn(),
}))

type MockUserDocument = {
  id: string
  _id: string
  fullName: string
  email: string
  role: AuthenticatedUser['role']
  isActive: boolean
  mustChangePassword: boolean
  department?: string
}

const authService = await import('../services/auth.service.js')
const courseService = await import('../services/course.service.js')
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

const course: SerializedCourse = {
  id: '507f1f77bcf86cd799439012',
  code: 'CS101',
  title: 'Programming Fundamentals',
  creditHours: 3,
  department: {
    id: '507f1f77bcf86cd799439013',
    name: 'Computer Science',
    code: 'CS',
    isActive: true,
  },
  program: {
    id: '507f1f77bcf86cd799439014',
    name: 'BS Computer Science',
    code: 'BSCS',
    isActive: true,
  },
  semester: {
    id: '507f1f77bcf86cd799439015',
    name: 'Fall Semester',
    academicYear: '2026-2027',
    isActive: true,
    isClosed: false,
  },
  isActive: true,
}

const offering: SerializedCourseOffering = {
  id: '507f1f77bcf86cd799439016',
  course,
  section: {
    id: '507f1f77bcf86cd799439017',
    name: 'A',
    program: course.program,
    semester: course.semester,
    isActive: true,
  },
  teacher: {
    id: '507f1f77bcf86cd799439018',
    fullName: 'Sian Teacher',
    email: 'teacher@example.com',
    employeeId: 'EMP-001',
    department: course.department,
  },
  studentCount: 24,
  isActive: true,
}

function authenticateAs(user: MockUserDocument) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user,
  } as never)
}

describe('courses routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(courseService.assignCoursesToSection).mockReset()
    vi.mocked(courseService.assignTeacherToOffering).mockReset()
    vi.mocked(courseService.createCourse).mockReset()
    vi.mocked(courseService.deleteCourse).mockReset()
    vi.mocked(courseService.getSectionCourseOfferings).mockReset()
    vi.mocked(courseService.listAssignableTeachers).mockReset()
    vi.mocked(courseService.listCourses).mockReset()
    vi.mocked(courseService.listCourseOfferings).mockReset()
    vi.mocked(courseService.listStudentCourses).mockReset()
    vi.mocked(courseService.listTeacherCourseOfferings).mockReset()
    vi.mocked(courseService.updateCourse).mockReset()
  })

  it('lets admins create and list courses', async () => {
    authenticateAs(adminDocument)
    vi.mocked(courseService.createCourse).mockResolvedValue(course)
    vi.mocked(courseService.listCourses).mockResolvedValue([course])

    await request(app)
      .post('/api/courses')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        code: 'cs101',
        title: 'Programming Fundamentals',
        creditHours: 3,
        departmentId: course.department.id,
        programId: course.program.id,
        semesterId: course.semester.id,
      })
      .expect(201)

    const response = await request(app)
      .get('/api/courses')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(courseService.createCourse).toHaveBeenCalledWith({
      code: 'cs101',
      title: 'Programming Fundamentals',
      creditHours: 3,
      departmentId: course.department.id,
      programId: course.program.id,
      semesterId: course.semester.id,
      isActive: true,
    })
    expect(response.body).toEqual({ courses: [course] })
  })

  it('assigns section courses and returns active offerings', async () => {
    authenticateAs(adminDocument)
    vi.mocked(courseService.assignCoursesToSection).mockResolvedValue([offering])
    vi.mocked(courseService.getSectionCourseOfferings).mockResolvedValue([offering])

    await request(app)
      .put(`/api/courses/sections/${offering.section.id}/offerings`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ courseIds: [course.id] })
      .expect(200)

    const response = await request(app)
      .get(`/api/courses/sections/${offering.section.id}/offerings`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(courseService.assignCoursesToSection).toHaveBeenCalledWith(offering.section.id, {
      courseIds: [course.id],
    })
    expect(courseService.getSectionCourseOfferings).toHaveBeenCalledWith(
      offering.section.id,
      expect.objectContaining({ role: 'admin' })
    )
    expect(response.body).toEqual({ offerings: [offering] })
  })

  it('lets admins and HODs assign a teacher to an offering', async () => {
    authenticateAs(adminDocument)
    vi.mocked(courseService.assignTeacherToOffering).mockResolvedValue(offering)

    const response = await request(app)
      .patch(`/api/courses/offerings/${offering.id}/teacher`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ teacherId: offering.teacher?.id })
      .expect(200)

    expect(courseService.assignTeacherToOffering).toHaveBeenCalledWith(
      offering.id,
      { teacherId: offering.teacher?.id },
      expect.objectContaining({ role: 'admin' })
    )
    expect(response.body).toEqual({ message: 'Course teacher saved', offering })
  })

  it('lists active offerings and assignable teachers for course managers', async () => {
    authenticateAs(adminDocument)
    vi.mocked(courseService.listCourseOfferings).mockResolvedValue([offering])
    vi.mocked(courseService.listAssignableTeachers).mockResolvedValue([
      {
        id: offering.teacher!.id,
        fullName: offering.teacher!.fullName,
        email: offering.teacher!.email,
        employeeId: offering.teacher!.employeeId,
        department: course.department,
      },
    ])

    const offeringsResponse = await request(app)
      .get('/api/courses/offerings')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)
    const teachersResponse = await request(app)
      .get('/api/courses/teachers')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(offeringsResponse.body).toEqual({ offerings: [offering] })
    expect(teachersResponse.body.teachers).toHaveLength(1)
  })

  it('returns only the authenticated student course offerings', async () => {
    authenticateAs({ ...adminDocument, role: 'student' })
    vi.mocked(courseService.listStudentCourses).mockResolvedValue([offering])

    const response = await request(app)
      .get('/api/courses/me/student')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(courseService.listStudentCourses).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'student' })
    )
    expect(response.body).toEqual({ offerings: [offering] })
  })

  it('returns only the authenticated teacher course offerings', async () => {
    authenticateAs({ ...adminDocument, role: 'teacher' })
    vi.mocked(courseService.listTeacherCourseOfferings).mockResolvedValue([offering])

    const response = await request(app)
      .get('/api/courses/me/teacher')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(courseService.listTeacherCourseOfferings).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'teacher' })
    )
    expect(response.body).toEqual({ offerings: [offering] })
  })

  it('blocks non-admin users from course management', async () => {
    authenticateAs({ ...adminDocument, role: 'teacher' })

    await request(app)
      .post('/api/courses')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        code: 'CS101',
        title: 'Programming Fundamentals',
        creditHours: 3,
        departmentId: course.department.id,
        programId: course.program.id,
        semesterId: course.semester.id,
      })
      .expect(403)

    expect(courseService.createCourse).not.toHaveBeenCalled()
  })
})
