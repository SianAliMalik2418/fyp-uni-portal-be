import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../utils/api-error.js'
import {
  createSemesterPromotionService,
  type PromotionDependencies,
  type PromotionSection,
  type PromotionStudent,
} from './semester-promotion.service.js'

const sourceSection: PromotionSection = {
  id: 'source-section',
  name: 'A',
  programId: 'program-1',
  batchId: 'batch-1',
  isActive: true,
  semester: {
    id: 'semester-1',
    name: 'Fall Semester',
    academicYear: '2026-2027',
    startsAt: new Date('2026-09-01T00:00:00.000Z'),
    isClosed: false,
  },
}

const targetSection: PromotionSection = {
  ...sourceSection,
  id: 'target-section',
  semester: {
    id: 'semester-2',
    name: 'Spring Semester',
    academicYear: '2026-2027',
    startsAt: new Date('2027-02-01T00:00:00.000Z'),
    isClosed: false,
  },
}

function student(overrides: Partial<PromotionStudent> = {}): PromotionStudent {
  return {
    id: 'student-1',
    fullName: 'Ayesha Noor',
    registrationNumber: 'NCBAE-2026-CS-001',
    academicStatus: 'active',
    isActive: true,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function dependencies(students: PromotionStudent[] = [student()]): PromotionDependencies {
  return {
    getSection: vi.fn(async (sectionId) => {
      if (sectionId === sourceSection.id) return sourceSection
      if (sectionId === targetSection.id) return targetSection
      return null
    }),
    listStudents: vi.fn(async () => students),
    deactivateSourceEnrollments: vi.fn(async () => undefined),
    syncTargetEnrollments: vi.fn(async () => undefined),
  }
}

describe('semester promotion service', () => {
  it('returns active candidates and explains blocked academic statuses', async () => {
    const frozen = student({
      id: 'student-2',
      fullName: 'Frozen Student',
      academicStatus: 'frozen',
    })
    const deps = dependencies([student(), frozen])

    const result = await createSemesterPromotionService(deps).getCandidates({
      sourceSectionId: sourceSection.id,
      targetSectionId: targetSection.id,
    })

    expect(result.students).toEqual([
      expect.objectContaining({ id: 'student-1', eligible: true, reason: undefined }),
      expect.objectContaining({
        id: 'student-2',
        eligible: false,
        reason: 'Academic status is frozen',
      }),
    ])
    expect(result.summary).toEqual({ total: 2, eligible: 1, blocked: 1 })
  })

  it('rejects a target outside the source program and batch', async () => {
    const deps = dependencies()
    vi.mocked(deps.getSection)
      .mockResolvedValueOnce(sourceSection)
      .mockResolvedValueOnce({
        ...targetSection,
        programId: 'program-2',
      })

    await expect(
      createSemesterPromotionService(deps).getCandidates({
        sourceSectionId: sourceSection.id,
        targetSectionId: targetSection.id,
      })
    ).rejects.toEqual(new ApiError(400, 'Target section must use the same program and batch'))
  })

  it('promotes eligible students except explicit exclusions and preserves blocked students', async () => {
    const promoted = student()
    const excluded = student({ id: 'student-2', fullName: 'Excluded Student' })
    const blocked = student({
      id: 'student-3',
      fullName: 'Repeating Student',
      academicStatus: 'repeating',
    })
    const deps = dependencies([promoted, excluded, blocked])

    const result = await createSemesterPromotionService(deps).promote({
      sourceSectionId: sourceSection.id,
      targetSectionId: targetSection.id,
      excludedStudentIds: [excluded.id],
    })

    expect(promoted.semesterId).toBe(targetSection.semester.id)
    expect(promoted.sectionId).toBe(targetSection.id)
    expect(promoted.save).toHaveBeenCalledOnce()
    expect(excluded.save).not.toHaveBeenCalled()
    expect(blocked.save).not.toHaveBeenCalled()
    expect(deps.deactivateSourceEnrollments).toHaveBeenCalledWith([promoted.id], sourceSection.id)
    expect(deps.syncTargetEnrollments).toHaveBeenCalledWith(promoted.id)
    expect(result.summary).toEqual({ total: 3, promoted: 1, excluded: 1, blocked: 1 })
  })

  it('rejects exclusions that are not eligible source students', async () => {
    const deps = dependencies()

    await expect(
      createSemesterPromotionService(deps).promote({
        sourceSectionId: sourceSection.id,
        targetSectionId: targetSection.id,
        excludedStudentIds: ['unknown-student'],
      })
    ).rejects.toEqual(new ApiError(400, 'Excluded students must be eligible promotion candidates'))
  })
})
