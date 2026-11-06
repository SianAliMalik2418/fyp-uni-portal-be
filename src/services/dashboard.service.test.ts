import { describe, expect, it, vi } from 'vitest'
import { createDashboardService, type DashboardDependencies } from './dashboard.service.js'
import type { SerializedCourseOffering } from './course.service.js'
import type { SerializedFee } from './fee.service.js'
import type { SerializedTimetable } from './timetable.service.js'
import type { SerializedExam } from './exam.service.js'

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
    const program = { id: 'program-1', name: 'BS Computer Science', code: 'BSCS', isActive: true }
    const semester = {
      id: 'semester-1',
      name: 'Fall',
      academicYear: '2026',
      isActive: true,
      isClosed: false,
    }
    const section = {
      id: 'section-1',
      name: 'A',
      program,
      semester,
      isActive: true,
      batch: {
        id: 'batch-1',
        name: 'Fall 2026',
        startingYear: 2026,
        expectedGraduationYear: 2030,
        isActive: true,
      },
    }
    const offering: SerializedCourseOffering = {
      id: 'offering-1',
      course: {
        id: 'course-1',
        code: 'PF',
        title: 'Programming Fundamentals',
        creditHours: 3,
        department: { id: 'department-1', name: 'Computer Science', code: 'CS', isActive: true },
        program,
        semester,
        isActive: true,
      },
      section,
      studentCount: 1,
      isActive: true,
    }
    const fee: SerializedFee = {
      id: 'fee-1',
      student: { id: user.id, fullName: 'Student One' },
      semester,
      totalAmount: 25000,
      paidAmount: 12500,
      remainingAmount: 12500,
      dueDate: '2026-08-31',
      status: 'partially_paid',
    }
    const classDetails = {
      startTime: '09:00',
      endTime: '10:00',
      room: 'Room A',
      courseOffering: offering,
    }
    const timetable: SerializedTimetable = {
      id: 'timetable-1',
      section,
      status: 'published',
      version: 1,
      publishedAt: now,
      entries: [
        { ...classDetails, id: 'class-today', dayOfWeek: 'monday', slotType: 'lecture' },
        { ...classDetails, id: 'class-tomorrow', dayOfWeek: 'tuesday', slotType: 'lecture' },
      ],
    }
    const examDetails = {
      examType: 'Final',
      courseOfferingId: offering.id,
      course: offering.course,
      program,
      semester,
      section,
      startTime: '09:00',
      endTime: '12:00',
      room: 'Hall A',
    }
    const exams: SerializedExam[] = [
      { ...examDetails, id: 'past', examDate: '2026-08-23' },
      { ...examDetails, id: 'next', examDate: '2026-08-25' },
      { ...examDetails, id: 'later', examDate: '2026-09-02' },
    ]
    const announcements: Awaited<ReturnType<DashboardDependencies['getAnnouncements']>> = [
      {
        id: 'announcement-1',
        title: 'Welcome back',
        description: 'Classes resume this week.',
        publishDate: now,
        expiryDate: undefined,
        attachment: undefined,
        isPinned: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]
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
    vi.mocked(dependencies.getStudentCourses).mockResolvedValue([offering])
    vi.mocked(dependencies.getStudentFee).mockResolvedValue(fee)
    vi.mocked(dependencies.getStudentTimetable).mockResolvedValue(timetable)
    vi.mocked(dependencies.getStudentExams).mockResolvedValue(exams)
    vi.mocked(dependencies.getAnnouncements).mockResolvedValue(announcements)

    const dashboard = await createDashboardService(dependencies).getDashboard(user as never, now)

    expect(dashboard).toEqual(
      expect.objectContaining({
        role: 'student',
        student: expect.objectContaining({ registrationNumber: 'BSCS-001' }),
        currentSemester: { id: 'semester-1', name: 'Fall', academicYear: '2026' },
        courses: [offering],
        fee,
        todayClasses: [timetable.entries[0]],
        upcomingExams: [exams[1], exams[2]],
        announcements,
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
