import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/knowledge.model.js', () => ({
  KnowledgeModel: {
    bulkWrite: vi.fn(),
    find: vi.fn(),
  },
}))

vi.mock('./academic-performance.service.js', () => ({
  getAttendanceConfiguration: vi.fn(),
}))

vi.mock('./assessment.service.js', () => ({
  getAssessmentStructure: vi.fn(),
}))

vi.mock('./grading-scale.service.js', () => ({
  getGradingScale: vi.fn(),
}))

const knowledgeModel = await import('../models/knowledge.model.js')
const attendanceService = await import('./academic-performance.service.js')
const assessmentService = await import('./assessment.service.js')
const gradingService = await import('./grading-scale.service.js')
const { searchTrustedKnowledge, upsertDeveloperKnowledge } =
  await import('./knowledge-base.service.js')

describe('knowledge base service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes developer records before idempotent upsert', async () => {
    let operations: unknown[] = []
    vi.mocked(knowledgeModel.KnowledgeModel.bulkWrite).mockImplementation(async (input) => {
      operations = input
      return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 } as never
    })

    const result = await upsertDeveloperKnowledge([
      {
        knowledgeKey: '  ATTENDANCE-CONTACT ',
        title: '  Attendance contact  ',
        category: 'attendance_rules',
        question: ' Who handles attendance questions? ',
        information: ' Contact the academic office. ',
        keywords: [' Attendance ', 'contact', 'attendance'],
        isActive: true,
      },
    ])

    expect(result).toEqual({ matched: 1, modified: 1, upserted: 0 })
    expect(operations).toEqual([
      {
        updateOne: {
          filter: { knowledgeKey: 'attendance-contact' },
          update: {
            $set: {
              title: 'Attendance contact',
              category: 'attendance_rules',
              question: 'Who handles attendance questions?',
              information: 'Contact the academic office.',
              keywords: ['attendance', 'contact'],
              isActive: true,
            },
            $setOnInsert: { knowledgeKey: 'attendance-contact' },
          },
          upsert: true,
        },
      },
    ])
  })

  it('returns an empty upsert summary without issuing an empty bulk write', async () => {
    await expect(upsertDeveloperKnowledge([])).resolves.toEqual({
      matched: 0,
      modified: 0,
      upserted: 0,
    })
    expect(knowledgeModel.KnowledgeModel.bulkWrite).not.toHaveBeenCalled()
  })

  it('removes an earlier question when the developer record no longer defines one', async () => {
    let operations: unknown[] = []
    vi.mocked(knowledgeModel.KnowledgeModel.bulkWrite).mockImplementation(async (input) => {
      operations = input
      return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 } as never
    })

    await upsertDeveloperKnowledge([
      {
        knowledgeKey: 'fee-contact',
        title: 'Fee contact',
        category: 'fee_faqs',
        information: 'Use the university directory to contact the finance office.',
        keywords: ['fee'],
        isActive: true,
      },
    ])

    expect(operations).toEqual([
      expect.objectContaining({
        updateOne: expect.objectContaining({
          update: expect.objectContaining({ $unset: { question: true } }),
        }),
      }),
    ])
  })

  it('searches active developer records and matching configuration-derived facts', async () => {
    vi.mocked(attendanceService.getAttendanceConfiguration).mockResolvedValue({
      minimumAttendancePercentage: 75,
    })
    vi.mocked(assessmentService.getAssessmentStructure).mockResolvedValue({
      categories: [
        { id: 'midterm', label: 'Midterm', weightPercentage: 30 },
        { id: 'final', label: 'Final', weightPercentage: 70 },
      ],
      totalPercentage: 100,
    })
    vi.mocked(gradingService.getGradingScale).mockResolvedValue({
      ranges: [
        { minimumPercentage: 50, maximumPercentage: 100, letterGrade: 'P', gradePoint: 1 },
        { minimumPercentage: 0, maximumPercentage: 49.99, letterGrade: 'F', gradePoint: 0 },
      ],
    })
    const exec = vi.fn().mockResolvedValue([
      {
        _id: { toString: () => 'knowledge-1' },
        knowledgeKey: 'attendance-office',
        title: 'Attendance office',
        category: 'attendance_rules',
        information: 'Use the university directory to find the academic office.',
        keywords: ['attendance', 'office'],
        isActive: true,
        updatedAt: new Date('2026-08-24T00:00:00.000Z'),
      },
    ])
    const lean = vi.fn(() => ({ exec }))
    const limit = vi.fn(() => ({ lean }))
    const sort = vi.fn(() => ({ limit }))
    vi.mocked(knowledgeModel.KnowledgeModel.find).mockReturnValue({ sort } as never)

    const matches = await searchTrustedKnowledge('minimum attendance', { limit: 5 })

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'attendance-office',
          source: 'developer',
        }),
        expect.objectContaining({
          key: 'configured-attendance-requirement',
          source: 'configuration',
          information: 'The configured minimum attendance requirement is 75%.',
        }),
      ])
    )
    expect(matches).toHaveLength(2)
  })

  it('derives passing and grading facts from the configured grading scale', async () => {
    vi.mocked(attendanceService.getAttendanceConfiguration).mockResolvedValue({
      minimumAttendancePercentage: 80,
    })
    vi.mocked(assessmentService.getAssessmentStructure).mockResolvedValue({
      categories: [],
      totalPercentage: 0,
    })
    vi.mocked(gradingService.getGradingScale).mockResolvedValue({
      ranges: [
        { minimumPercentage: 60, maximumPercentage: 100, letterGrade: 'P', gradePoint: 1 },
        { minimumPercentage: 0, maximumPercentage: 59.99, letterGrade: 'F', gradePoint: 0 },
      ],
    })
    const exec = vi.fn().mockResolvedValue([])
    vi.mocked(knowledgeModel.KnowledgeModel.find).mockReturnValue({
      sort: () => ({ limit: () => ({ lean: () => ({ exec }) }) }),
    } as never)

    const matches = await searchTrustedKnowledge('passing grade', { limit: 5 })

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'configured-passing-threshold',
          information: 'The configured passing threshold is 60%.',
        }),
        expect.objectContaining({ key: 'configured-grading-scale' }),
      ])
    )
  })
})
