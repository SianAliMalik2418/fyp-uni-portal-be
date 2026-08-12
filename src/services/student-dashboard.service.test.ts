import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./academic-performance.service.js', () => ({
  getStudentAttendanceSummaries: vi.fn(),
}))

vi.mock('./student-marks.service.js', () => ({
  listPublishedStudentMarks: vi.fn(),
}))

vi.mock('./result.service.js', () => ({
  getPublishedStudentResults: vi.fn(),
}))

vi.mock('./notification.service.js', () => ({
  listNotifications: vi.fn(),
}))

const academicPerformanceService = await import('./academic-performance.service.js')
const studentMarksService = await import('./student-marks.service.js')
const resultService = await import('./result.service.js')
const notificationService = await import('./notification.service.js')
const { getStudentDashboardSummary } = await import('./student-dashboard.service.js')

describe('student dashboard service', () => {
  beforeEach(() => {
    vi.mocked(academicPerformanceService.getStudentAttendanceSummaries).mockReset()
    vi.mocked(studentMarksService.listPublishedStudentMarks).mockReset()
  })

  it('consumes attendance summaries from the attendance module', async () => {
    const student = { id: 'student-1', role: 'student' }
    const summaries = [
      { isBelowThreshold: true },
      { isBelowThreshold: false },
      { isBelowThreshold: true },
    ]
    vi.mocked(academicPerformanceService.getStudentAttendanceSummaries).mockResolvedValue(
      summaries as never
    )
    vi.mocked(studentMarksService.listPublishedStudentMarks).mockResolvedValue({
      recentMarks: [],
      summary: {
        publishedAssessments: 0,
        coursesWithMarks: 0,
        averagePercentage: 0,
        weightedPercentage: 0,
      },
    })
    vi.mocked(resultService.getPublishedStudentResults).mockResolvedValue({
      semesters: [],
      cgpa: 0,
    })
    vi.mocked(notificationService.listNotifications).mockResolvedValue([])

    const dashboard = await getStudentDashboardSummary(student as never)

    expect(academicPerformanceService.getStudentAttendanceSummaries).toHaveBeenCalledWith(student)
    expect(dashboard).toEqual({
      attendance: {
        summaries,
      },
      academics: {
        recentMarks: [],
        summary: {
          publishedAssessments: 0,
          coursesWithMarks: 0,
          averagePercentage: 0,
          weightedPercentage: 0,
        },
      },
      results: {
        latest: null,
        gpa: 0,
        cgpa: 0,
      },
      notifications: [],
    })
  })
})
