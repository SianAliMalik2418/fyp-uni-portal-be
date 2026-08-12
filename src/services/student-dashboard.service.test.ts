import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./academic-performance.service.js', () => ({
  getStudentAttendanceSummaries: vi.fn(),
}))

const academicPerformanceService = await import('./academic-performance.service.js')
const { getStudentDashboardSummary } = await import('./student-dashboard.service.js')

describe('student dashboard service', () => {
  beforeEach(() => {
    vi.mocked(academicPerformanceService.getStudentAttendanceSummaries).mockReset()
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

    const dashboard = await getStudentDashboardSummary(student as never)

    expect(academicPerformanceService.getStudentAttendanceSummaries).toHaveBeenCalledWith(student)
    expect(dashboard).toEqual({
      attendance: {
        summaries,
      },
    })
  })
})
