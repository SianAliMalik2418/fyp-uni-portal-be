import { isValidObjectId, Types } from 'mongoose'
import { EnrollmentModel } from '../models/enrollment.model.js'
import { SectionModel } from '../models/section.model.js'
import type { SemesterDocument } from '../models/semester.model.js'
import { UserModel, type StudentAcademicStatus } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'

export type PromotionSection = {
  id: string
  name: string
  programId: string
  batchId: string
  isActive: boolean
  semester: {
    id: string
    name: string
    academicYear: string
    startsAt?: Date
    isClosed: boolean
  }
}

export type PromotionStudent = {
  id: string
  fullName: string
  registrationNumber?: string
  academicStatus?: StudentAcademicStatus
  isActive: boolean
  semesterId?: string
  sectionId?: string
  save(): Promise<unknown>
}

export type PromotionDependencies = {
  getSection(sectionId: string): Promise<PromotionSection | null>
  listStudents(sourceSectionId: string): Promise<PromotionStudent[]>
  deactivateSourceEnrollments(studentIds: string[], sourceSectionId: string): Promise<unknown>
  syncTargetEnrollments(studentId: string): Promise<unknown>
}

export type PromotionSelection = {
  sourceSectionId: string
  targetSectionId: string
}

export type PromotionRequest = PromotionSelection & {
  excludedStudentIds: string[]
}

function studentSummary(student: PromotionStudent) {
  const eligible = student.isActive && student.academicStatus === 'active'
  const reason = !student.isActive
    ? 'Account is inactive'
    : student.academicStatus !== 'active'
      ? `Academic status is ${student.academicStatus ?? 'not set'}`
      : undefined

  return {
    id: student.id,
    fullName: student.fullName,
    registrationNumber: student.registrationNumber,
    academicStatus: student.academicStatus,
    isActive: student.isActive,
    eligible,
    reason,
  }
}

async function promotionContext(
  dependencies: PromotionDependencies,
  selection: PromotionSelection
) {
  const [source, target] = await Promise.all([
    dependencies.getSection(selection.sourceSectionId),
    dependencies.getSection(selection.targetSectionId),
  ])

  if (!source || !target) {
    throw new ApiError(404, 'Source or target section not found')
  }
  if (source.id === target.id || source.semester.id === target.semester.id) {
    throw new ApiError(400, 'Target section must use a different semester')
  }
  if (source.programId !== target.programId || source.batchId !== target.batchId) {
    throw new ApiError(400, 'Target section must use the same program and batch')
  }
  if (!target.isActive || target.semester.isClosed) {
    throw new ApiError(400, 'Target section and semester must be open and active')
  }
  if (
    source.semester.startsAt &&
    target.semester.startsAt &&
    target.semester.startsAt <= source.semester.startsAt
  ) {
    throw new ApiError(400, 'Target semester must start after the current semester')
  }

  const students = await dependencies.listStudents(source.id)
  return { source, target, students }
}

export function createSemesterPromotionService(dependencies: PromotionDependencies) {
  return {
    async getCandidates(selection: PromotionSelection) {
      const { source, target, students } = await promotionContext(dependencies, selection)
      const candidates = students.map(studentSummary)
      const eligible = candidates.filter((student) => student.eligible).length

      return {
        source,
        target,
        students: candidates,
        summary: { total: candidates.length, eligible, blocked: candidates.length - eligible },
      }
    },

    async promote(request: PromotionRequest) {
      const { source, target, students } = await promotionContext(dependencies, request)
      const eligibleStudents = students.filter(
        (student) => student.isActive && student.academicStatus === 'active'
      )
      const eligibleIds = new Set(eligibleStudents.map((student) => student.id))
      const excludedIds = new Set(request.excludedStudentIds)

      if ([...excludedIds].some((studentId) => !eligibleIds.has(studentId))) {
        throw new ApiError(400, 'Excluded students must be eligible promotion candidates')
      }

      const promotedStudents = eligibleStudents.filter((student) => !excludedIds.has(student.id))
      await Promise.all(
        promotedStudents.map(async (student) => {
          student.semesterId = target.semester.id
          student.sectionId = target.id
          await student.save()
        })
      )

      const promotedIds = promotedStudents.map((student) => student.id)
      await dependencies.deactivateSourceEnrollments(promotedIds, source.id)
      await Promise.all(
        promotedIds.map((studentId) => dependencies.syncTargetEnrollments(studentId))
      )

      const blocked = students.filter(
        (student) => !student.isActive || student.academicStatus !== 'active'
      )
      return {
        source,
        target,
        promoted: promotedStudents.map(studentSummary),
        excluded: eligibleStudents
          .filter((student) => excludedIds.has(student.id))
          .map(studentSummary),
        blocked: blocked.map(studentSummary),
        summary: {
          total: students.length,
          promoted: promotedStudents.length,
          excluded: excludedIds.size,
          blocked: blocked.length,
        },
      }
    },
  }
}

function ensureObjectId(value: string) {
  if (!isValidObjectId(value)) throw new ApiError(400, 'Invalid section ID')
}

const defaultDependencies: PromotionDependencies = {
  async getSection(sectionId) {
    ensureObjectId(sectionId)
    const section = await SectionModel.findById(sectionId)
      .populate<{ semester: SemesterDocument }>('semester')
      .exec()
    if (!section?.semester) return null

    return {
      id: section.id,
      name: section.name,
      programId: section.program.toString(),
      batchId: section.batch.toString(),
      isActive: section.isActive,
      semester: {
        id: section.semester.id,
        name: section.semester.name,
        academicYear: section.semester.academicYear,
        startsAt: section.semester.startsAt,
        isClosed: section.semester.isClosed,
      },
    }
  },
  async listStudents(sourceSectionId) {
    const students = await UserModel.find({ role: 'student', section: sourceSectionId })
      .sort({ fullName: 1 })
      .select('-passwordHash')
      .exec()

    return students.map((student) => ({
      id: student.id,
      fullName: student.fullName,
      registrationNumber: student.registrationNumber,
      academicStatus: student.academicStatus,
      isActive: student.isActive,
      get semesterId() {
        return student.semester?.toString()
      },
      set semesterId(value: string | undefined) {
        student.semester = value ? new Types.ObjectId(value) : undefined
      },
      get sectionId() {
        return student.section?.toString()
      },
      set sectionId(value: string | undefined) {
        student.section = value ? new Types.ObjectId(value) : undefined
      },
      save: () => student.save(),
    }))
  },
  deactivateSourceEnrollments(studentIds, sourceSectionId) {
    if (!studentIds.length) return Promise.resolve()
    return EnrollmentModel.updateMany(
      { student: { $in: studentIds }, section: sourceSectionId },
      { $set: { isActive: false } }
    ).exec()
  },
  async syncTargetEnrollments(studentId) {
    const { syncStudentEnrollments } = await import('./course.service.js')
    return syncStudentEnrollments(studentId)
  },
}

export const semesterPromotionService = createSemesterPromotionService(defaultDependencies)
