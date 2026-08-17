import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({ resolveSession: vi.fn() }))
vi.mock('../services/exam.service.js', () => ({
  createExam: vi.fn(),
  deleteExam: vi.fn(),
  listAdminSectionExams: vi.fn(),
  listStudentExams: vi.fn(),
  listTeacherExams: vi.fn(),
  updateExam: vi.fn(),
}))

const authService = await import('../services/auth.service.js')
const examService = await import('../services/exam.service.js')
const { app } = await import('../app.js')

type MockUserDocument = {
  id: string
  _id: string
  fullName: string
  email: string
  role: AuthenticatedUser['role']
  isActive: boolean
  mustChangePassword: boolean
}

const user: MockUserDocument = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Portal Admin',
  email: 'admin@example.com',
  role: 'admin',
  isActive: true,
  mustChangePassword: false,
}

const payload = {
  examType: 'Final',
  courseOfferingId: '507f1f77bcf86cd799439012',
  examDate: '2026-12-18',
  startTime: '09:00',
  endTime: '12:00',
  room: 'Hall A',
  instructions: 'Bring your student card',
}

const exam = {
  id: '507f1f77bcf86cd799439017',
  ...payload,
  course: {
    id: '507f1f77bcf86cd799439013',
    code: 'CS101',
    title: 'Programming Fundamentals',
  },
  program: {
    id: '507f1f77bcf86cd799439014',
    name: 'BS Computer Science',
    code: 'BSCS',
  },
  semester: {
    id: '507f1f77bcf86cd799439015',
    name: 'Fall Semester',
    academicYear: '2026-2027',
  },
  section: { id: '507f1f77bcf86cd799439016', name: 'A' },
}

function authenticateAs(role: AuthenticatedUser['role']) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user: { ...user, role },
  } as never)
}

describe('exam routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lets admins create, update, and delete exam entries', async () => {
    authenticateAs('admin')
    vi.mocked(examService.createExam).mockResolvedValue(exam as never)
    vi.mocked(examService.updateExam).mockResolvedValue(exam as never)
    vi.mocked(examService.deleteExam).mockResolvedValue(undefined)

    const created = await request(app)
      .post('/api/exams')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send(payload)
      .expect(201)
    const updated = await request(app)
      .put(`/api/exams/${exam.id}`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .send(payload)
      .expect(200)
    const deleted = await request(app)
      .delete(`/api/exams/${exam.id}`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(created.body).toEqual({ message: 'Exam entry created', exam })
    expect(updated.body).toEqual({ message: 'Exam entry updated', exam })
    expect(deleted.body).toEqual({ message: 'Exam entry deleted' })
    expect(examService.updateExam).toHaveBeenCalledWith(exam.id, payload, user.id)
    expect(examService.deleteExam).toHaveBeenCalledWith(exam.id)
  })

  it('lets admins list exams for one section', async () => {
    authenticateAs('admin')
    vi.mocked(examService.listAdminSectionExams).mockResolvedValue([exam] as never)

    const response = await request(app)
      .get(`/api/exams/admin?sectionId=${exam.section.id}`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(examService.listAdminSectionExams).toHaveBeenCalledWith(exam.section.id)
    expect(response.body).toEqual({ exams: [exam] })
  })

  it('returns exams scoped to the authenticated student or teacher', async () => {
    authenticateAs('student')
    vi.mocked(examService.listStudentExams).mockResolvedValue([exam] as never)

    const studentResponse = await request(app)
      .get('/api/exams/me/student')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(examService.listStudentExams).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id, role: 'student' })
    )
    expect(studentResponse.body).toEqual({ exams: [exam] })

    authenticateAs('teacher')
    vi.mocked(examService.listTeacherExams).mockResolvedValue([exam] as never)

    const teacherResponse = await request(app)
      .get('/api/exams/me/teacher')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(examService.listTeacherExams).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id, role: 'teacher' })
    )
    expect(teacherResponse.body).toEqual({ exams: [exam] })
  })

  it('validates exam dates, time ranges, and required section filters', async () => {
    authenticateAs('admin')

    await request(app)
      .post('/api/exams')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ ...payload, examDate: '2026-99-99', endTime: '08:00' })
      .expect(400)
    await request(app)
      .get('/api/exams/admin')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(400)

    expect(examService.createExam).not.toHaveBeenCalled()
    expect(examService.listAdminSectionExams).not.toHaveBeenCalled()
  })

  it('enforces role permissions for every exam view', async () => {
    authenticateAs('teacher')
    await request(app)
      .post('/api/exams')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send(payload)
      .expect(403)

    authenticateAs('student')
    await request(app)
      .get('/api/exams/me/teacher')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)

    authenticateAs('admin')
    await request(app)
      .get('/api/exams/me/student')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)
  })
})
