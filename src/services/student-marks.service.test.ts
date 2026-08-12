import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/mark-sheet.model.js', () => ({
  markStatuses: ['absent', 'exempted', 'result_withheld'],
  MarkSheetModel: { find: vi.fn() },
}))

vi.mock('./assessment.service.js', () => ({
  getAssessmentStructure: vi.fn(),
}))

vi.mock('./course.service.js', () => ({
  serializeCourseOffering: vi.fn(),
}))

const markSheetModel = await import('../models/mark-sheet.model.js')
const assessmentService = await import('./assessment.service.js')
const courseService = await import('./course.service.js')
const { listPublishedStudentMarks } = await import('./student-marks.service.js')

const student = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  role: 'student',
}

function mockSheets(sheets: unknown[]) {
  const query = {
    sort: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(sheets),
  }
  vi.mocked(markSheetModel.MarkSheetModel.find).mockReturnValue(query as never)
  return query
}

describe('published student marks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assessmentService.getAssessmentStructure).mockResolvedValue({
      categories: [
        { id: 'quiz', label: 'Quizzes', weightPercentage: 10 },
        { id: 'assignment', label: 'Assignments', weightPercentage: 10 },
        { id: 'attendance', label: 'Attendance', weightPercentage: 10 },
        { id: 'presentation', label: 'Presentation', weightPercentage: 10 },
        { id: 'midterm', label: 'Midterm', weightPercentage: 25 },
        { id: 'final', label: 'Final', weightPercentage: 35 },
      ],
      totalPercentage: 100,
    })
  })

  it('queries only published sheets belonging to the signed-in student', async () => {
    mockSheets([])

    const result = await listPublishedStudentMarks(student as never)

    expect(markSheetModel.MarkSheetModel.find).toHaveBeenCalledWith({
      isDraft: false,
      'records.student': student._id,
    })
    expect(result).toEqual({
      recentMarks: [],
      summary: {
        publishedAssessments: 0,
        coursesWithMarks: 0,
        averagePercentage: 0,
        weightedPercentage: 0,
      },
    })
  })

  it('returns only the student record and calculates the published summary', async () => {
    const offering = { id: 'offering-1', course: {}, section: {} }
    mockSheets([
      {
        assessment: {
          id: 'assessment-1',
          name: 'Quiz 1',
          category: 'quiz',
          maximumMarks: 10,
        },
        courseOffering: offering,
        records: [
          { student: student.id, obtainedMarks: 8 },
          { student: '507f1f77bcf86cd799439012', obtainedMarks: 4 },
        ],
        updatedAt: new Date('2026-08-12T00:00:00.000Z'),
      },
    ])
    vi.mocked(courseService.serializeCourseOffering).mockResolvedValue({
      id: 'offering-1',
      course: { code: 'PF', title: 'Programming Fundamentals' },
    } as never)

    const result = await listPublishedStudentMarks(student as never)

    expect(result.recentMarks).toHaveLength(1)
    expect(result.recentMarks[0]).toMatchObject({
      obtainedMarks: 8,
      percentage: 80,
      assessment: { name: 'Quiz 1', maximumMarks: 10 },
    })
    expect(result.summary).toEqual({
      publishedAssessments: 1,
      coursesWithMarks: 1,
      averagePercentage: 80,
      weightedPercentage: 8,
    })
  })
})
