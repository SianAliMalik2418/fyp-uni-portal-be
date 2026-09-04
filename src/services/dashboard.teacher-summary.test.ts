import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/attendance-session.model.js', async (importOriginal) => ({
  ...(await importOriginal()),
  AttendanceSessionModel: { countDocuments: vi.fn(), find: vi.fn() },
}))

vi.mock('../models/assessment.model.js', async (importOriginal) => ({
  ...(await importOriginal()),
  AssessmentModel: { countDocuments: vi.fn() },
}))

vi.mock('../models/enrollment.model.js', () => ({
  EnrollmentModel: { distinct: vi.fn() },
}))

vi.mock('../models/mark-sheet.model.js', async (importOriginal) => ({
  ...(await importOriginal()),
  MarkSheetModel: { countDocuments: vi.fn() },
}))

vi.mock('../models/result.model.js', async (importOriginal) => ({
  ...(await importOriginal()),
  ResultModel: {
    aggregate: vi.fn(),
    countDocuments: vi.fn(),
    find: vi.fn(),
  },
}))

vi.mock('./course.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  listStudentCourses: vi.fn(),
  listTeacherCourseOfferings: vi.fn(),
}))

const attendanceSessionModel = await import('../models/attendance-session.model.js')
const assessmentModel = await import('../models/assessment.model.js')
const enrollmentModel = await import('../models/enrollment.model.js')
const markSheetModel = await import('../models/mark-sheet.model.js')
const resultModel = await import('../models/result.model.js')
const courseService = await import('./course.service.js')
const { getRoleDashboard } = await import('./dashboard.service.js')

function countResult(value: number) {
  return { exec: vi.fn().mockResolvedValue(value) }
}

describe('teacher dashboard attendance summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('counts every attendance session while limiting recent activity to six rows', async () => {
    vi.mocked(courseService.listTeacherCourseOfferings).mockResolvedValue([
      {
        id: 'offering-1',
        course: { code: 'PF', title: 'Programming Fundamentals' },
        section: { id: 'section-1', name: 'A' },
      },
    ] as never)
    vi.mocked(enrollmentModel.EnrollmentModel.distinct).mockResolvedValue(['student-1'] as never)
    vi.mocked(attendanceSessionModel.AttendanceSessionModel.countDocuments).mockReturnValue(
      countResult(7) as never
    )
    vi.mocked(attendanceSessionModel.AttendanceSessionModel.find).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(
        Array.from({ length: 6 }, (_, index) => ({
          _id: `session-${index + 1}`,
          courseOffering: 'offering-1',
          dateKey: `2026-08-${String(20 - index).padStart(2, '0')}`,
          records: [{ student: 'student-1', status: 'present' }],
        }))
      ),
    } as never)
    vi.mocked(assessmentModel.AssessmentModel.countDocuments).mockReturnValue(
      countResult(0) as never
    )
    vi.mocked(markSheetModel.MarkSheetModel.countDocuments).mockReturnValue(countResult(0) as never)
    vi.mocked(resultModel.ResultModel.countDocuments).mockReturnValue(countResult(0) as never)

    const dashboard = await getRoleDashboard({
      _id: 'teacher-1',
      id: 'teacher-1',
      role: 'teacher',
    } as never)

    expect(dashboard).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({ attendanceSessions: 7 }),
        attendanceActivity: expect.any(Array),
      })
    )
    expect('attendanceActivity' in dashboard && dashboard.attendanceActivity).toHaveLength(6)
  })
})
