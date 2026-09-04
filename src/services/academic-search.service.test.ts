import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as ResultModelModule from '../models/result.model.js'

vi.mock('../models/course.model.js', () => ({ CourseModel: { find: vi.fn() } }))
vi.mock('../models/section.model.js', () => ({ SectionModel: { find: vi.fn() } }))
vi.mock('../models/result.model.js', async (importOriginal) => {
  const actual = await importOriginal<typeof ResultModelModule>()
  return { ...actual, ResultModel: { find: vi.fn() } }
})
vi.mock('../models/course-offering.model.js', () => ({
  CourseOfferingModel: { find: vi.fn() },
}))
vi.mock('../models/enrollment.model.js', () => ({ EnrollmentModel: { find: vi.fn() } }))
vi.mock('./course.service.js', () => ({ serializeCourseOffering: vi.fn() }))

const courseModel = await import('../models/course.model.js')
const sectionModel = await import('../models/section.model.js')
const resultModel = await import('../models/result.model.js')
const offeringModel = await import('../models/course-offering.model.js')
const courseService = await import('./course.service.js')
const { listAcademicPerformanceOfferings, pageAttendanceShortages } =
  await import('./academic-performance.service.js')

function mockIdQuery(modelFind: ReturnType<typeof vi.fn>, rows: unknown[]) {
  const exec = vi.fn().mockResolvedValue(rows)
  const lean = vi.fn().mockReturnValue({ exec })
  const limit = vi.fn().mockReturnValue({ lean })
  const select = vi.fn().mockReturnValue({ limit })
  modelFind.mockReturnValue({ select })
}

describe('academic search', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filters HOD result offerings in MongoDB and applies the list bound', async () => {
    mockIdQuery(vi.mocked(courseModel.CourseModel.find), [{ _id: 'course-1' }])
    mockIdQuery(vi.mocked(sectionModel.SectionModel.find), [{ _id: 'section-1' }])
    mockIdQuery(vi.mocked(resultModel.ResultModel.find), [{ courseOffering: 'offering-1' }])
    const offeringDocument = { id: 'offering-1', course: {}, section: {} }
    const exec = vi.fn().mockResolvedValue([offeringDocument])
    const query = {
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      exec,
    }
    vi.mocked(offeringModel.CourseOfferingModel.find).mockReturnValue(query as never)
    vi.mocked(courseService.serializeCourseOffering).mockResolvedValue({
      id: 'offering-1',
    } as never)

    const offerings = await listAcademicPerformanceOfferings(
      { role: 'hod', department: 'department-1' } as never,
      {
        search: 'programming',
        programId: 'program-1',
        batchId: 'batch-1',
        semesterId: 'semester-1',
        sectionId: 'section-1',
        resultStatus: 'pending',
        limit: 25,
      }
    )

    expect(courseModel.CourseModel.find).toHaveBeenCalledWith({
      isActive: true,
      department: 'department-1',
      program: 'program-1',
      semester: 'semester-1',
      $or: [{ code: /programming/i }, { title: /programming/i }],
    })
    expect(sectionModel.SectionModel.find).toHaveBeenCalledWith({
      isActive: true,
      _id: 'section-1',
      program: 'program-1',
      batch: 'batch-1',
      semester: 'semester-1',
    })
    expect(resultModel.ResultModel.find).toHaveBeenCalledWith({ status: 'pending' })
    expect(offeringModel.CourseOfferingModel.find).toHaveBeenCalledWith({
      isActive: true,
      course: { $in: ['course-1'] },
      section: { $in: ['section-1'] },
      _id: { $in: ['offering-1'] },
    })
    expect(query.limit).toHaveBeenCalledWith(25)
    expect(offerings).toEqual([{ id: 'offering-1' }])
  })

  it('searches and pages derived attendance shortages', () => {
    const shortages = [
      {
        student: {
          id: 'student-1',
          name: 'Ayesha Noor',
          registrationNumber: 'REG-001',
        },
      },
      {
        student: {
          id: 'student-2',
          name: 'Bilal Khan',
          registrationNumber: 'REG-002',
        },
      },
    ]

    expect(
      pageAttendanceShortages(shortages as never, {
        studentSearch: 'reg-001',
        page: 1,
        limit: 10,
      })
    ).toEqual({
      shortages: [shortages[0]],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    })
  })
})
