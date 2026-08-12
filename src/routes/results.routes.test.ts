import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({ resolveSession: vi.fn() }))

vi.mock('../services/academic-performance.service.js', () => ({
  getAttendanceSession: vi.fn(),
  getAttendanceConfiguration: vi.fn(),
  getAcademicPerformanceAllowedRoles: vi.fn(() => ['student', 'teacher', 'hod', 'admin']),
  getAcademicPerformanceContext: vi.fn(),
  getAcademicPerformancePlaceholder: vi.fn(),
  getStudentAttendanceSummaries: vi.fn(),
  listAttendanceHistory: vi.fn(),
  listAcademicPerformanceOfferingStudents: vi.fn(),
  listAcademicPerformanceOfferings: vi.fn(),
  listLowAttendanceStudents: vi.fn(),
  saveAttendanceSession: vi.fn(),
  updateAttendanceSession: vi.fn(),
  updateAttendanceConfiguration: vi.fn(),
}))

vi.mock('../services/assessment.service.js', () => ({
  createAssessment: vi.fn(),
  getAssessmentStructure: vi.fn(),
  getMarkSheet: vi.fn(),
  getWeightedMarksSummary: vi.fn(),
  listAssessments: vi.fn(),
  saveMarkSheetDraft: vi.fn(),
  updateAssessmentStructure: vi.fn(),
}))

vi.mock('../services/result.service.js', () => ({
  approveCourseResult: vi.fn(),
  getCourseResult: vi.fn(),
  getPublishedStudentResults: vi.fn(),
  reopenCourseResult: vi.fn(),
  returnCourseResult: vi.fn(),
  submitCourseResult: vi.fn(),
}))

type MockUser = {
  id: string
  _id: string
  fullName: string
  email: string
  role: AuthenticatedUser['role']
  isActive: boolean
  mustChangePassword: boolean
}

const authService = await import('../services/auth.service.js')
const resultService = await import('../services/result.service.js')
const { app } = await import('../app.js')

const user: MockUser = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Portal User',
  email: 'user@example.com',
  role: 'teacher',
  isActive: true,
  mustChangePassword: false,
}
const offeringId = '507f1f77bcf86cd799439012'
const resultId = '507f1f77bcf86cd799439013'
const result = { id: resultId, status: 'pending', records: [] }

function authenticateAs(role: AuthenticatedUser['role']) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user: { ...user, role },
  } as never)
}

describe('result routes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lets a teacher review and submit a complete course result', async () => {
    authenticateAs('teacher')
    vi.mocked(resultService.getCourseResult).mockResolvedValue(result as never)
    vi.mocked(resultService.submitCourseResult).mockResolvedValue(result as never)

    await request(app)
      .get(`/api/results/course/${offeringId}`)
      .set('Cookie', ['portal_session=token'])
      .expect(200)
    const response = await request(app)
      .post(`/api/results/course/${offeringId}/submit`)
      .set('Cookie', ['portal_session=token'])
      .expect(200)

    expect(resultService.submitCourseResult).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'teacher' }),
      offeringId
    )
    expect(response.body.message).toBe('Result submitted for HOD approval.')
  })

  it('lets an HOD approve or return a pending result with comments', async () => {
    authenticateAs('hod')
    vi.mocked(resultService.approveCourseResult).mockResolvedValue(result as never)
    vi.mocked(resultService.returnCourseResult).mockResolvedValue(result as never)

    await request(app)
      .post(`/api/results/${resultId}/approve`)
      .set('Cookie', ['portal_session=token'])
      .expect(200)
    await request(app)
      .post(`/api/results/${resultId}/return`)
      .set('Cookie', ['portal_session=token'])
      .send({ comment: 'Please verify the final assessment marks.' })
      .expect(200)

    expect(resultService.approveCourseResult).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'hod' }),
      resultId
    )
    expect(resultService.returnCourseResult).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'hod' }),
      resultId,
      { comment: 'Please verify the final assessment marks.' }
    )
  })

  it('requires a meaningful reason when returning a result', async () => {
    authenticateAs('hod')

    await request(app)
      .post(`/api/results/${resultId}/return`)
      .set('Cookie', ['portal_session=token'])
      .send({ comment: ' ' })
      .expect(400)

    expect(resultService.returnCourseResult).not.toHaveBeenCalled()
  })

  it('allows an administrator to reopen an approved result', async () => {
    authenticateAs('admin')
    vi.mocked(resultService.reopenCourseResult).mockResolvedValue(result as never)

    await request(app)
      .post(`/api/results/${resultId}/reopen`)
      .set('Cookie', ['portal_session=token'])
      .send({ comment: 'Approved against an outdated mark sheet.' })
      .expect(200)

    expect(resultService.reopenCourseResult).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' }),
      resultId,
      { comment: 'Approved against an outdated mark sheet.' }
    )
  })

  it('only exposes published student results through the student endpoint', async () => {
    authenticateAs('student')
    vi.mocked(resultService.getPublishedStudentResults).mockResolvedValue({
      semesters: [],
      cgpa: 0,
    })

    const response = await request(app)
      .get('/api/results/student')
      .set('Cookie', ['portal_session=token'])
      .expect(200)

    expect(response.body).toEqual({ semesters: [], cgpa: 0 })
    await request(app)
      .get(`/api/results/course/${offeringId}`)
      .set('Cookie', ['portal_session=token'])
      .expect(403)
  })
})
