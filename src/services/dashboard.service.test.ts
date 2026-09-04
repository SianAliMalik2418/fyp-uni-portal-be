import { describe, expect, it, vi } from 'vitest'
import { createDashboardService, type DashboardDependencies } from './dashboard.service.js'

function createDependencies(): DashboardDependencies {
  return {
    getStudentProfile: vi.fn(),
    getStudentAttendance: vi.fn(),
    getStudentMarks: vi.fn(),
    getStudentResults: vi.fn(),
    getStudentNotifications: vi.fn(),
    getStudentCourses: vi.fn(),
    getStudentFee: vi.fn(),
    getStudentTimetable: vi.fn(),
    getStudentExams: vi.fn(),
    getAnnouncements: vi.fn(),
    getTeacherDashboard: vi.fn(),
    getHodDashboard: vi.fn(),
    getAdminDashboard: vi.fn(),
  }
}

describe('dashboard service', () => {
  it('combines live student modules and filters classes and exams for the dashboard window', async () => {
    const dependencies = createDependencies()
    const now = new Date('2026-08-24T08:00:00.000Z')
    const user = { id: 'student-1', role: 'student' }
    vi.mocked(dependencies.getStudentProfile).mockResolvedValue({
      id: 'student-1',
      name: 'Student One',
      registrationNumber: 'BSCS-001',
      department: { id: 'department-1', name: 'Computer Science', code: 'CS' },
      program: { id: 'program-1', name: 'BS Computer Science', code: 'BSCS' },
      semester: { id: 'semester-1', name: 'Fall', academicYear: '2026' },
      section: { id: 'section-1', name: 'A' },
    })
    vi.mocked(dependencies.getStudentAttendance).mockResolvedValue([])
    vi.mocked(dependencies.getStudentMarks).mockResolvedValue({
      recentMarks: [],
      summary: {
        publishedAssessments: 0,
        coursesWithMarks: 0,
        averagePercentage: 0,
        weightedPercentage: 0,
      },
    })
    vi.mocked(dependencies.getStudentResults).mockResolvedValue({ semesters: [], cgpa: 0 })
    vi.mocked(dependencies.getStudentNotifications).mockResolvedValue([])
    vi.mocked(dependencies.getStudentCourses).mockResolvedValue([{ id: 'offering-1' }])
    vi.mocked(dependencies.getStudentFee).mockResolvedValue({ remainingAmount: 12500 })
    vi.mocked(dependencies.getStudentTimetable).mockResolvedValue({
      entries: [
        { id: 'class-today', dayOfWeek: 'monday' },
        { id: 'class-tomorrow', dayOfWeek: 'tuesday' },
      ],
    })
    vi.mocked(dependencies.getStudentExams).mockResolvedValue([
      { id: 'past', examDate: '2026-08-23' },
      { id: 'next', examDate: '2026-08-25' },
      { id: 'later', examDate: '2026-09-02' },
    ])
    vi.mocked(dependencies.getAnnouncements).mockResolvedValue([
      { id: 'announcement-1', title: 'Welcome back' },
    ])

    const dashboard = await createDashboardService(dependencies).getDashboard(user as never, now)

    expect(dashboard).toEqual(
      expect.objectContaining({
        role: 'student',
        student: expect.objectContaining({ registrationNumber: 'BSCS-001' }),
        currentSemester: { id: 'semester-1', name: 'Fall', academicYear: '2026' },
        courses: [{ id: 'offering-1' }],
        fee: { remainingAmount: 12500 },
        todayClasses: [{ id: 'class-today', dayOfWeek: 'monday' }],
        upcomingExams: [
          { id: 'next', examDate: '2026-08-25' },
          { id: 'later', examDate: '2026-09-02' },
        ],
        announcements: [{ id: 'announcement-1', title: 'Welcome back' }],
        results: { latest: null, gpa: 0, cgpa: 0 },
      })
    )
  })

  it.each([
    ['teacher', 'getTeacherDashboard'],
    ['hod', 'getHodDashboard'],
    ['admin', 'getAdminDashboard'],
  ] as const)('returns the scoped %s dashboard', async (role, dependencyName) => {
    const dependencies = createDependencies()
    vi.mocked(dependencies[dependencyName]).mockResolvedValue({ summary: { total: 3 } } as never)

    const dashboard = await createDashboardService(dependencies).getDashboard({ role } as never)

    expect(dashboard).toEqual({ role, summary: { total: 3 } })
  })

  it('uses the university date at the UTC-to-Karachi day boundary', async () => {
    const dependencies = createDependencies()
    const now = new Date('2026-08-23T19:30:00.000Z')
    vi.mocked(dependencies.getStudentProfile).mockResolvedValue({ semester: null } as never)
    vi.mocked(dependencies.getStudentAttendance).mockResolvedValue([])
    vi.mocked(dependencies.getStudentMarks).mockResolvedValue({
      recentMarks: [],
      summary: {
        publishedAssessments: 0,
        coursesWithMarks: 0,
        averagePercentage: 0,
        weightedPercentage: 0,
      },
    })
    vi.mocked(dependencies.getStudentResults).mockResolvedValue({ semesters: [], cgpa: 0 })
    vi.mocked(dependencies.getStudentNotifications).mockResolvedValue([])
    vi.mocked(dependencies.getStudentCourses).mockResolvedValue([])
    vi.mocked(dependencies.getStudentFee).mockResolvedValue(null)
    vi.mocked(dependencies.getStudentTimetable).mockResolvedValue({
      entries: [
        { id: 'sunday-class', dayOfWeek: 'sunday' },
        { id: 'monday-class', dayOfWeek: 'monday' },
      ],
    } as never)
    vi.mocked(dependencies.getStudentExams).mockResolvedValue([
      { id: 'sunday-exam', examDate: '2026-08-23' },
      { id: 'monday-exam', examDate: '2026-08-24' },
    ] as never)
    vi.mocked(dependencies.getAnnouncements).mockResolvedValue([])

    const dashboard = await createDashboardService(dependencies).getDashboard(
      { id: 'student-1', role: 'student' } as never,
      now
    )

    expect(dashboard).toEqual(
      expect.objectContaining({
        todayClasses: [{ id: 'monday-class', dayOfWeek: 'monday' }],
        upcomingExams: [{ id: 'monday-exam', examDate: '2026-08-24' }],
      })
    )
  })
})
