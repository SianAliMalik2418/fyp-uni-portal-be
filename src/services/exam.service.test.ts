import { Types } from 'mongoose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/course-offering.model.js', () => ({
  CourseOfferingModel: {
    find: vi.fn(),
    findById: vi.fn(),
  },
}))

vi.mock('../models/enrollment.model.js', () => ({
  EnrollmentModel: {
    find: vi.fn(),
  },
}))

vi.mock('../models/exam.model.js', () => ({
  ExamModel: {
    create: vi.fn(),
    find: vi.fn(),
  },
}))

const { CourseOfferingModel } = await import('../models/course-offering.model.js')
const { EnrollmentModel } = await import('../models/enrollment.model.js')
const { ExamModel } = await import('../models/exam.model.js')
const { createExam, listStudentExams, listTeacherExams } = await import('./exam.service.js')

describe('createExam', () => {
  beforeEach(() => {
    vi.mocked(CourseOfferingModel.findById).mockReset()
    vi.mocked(CourseOfferingModel.find).mockReset()
    vi.mocked(EnrollmentModel.find).mockReset()
    vi.mocked(ExamModel.create).mockReset()
    vi.mocked(ExamModel.find).mockReset()
  })

  it('rejects an invalid course offering ID before reading persistence', async () => {
    await expect(
      createExam(
        {
          examType: 'Final',
          courseOfferingId: 'not-an-object-id',
          examDate: '2026-12-18',
          startTime: '09:00',
          endTime: '12:00',
          room: 'Hall A',
        },
        '507f1f77bcf86cd799439011'
      )
    ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid course offering ID' })
  })

  it('derives exam relationships from the selected course offering', async () => {
    const courseOfferingId = '507f1f77bcf86cd799439012'
    const program = {
      id: '507f1f77bcf86cd799439014',
      _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
      name: 'BS Computer Science',
      code: 'BSCS',
      isActive: true,
    }
    const semester = {
      id: '507f1f77bcf86cd799439015',
      _id: new Types.ObjectId('507f1f77bcf86cd799439015'),
      name: 'Fall Semester',
      academicYear: '2026-2027',
      isActive: true,
      isClosed: false,
    }
    const course = {
      id: '507f1f77bcf86cd799439013',
      _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
      code: 'PF',
      title: 'Programming Fundamentals',
      isActive: true,
      program,
      semester,
    }
    const section = {
      id: '507f1f77bcf86cd799439016',
      _id: new Types.ObjectId('507f1f77bcf86cd799439016'),
      name: 'A',
      isActive: true,
      program,
      semester,
    }
    const offering = {
      id: courseOfferingId,
      _id: new Types.ObjectId(courseOfferingId),
      isActive: true,
      course,
      section,
    }
    const query = {
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(offering),
    }
    vi.mocked(CourseOfferingModel.findById).mockReturnValue(query as never)
    vi.mocked(ExamModel.create).mockResolvedValue({
      id: '507f1f77bcf86cd799439017',
      examType: 'Final',
      courseOffering: offering,
      course,
      program,
      semester,
      section,
      examDate: new Date('2026-12-18T00:00:00.000Z'),
      startTime: '09:00',
      endTime: '12:00',
      startMinutes: 540,
      endMinutes: 720,
      room: 'Hall A',
      instructions: 'Bring your student card',
      populate: vi.fn().mockResolvedValue(undefined),
    } as never)

    await expect(
      createExam(
        {
          examType: 'Final',
          courseOfferingId,
          examDate: '2026-12-18',
          startTime: '09:00',
          endTime: '12:00',
          room: 'Hall A',
          instructions: 'Bring your student card',
        },
        '507f1f77bcf86cd799439011'
      )
    ).resolves.toMatchObject({
      examType: 'Final',
      examDate: '2026-12-18',
      room: 'Hall A',
      course: { code: 'PF' },
      section: { name: 'A' },
    })
  })

  it('rejects a course offering whose course and section academic relationships differ', async () => {
    const program = {
      id: '507f1f77bcf86cd799439014',
      name: 'BS Computer Science',
      code: 'BSCS',
    }
    const otherProgram = {
      id: '507f1f77bcf86cd799439024',
      name: 'BS Software Engineering',
      code: 'BSSE',
    }
    const semester = {
      id: '507f1f77bcf86cd799439015',
      name: 'Fall Semester',
      academicYear: '2026-2027',
    }
    const offering = {
      id: '507f1f77bcf86cd799439012',
      isActive: true,
      course: {
        id: '507f1f77bcf86cd799439013',
        code: 'PF',
        title: 'Programming Fundamentals',
        isActive: true,
        program,
        semester,
      },
      section: {
        id: '507f1f77bcf86cd799439016',
        name: 'A',
        isActive: true,
        program: otherProgram,
        semester,
      },
    }
    const query = {
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(offering),
    }
    vi.mocked(CourseOfferingModel.findById).mockReturnValue(query as never)

    await expect(
      createExam(
        {
          examType: 'Final',
          courseOfferingId: offering.id,
          examDate: '2026-12-18',
          startTime: '09:00',
          endTime: '12:00',
          room: 'Hall A',
        },
        '507f1f77bcf86cd799439011'
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Course offering must belong to the selected section program and semester',
    })
    expect(ExamModel.create).not.toHaveBeenCalled()
  })
})

describe('role-scoped exam lists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockEmptyExamList() {
    const query = {
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(ExamModel.find).mockReturnValue(query as never)
    return query
  }

  it('uses only the authenticated student active enrollment offerings', async () => {
    const courseOffering = new Types.ObjectId('507f1f77bcf86cd799439012')
    const enrollmentQuery = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([{ courseOffering }]),
    }
    vi.mocked(EnrollmentModel.find).mockReturnValue(enrollmentQuery as never)
    const examQuery = mockEmptyExamList()

    await listStudentExams({
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    } as never)

    expect(EnrollmentModel.find).toHaveBeenCalledWith({
      student: new Types.ObjectId('507f1f77bcf86cd799439011'),
      isActive: true,
    })
    expect(ExamModel.find).toHaveBeenCalledWith({ courseOffering: { $in: [courseOffering] } })
    expect(examQuery.limit).toHaveBeenCalledWith(200)
  })

  it('uses only the authenticated teacher active course offerings', async () => {
    const offeringId = new Types.ObjectId('507f1f77bcf86cd799439012')
    const offeringQuery = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([{ _id: offeringId }]),
    }
    vi.mocked(CourseOfferingModel.find).mockReturnValue(offeringQuery as never)
    mockEmptyExamList()

    await listTeacherExams({
      _id: new Types.ObjectId('507f1f77bcf86cd799439019'),
    } as never)

    expect(CourseOfferingModel.find).toHaveBeenCalledWith({
      teacher: new Types.ObjectId('507f1f77bcf86cd799439019'),
      isActive: true,
    })
    expect(ExamModel.find).toHaveBeenCalledWith({ courseOffering: { $in: [offeringId] } })
  })
})
