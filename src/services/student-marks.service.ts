import type { Types } from 'mongoose'
import type { AssessmentCategory, AssessmentDocument } from '../models/assessment.model.js'
import { MarkSheetModel, type MarkStatus } from '../models/mark-sheet.model.js'
import type { UserDocument } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'
import { getAssessmentStructure } from './assessment.service.js'
import { serializeCourseOffering, type SerializedCourseOffering } from './course.service.js'

export type PublishedStudentMark = {
  assessment: {
    id: string
    name: string
    category: AssessmentCategory
    maximumMarks: number
  }
  offering: SerializedCourseOffering
  obtainedMarks?: number
  status?: MarkStatus
  percentage?: number
  publishedAt?: Date
}

export type StudentAcademicSummary = {
  publishedAssessments: number
  coursesWithMarks: number
  averagePercentage: number
  weightedPercentage: number
}

export type PublishedStudentMarks = {
  recentMarks: PublishedStudentMark[]
  summary: StudentAcademicSummary
}

function isPopulatedAssessment(value: unknown): value is AssessmentDocument {
  return Boolean(value && typeof value === 'object' && 'name' in value && 'maximumMarks' in value)
}

function isPopulatedOffering(
  value: unknown
): value is Parameters<typeof serializeCourseOffering>[0] {
  return Boolean(value && typeof value === 'object' && 'course' in value && 'section' in value)
}

function studentId(value: Types.ObjectId | UserDocument) {
  return typeof value === 'object' && 'id' in value ? value.id : value.toString()
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

export async function listPublishedStudentMarks(
  student: UserDocument
): Promise<PublishedStudentMarks> {
  if (student.role !== 'student') {
    throw new ApiError(403, 'Student marks access required')
  }

  const [sheets, structure] = await Promise.all([
    MarkSheetModel.find({
      isDraft: false,
      'records.student': student._id,
    })
      .sort({ updatedAt: -1 })
      .populate('assessment')
      .populate({
        path: 'courseOffering',
        populate: [
          { path: 'course', populate: ['department', 'program', 'semester'] },
          { path: 'section', populate: ['program', 'semester'] },
          { path: 'teacher', populate: ['department'] },
        ],
      })
      .exec(),
    getAssessmentStructure(),
  ])
  const marks = await Promise.all(
    sheets.map(async (sheet): Promise<PublishedStudentMark | null> => {
      if (!isPopulatedAssessment(sheet.assessment) || !isPopulatedOffering(sheet.courseOffering)) {
        return null
      }

      const record = sheet.records.find((entry) => studentId(entry.student) === student.id)

      if (!record) {
        return null
      }

      return {
        assessment: {
          id: sheet.assessment.id,
          name: sheet.assessment.name,
          category: sheet.assessment.category,
          maximumMarks: sheet.assessment.maximumMarks,
        },
        offering: await serializeCourseOffering(sheet.courseOffering),
        obtainedMarks: record.obtainedMarks,
        status: record.status,
        percentage:
          record.obtainedMarks === undefined
            ? record.status === 'absent'
              ? 0
              : undefined
            : round((record.obtainedMarks / sheet.assessment.maximumMarks) * 100),
        publishedAt: sheet.updatedAt,
      }
    })
  )
  const publishedMarks = marks.filter((mark): mark is PublishedStudentMark => Boolean(mark))
  const scoredMarks = publishedMarks.filter((mark) => mark.percentage !== undefined)
  const courseIds = new Set(publishedMarks.map((mark) => mark.offering.id))
  const weightedPercentage = structure.categories.reduce((total, category) => {
    const categoryMarks = scoredMarks.filter(
      (mark) => mark.assessment.category === category.id
    )

    if (!categoryMarks.length) {
      return total
    }

    const average =
      categoryMarks.reduce((sum, mark) => sum + mark.percentage!, 0) / categoryMarks.length

    return total + (average / 100) * category.weightPercentage
  }, 0)

  return {
    recentMarks: publishedMarks.slice(0, 5),
    summary: {
      publishedAssessments: publishedMarks.length,
      coursesWithMarks: courseIds.size,
      averagePercentage: scoredMarks.length
        ? round(
            scoredMarks.reduce((sum, mark) => sum + mark.percentage!, 0) / scoredMarks.length
          )
        : 0,
      weightedPercentage: round(weightedPercentage),
    },
  }
}
