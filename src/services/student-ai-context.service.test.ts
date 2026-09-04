import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../utils/api-error.js'
import {
  createStudentAiContextService,
  type StudentAiContextDependencies,
} from './student-ai-context.service.js'

function createDependencies(): StudentAiContextDependencies {
  return {
    getIdentityAndStructure: vi.fn(),
    getAttendance: vi.fn(),
    getMarks: vi.fn(),
    getResults: vi.fn(),
    getFee: vi.fn(),
    getTimetable: vi.fn(),
    getExams: vi.fn(),
    getAnnouncements: vi.fn(),
  }
}

describe('student AI context service', () => {
  it('rejects non-student users before reading any academic source', async () => {
    const dependencies = createDependencies()
    const service = createStudentAiContextService(dependencies)

    await expect(
      service.getContext({ role: 'teacher' } as never, { sections: ['attendance'] })
    ).rejects.toEqual(new ApiError(403, 'Student AI context access required'))
    expect(dependencies.getIdentityAndStructure).not.toHaveBeenCalled()
  })

  it('retrieves only the requested student context sources', async () => {
    const dependencies = createDependencies()
    const student = { id: 'student-1', role: 'student' }
    vi.mocked(dependencies.getIdentityAndStructure).mockResolvedValue({
      student: {
        userId: 'student-1',
        name: 'Student One',
        email: 'student@example.com',
        registrationNumber: 'BSCS-001',
        program: { id: 'program-1', name: 'BS Computer Science', code: 'BSCS' },
        semester: { id: 'semester-1', name: 'Fall', academicYear: '2026' },
        section: { id: 'section-1', name: 'A' },
      },
      currentSemester: { id: 'semester-1', name: 'Fall' },
      enrolledCourses: [
        {
          id: 'offering-1',
          course: { code: 'CS401', title: 'Software Engineering' },
          teacher: { fullName: 'Teacher One' },
        },
      ],
    } as never)
    vi.mocked(dependencies.getAttendance).mockResolvedValue([{ attendancePercentage: 78 }] as never)
    vi.mocked(dependencies.getMarks).mockResolvedValue({ recentMarks: [], summary: {} } as never)
    vi.mocked(dependencies.getResults).mockResolvedValue({
      semesters: [
        {
          semester: { id: 'semester-1', name: 'Fall', academicYear: '2026' },
          gpa: 3.2,
          courses: [
            {
              offering: {
                course: { id: 'course-1', code: 'CS401', title: 'Software Engineering' },
              },
              finalPercentage: 78,
              letterGrade: 'B+',
              gradePoint: 3.3,
            },
          ],
        },
      ],
      cgpa: 3.1,
    } as never)
    vi.mocked(dependencies.getFee).mockResolvedValue({ remainingAmount: 5000 } as never)
    vi.mocked(dependencies.getTimetable).mockResolvedValue({ entries: [] } as never)
    vi.mocked(dependencies.getExams).mockResolvedValue([])
    vi.mocked(dependencies.getAnnouncements).mockResolvedValue([
      { id: 'announcement-1', title: 'Registration open' },
    ] as never)

    const context = await createStudentAiContextService(dependencies).getContext(student as never, {
      sections: ['gpa', 'fee'],
    })

    expect(context).toEqual({
      gpa: {
        semesters: [
          {
            semester: { id: 'semester-1', name: 'Fall', academicYear: '2026' },
            gpa: 3.2,
          },
        ],
        cgpa: 3.1,
      },
      fee: { remainingAmount: 5000 },
    })
    expect(dependencies.getResults).toHaveBeenCalledOnce()
    expect(dependencies.getFee).toHaveBeenCalledOnce()
    expect(dependencies.getIdentityAndStructure).not.toHaveBeenCalled()
    expect(dependencies.getAttendance).not.toHaveBeenCalled()
    expect(dependencies.getMarks).not.toHaveBeenCalled()
    expect(dependencies.getTimetable).not.toHaveBeenCalled()
    expect(dependencies.getExams).not.toHaveBeenCalled()
    expect(dependencies.getAnnouncements).not.toHaveBeenCalled()
  })

  it('returns only the requested identity field', async () => {
    const dependencies = createDependencies()
    vi.mocked(dependencies.getIdentityAndStructure).mockResolvedValue({
      student: {
        userId: 'student-1',
        name: 'Student One',
        email: 'student@example.com',
        registrationNumber: 'BSCS-001',
        program: null,
        semester: null,
        section: null,
      },
      currentSemester: null,
      enrolledCourses: [],
    })

    const context = await createStudentAiContextService(dependencies).getContext(
      { id: 'student-1', role: 'student' } as never,
      { sections: ['identity'], identityFields: ['name'] }
    )

    expect(context).toEqual({ identity: { name: 'Student One' } })
    expect(JSON.stringify(context)).not.toContain('student@example.com')
    expect(JSON.stringify(context)).not.toContain('BSCS-001')
  })
})
