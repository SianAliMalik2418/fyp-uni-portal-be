import { Types } from 'mongoose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/course-offering.model.js', () => ({
  CourseOfferingModel: {
    find: vi.fn(),
  },
}))

vi.mock('../models/section.model.js', () => ({
  SectionModel: {
    findById: vi.fn(),
  },
}))

vi.mock('../models/timetable.model.js', () => ({
  TimetableModel: {
    find: vi.fn(),
    findOne: vi.fn(),
  },
}))

vi.mock('../models/user.model.js', () => ({
  UserModel: {},
}))

vi.mock('./section.service.js', () => ({
  serializeSection: vi.fn((section: unknown) => section),
}))

const { CourseOfferingModel } = await import('../models/course-offering.model.js')
const { SectionModel } = await import('../models/section.model.js')
const { TimetableModel } = await import('../models/timetable.model.js')
const { getTeacherTimetables, publishSectionTimetableDraft } =
  await import('./timetable.service.js')

const ids = {
  teacher: new Types.ObjectId('507f1f77bcf86cd799439011'),
  offering: new Types.ObjectId('507f1f77bcf86cd799439012'),
  timetable: new Types.ObjectId('507f1f77bcf86cd799439013'),
  entry: new Types.ObjectId('507f1f77bcf86cd799439014'),
}

function queryChain<T>(result: T) {
  const chain = {
    exec: vi.fn().mockResolvedValue(result),
    lean: vi.fn(),
    limit: vi.fn(),
    select: vi.fn(),
    sort: vi.fn(),
  }

  chain.lean.mockReturnValue(chain)
  chain.limit.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  chain.sort.mockReturnValue(chain)

  return chain
}

describe('getTeacherTimetables', () => {
  beforeEach(() => {
    vi.mocked(CourseOfferingModel.find).mockReset()
    vi.mocked(SectionModel.findById).mockReset()
    vi.mocked(TimetableModel.find).mockReset()
    vi.mocked(TimetableModel.findOne).mockReset()
  })

  it('finds published slots through the teacher current active course offerings', async () => {
    const offeringQuery = queryChain([{ _id: ids.offering }])
    vi.mocked(CourseOfferingModel.find).mockReturnValue(offeringQuery as never)

    const populatedOffering = {
      id: ids.offering.toString(),
      _id: ids.offering,
      course: {
        id: '507f1f77bcf86cd799439015',
        _id: new Types.ObjectId('507f1f77bcf86cd799439015'),
        code: 'PF',
        title: 'Programming Fundamentals',
        creditHours: 3,
      },
      teacher: {
        id: ids.teacher.toString(),
        _id: ids.teacher,
        fullName: 'Hammad Teacher',
        email: 'hammad.teacher@example.com',
      },
      isActive: true,
    }
    const timetable = {
      id: ids.timetable.toString(),
      _id: ids.timetable,
      section: {
        id: '507f1f77bcf86cd799439016',
        name: 'A',
        program: { id: 'program-1', name: 'BSCS', code: 'BSCS', isActive: true },
        batch: {
          id: 'batch-1',
          name: 'Fall 2026',
          startingYear: 2026,
          expectedGraduationYear: 2030,
          isActive: true,
        },
        semester: {
          id: 'semester-1',
          name: 'Fall Semester',
          academicYear: '2026-2027',
          isActive: true,
          isClosed: false,
        },
        isActive: true,
      },
      status: 'published',
      version: 1,
      publishedAt: new Date('2026-08-10T09:00:00.000Z'),
      entries: [
        {
          _id: ids.entry,
          dayOfWeek: 'monday',
          startTime: '09:00',
          endTime: '10:30',
          room: 'Lab 1',
          slotType: 'lecture',
          courseOffering: populatedOffering,
        },
      ],
      populate: vi.fn().mockResolvedValue(undefined),
    }
    const timetableQuery = queryChain([timetable])
    vi.mocked(TimetableModel.find).mockReturnValue(timetableQuery as never)

    const result = await getTeacherTimetables({
      id: ids.teacher.toString(),
      _id: ids.teacher,
      role: 'teacher',
    } as never)

    expect(CourseOfferingModel.find).toHaveBeenCalledWith({
      teacher: ids.teacher,
      isActive: true,
    })
    expect(TimetableModel.find).toHaveBeenCalledWith({
      status: 'published',
      'entries.courseOffering': { $in: [ids.offering] },
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.entries).toHaveLength(1)
  })
})

describe('publishSectionTimetableDraft', () => {
  beforeEach(() => {
    vi.mocked(CourseOfferingModel.find).mockReset()
    vi.mocked(SectionModel.findById).mockReset()
    vi.mocked(TimetableModel.find).mockReset()
    vi.mocked(TimetableModel.findOne).mockReset()
  })

  it('rejects a teacher conflict using the course offering current teacher assignment', async () => {
    const sectionId = '507f1f77bcf86cd799439020'
    const semesterId = new Types.ObjectId('507f1f77bcf86cd799439021')
    const section = {
      id: sectionId,
      _id: new Types.ObjectId(sectionId),
      name: 'A',
      program: {
        id: '507f1f77bcf86cd799439022',
        _id: new Types.ObjectId('507f1f77bcf86cd799439022'),
        name: 'BS Computer Science',
        code: 'BSCS',
        isActive: true,
      },
      batch: {
        id: '507f1f77bcf86cd799439023',
        _id: new Types.ObjectId('507f1f77bcf86cd799439023'),
        name: 'Fall 2026',
        startingYear: 2026,
        expectedGraduationYear: 2030,
        isActive: true,
      },
      semester: {
        id: semesterId.toString(),
        _id: semesterId,
        name: 'Fall Semester',
        academicYear: '2026-2027',
        isActive: true,
        isClosed: false,
      },
      isActive: true,
      populate: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(SectionModel.findById).mockReturnValue(queryChain(section) as never)

    const offering = {
      id: ids.offering.toString(),
      _id: ids.offering,
      course: {
        id: '507f1f77bcf86cd799439024',
        _id: new Types.ObjectId('507f1f77bcf86cd799439024'),
        code: 'PF',
        title: 'Programming Fundamentals',
        creditHours: 3,
      },
      teacher: {
        id: ids.teacher.toString(),
        _id: ids.teacher,
        fullName: 'Hammad Teacher',
        email: 'hammad.teacher@example.com',
      },
      isActive: true,
    }
    const offeringsQuery = queryChain([offering])
    const populate = vi.fn().mockReturnValue(offeringsQuery)
    Object.assign(offeringsQuery, { populate })
    vi.mocked(CourseOfferingModel.find).mockReturnValue(offeringsQuery as never)

    const draft = {
      id: ids.timetable.toString(),
      _id: ids.timetable,
      section,
      program: section.program._id,
      semester: semesterId,
      status: 'draft',
      version: 1,
      entries: [
        {
          _id: ids.entry,
          courseOffering: ids.offering,
          course: offering.course._id,
          teacher: ids.teacher,
          dayOfWeek: 'monday',
          startTime: '09:00',
          endTime: '10:30',
          startMinutes: 540,
          endMinutes: 630,
          room: 'Lab 1',
          slotType: 'lecture',
        },
      ],
      save: vi.fn().mockResolvedValue(undefined),
      populate: vi.fn().mockImplementation(async () => {
        const [entry] = draft.entries

        if (entry) {
          entry.courseOffering = offering as never
        }
      }),
    }
    vi.mocked(TimetableModel.findOne).mockImplementation((filter) => {
      const status = (filter as { status?: string }).status
      return queryChain(status === 'draft' ? draft : null) as never
    })

    const conflictQuery = queryChain([
      {
        section: { id: 'other-section', name: 'B' },
        entries: [
          {
            dayOfWeek: 'monday',
            startMinutes: 570,
            endMinutes: 660,
            room: 'Lab 2',
            teacher: new Types.ObjectId('507f1f77bcf86cd799439025'),
            courseOffering: {
              teacher: { _id: new Types.ObjectId(ids.teacher.toString()) },
            },
          },
        ],
      },
    ])
    const conflictPopulate = vi.fn().mockReturnValue(conflictQuery)
    Object.assign(conflictQuery, { populate: conflictPopulate })
    vi.mocked(TimetableModel.find).mockReturnValue(conflictQuery as never)

    await expect(
      publishSectionTimetableDraft(sectionId, { userId: ids.teacher.toString() })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Hammad Teacher is already scheduled for Monday 09:00-10:30 in section B',
    })
    expect(TimetableModel.find).toHaveBeenCalledWith({
      section: { $ne: sectionId },
      semester: semesterId.toString(),
      status: 'published',
    })
  })
})
