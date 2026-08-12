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
  getAcademicPerformanceAllowedRoles: vi.fn((module: string) =>
    module === 'assessments' || module === 'marks'
      ? ['teacher', 'admin']
      : ['student', 'teacher', 'hod', 'admin']
  ),
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
  getAssessmentStructure: vi.fn(() => ({
    categories: [{ id: 'quiz', label: 'Quizzes', weightPercentage: 10 }],
    totalPercentage: 100,
  })),
  getMarkSheet: vi.fn(),
  getWeightedMarksSummary: vi.fn(),
  listAssessments: vi.fn(),
  saveMarkSheetDraft: vi.fn(),
  updateAssessmentStructure: vi.fn(),
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
const assessmentService = await import('../services/assessment.service.js')
const { app } = await import('../app.js')

const teacher: MockUser = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Tayabba Teacher',
  email: 'teacher@example.com',
  role: 'teacher',
  isActive: true,
  mustChangePassword: false,
}

function authenticateAs(user: MockUser) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user,
  } as never)
}

describe('assessment and marks routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes the active assessment categories to teachers', async () => {
    authenticateAs(teacher)

    const response = await request(app)
      .get('/api/assessments/structure')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(response.body.structure).toEqual({
      categories: [{ id: 'quiz', label: 'Quizzes', weightPercentage: 10 }],
      totalPercentage: 100,
    })
  })

  it('lets admins save a valid university-wide assessment structure', async () => {
    authenticateAs({ ...teacher, role: 'admin' })
    const payload = {
      categories: [
        { id: 'quiz', weightPercentage: 10 },
        { id: 'assignment', weightPercentage: 10 },
        { id: 'attendance', weightPercentage: 10 },
        { id: 'presentation', weightPercentage: 10 },
        { id: 'midterm', weightPercentage: 25 },
        { id: 'final', weightPercentage: 35 },
      ],
    }
    const structure = { categories: payload.categories, totalPercentage: 100 }
    vi.mocked(assessmentService.updateAssessmentStructure).mockResolvedValue(structure as never)

    const response = await request(app)
      .put('/api/assessments/structure')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send(payload)
      .expect(200)

    expect(assessmentService.updateAssessmentStructure).toHaveBeenCalledWith(payload)
    expect(response.body).toEqual({ message: 'Assessment structure updated.', structure })
  })

  it('rejects an assessment structure whose weights do not total 100 percent', async () => {
    authenticateAs({ ...teacher, role: 'admin' })

    const response = await request(app)
      .put('/api/assessments/structure')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        categories: [
          { id: 'quiz', weightPercentage: 10 },
          { id: 'assignment', weightPercentage: 10 },
          { id: 'attendance', weightPercentage: 10 },
          { id: 'presentation', weightPercentage: 10 },
          { id: 'midterm', weightPercentage: 25 },
          { id: 'final', weightPercentage: 30 },
        ],
      })
      .expect(400)

    expect(response.body.message).toBe('Validation failed')
    expect(assessmentService.updateAssessmentStructure).not.toHaveBeenCalled()
  })

  it('creates multiple-category assessments through the teacher contract', async () => {
    authenticateAs(teacher)
    const payload = {
      offeringId: '507f1f77bcf86cd799439012',
      name: 'Quiz 1',
      category: 'quiz',
      maximumMarks: 10,
    }
    const assessment = { id: '507f1f77bcf86cd799439013', ...payload }
    vi.mocked(assessmentService.createAssessment).mockResolvedValue(assessment as never)

    const response = await request(app)
      .post('/api/assessments')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send(payload)
      .expect(201)

    expect(assessmentService.createAssessment).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'teacher' }),
      payload
    )
    expect(response.body).toEqual({
      message: 'Assessment created successfully.',
      assessment,
    })
  })

  it('saves numeric and special-status mark records as a draft', async () => {
    authenticateAs(teacher)
    const payload = {
      records: [
        { studentId: '507f1f77bcf86cd799439014', obtainedMarks: 8.5 },
        { studentId: '507f1f77bcf86cd799439015', status: 'absent' },
        { studentId: '507f1f77bcf86cd799439016', status: 'result_withheld' },
      ],
    }
    const sheet = { isDraft: true, missingCount: 0, records: [] }
    vi.mocked(assessmentService.saveMarkSheetDraft).mockResolvedValue(sheet as never)

    const response = await request(app)
      .put('/api/marks/507f1f77bcf86cd799439013/draft')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send(payload)
      .expect(200)

    expect(assessmentService.saveMarkSheetDraft).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'teacher' }),
      '507f1f77bcf86cd799439013',
      payload
    )
    expect(response.body).toEqual({ message: 'Marks draft saved successfully.', sheet })
  })

  it('rejects mark records that mix a number with a special status', async () => {
    authenticateAs(teacher)

    const response = await request(app)
      .put('/api/marks/507f1f77bcf86cd799439013/draft')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        records: [
          {
            studentId: '507f1f77bcf86cd799439014',
            obtainedMarks: 8,
            status: 'absent',
          },
        ],
      })
      .expect(400)

    expect(response.body.message).toBe('Validation failed')
    expect(assessmentService.saveMarkSheetDraft).not.toHaveBeenCalled()
  })

  it('blocks students from teacher-owned assessment endpoints', async () => {
    authenticateAs({ ...teacher, role: 'student' })

    await request(app)
      .get('/api/assessments?offeringId=507f1f77bcf86cd799439012')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)
  })
})
