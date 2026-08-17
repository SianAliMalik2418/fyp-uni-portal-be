import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/result.model.js', () => ({
  ResultModel: { find: vi.fn() },
}))

vi.mock('./course.service.js', () => ({
  serializeCourseOffering: vi.fn(),
}))

const resultModel = await import('../models/result.model.js')
const courseService = await import('./course.service.js')
const { getStudentResultCard } = await import('./result.service.js')

const student = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Ayesha Noor',
  registrationNumber: 'NCBAE-2026-CS-001',
  role: 'student',
}
const semesterId = '507f1f77bcf86cd799439012'

function mockResults(results: unknown[]) {
  const query = {
    populate: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(results),
  }
  vi.mocked(resultModel.ResultModel.find).mockReturnValue(query as never)
  return query
}

describe('student result cards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not generate a card when the semester has no approved results', async () => {
    mockResults([])

    await expect(getStudentResultCard(student as never, semesterId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Approved semester result not found',
    })
    expect(resultModel.ResultModel.find).toHaveBeenCalledWith({
      status: 'approved',
      'records.student': student._id,
    })
  })

  it('uses the student profile and approved course relationships for the card', async () => {
    const approvedAt = new Date('2026-08-17T10:00:00.000Z')
    const offering = { id: 'offering-1', course: {}, section: {} }
    mockResults([
      {
        id: 'result-1',
        courseOffering: offering,
        records: [
          {
            student: student.id,
            finalPercentage: 86.5,
            letterGrade: 'A',
            gradePoint: 4,
          },
        ],
        approvedAt,
      },
    ])
    vi.mocked(courseService.serializeCourseOffering).mockResolvedValue({
      id: 'offering-1',
      course: {
        code: 'PF-101',
        title: 'Programming Fundamentals',
        creditHours: 3,
        program: { id: 'program-1', name: 'BS Computer Science', code: 'BSCS' },
        semester: {
          id: semesterId,
          name: 'Semester 1',
          academicYear: '2026-2027',
        },
      },
    } as never)

    const card = await getStudentResultCard(student as never, semesterId)

    expect(card).toEqual({
      student: {
        name: 'Ayesha Noor',
        registrationNumber: 'NCBAE-2026-CS-001',
      },
      program: { id: 'program-1', name: 'BS Computer Science', code: 'BSCS' },
      semester: {
        id: semesterId,
        name: 'Semester 1',
        academicYear: '2026-2027',
      },
      courses: [
        {
          resultId: 'result-1',
          code: 'PF-101',
          title: 'Programming Fundamentals',
          creditHours: 3,
          marks: 86.5,
          grade: 'A',
          gradePoint: 4,
        },
      ],
      totalCreditHours: 3,
      gpa: 4,
    })
  })
})
