import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./academic-performance.service.js', () => ({
  getStudentAttendanceSummaries: vi.fn(),
}))

vi.mock('./student-marks.service.js', () => ({
  listPublishedStudentMarks: vi.fn(),
}))

const academicPerformanceService = await import('./academic-performance.service.js')
const studentMarksService = await import('./student-marks.service.js')
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
    })
  })
})
