import { isValidObjectId, Types } from 'mongoose'
import {
  AssessmentModel,
  type AssessmentCategory,
  type AssessmentDocument,
} from '../models/assessment.model.js'
import { MarkSheetModel, type MarkStatus } from '../models/mark-sheet.model.js'
import type { UserDocument } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'
import type {
  AssessmentPayload,
  MarkSheetPayload,
} from '../validators/academic-performance.validator.js'
import {
  assertCanAccessCourseOffering,
  listAcademicPerformanceOfferingStudents,
  type AcademicPerformanceStudent,
} from './academic-performance.service.js'
import { serializeCourseOffering, type SerializedCourseOffering } from './course.service.js'

export type AssessmentCategoryDefinition = {
  id: AssessmentCategory
  label: string
  weightPercentage: number
}

export type SerializedAssessment = {
  id: string
  offering: SerializedCourseOffering
  name: string
  category: AssessmentCategory
  maximumMarks: number
  createdAt?: Date
  updatedAt?: Date
}

export type SerializedMarkRecord = {
  student: AcademicPerformanceStudent
  obtainedMarks?: number
  status?: MarkStatus
  missing: boolean
}

export type SerializedMarkSheet = {
  assessment: SerializedAssessment
  records: SerializedMarkRecord[]
  isDraft: true
  missingCount: number
  updatedAt?: Date
}

export type StudentCategoryAggregate = {
  category: AssessmentCategory
  obtainedMarks: number
  maximumMarks: number
  percentage: number
  weightedMarks: number
}

export type StudentWeightedSummary = {
  student: AcademicPerformanceStudent
  categories: StudentCategoryAggregate[]
  weightedTotal: number
  missingAssessments: number
}

export const activeAssessmentCategories: AssessmentCategoryDefinition[] = [
  { id: 'quiz', label: 'Quizzes', weightPercentage: 10 },
  { id: 'assignment', label: 'Assignments', weightPercentage: 10 },
  { id: 'attendance', label: 'Attendance', weightPercentage: 10 },
  { id: 'presentation', label: 'Presentation', weightPercentage: 10 },
  { id: 'midterm', label: 'Midterm', weightPercentage: 25 },
  { id: 'final', label: 'Final', weightPercentage: 35 },
]

function ensureValidObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} ID`)
  }
}

function relationId(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Types.ObjectId) {
    return value.toString()
  }

  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: Types.ObjectId | string })._id)
  }

  return null
}

function isPopulatedAssessmentOffering(
  value: unknown
): value is AssessmentDocument['courseOffering'] & Parameters<typeof serializeCourseOffering>[0] {
  return Boolean(value && typeof value === 'object' && 'course' in value && 'section' in value)
}

async function populateAssessment(assessment: AssessmentDocument) {
  await assessment.populate({
    path: 'courseOffering',
    populate: [
      { path: 'course', populate: ['department', 'program', 'semester'] },
      { path: 'section', populate: ['program', 'semester'] },
      { path: 'teacher', populate: ['department'] },
    ],
  })

  return assessment
}

async function serializeAssessment(assessment: AssessmentDocument): Promise<SerializedAssessment> {
  if (!isPopulatedAssessmentOffering(assessment.courseOffering)) {
    throw new ApiError(500, 'Assessment course offering was not loaded')
  }

  return {
    id: assessment.id,
    offering: await serializeCourseOffering(assessment.courseOffering),
    name: assessment.name,
    category: assessment.category,
    maximumMarks: assessment.maximumMarks,
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
  }
}

function serializeAssessmentWithOffering(
  assessment: AssessmentDocument,
  offering: SerializedCourseOffering
): SerializedAssessment {
  return {
    id: assessment.id,
    offering,
    name: assessment.name,
    category: assessment.category,
    maximumMarks: assessment.maximumMarks,
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
  }
}

async function findAccessibleAssessment(user: UserDocument, assessmentId: string) {
  ensureValidObjectId(assessmentId, 'assessment')
  const assessment = await AssessmentModel.findById(assessmentId).exec()

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found')
  }

  await assertCanAccessCourseOffering(user, assessment.courseOffering.toString())
  return assessment
}

export function getAssessmentCategories() {
  return activeAssessmentCategories
}

export async function createAssessment(teacher: UserDocument, payload: AssessmentPayload) {
  if (teacher.role !== 'teacher') {
    throw new ApiError(403, 'Teacher assessment access required')
  }

  const offering = await assertCanAccessCourseOffering(teacher, payload.offeringId)
  const duplicate = await AssessmentModel.findOne({
    courseOffering: offering._id,
    name: payload.name,
  })
    .select('_id')
    .exec()

  if (duplicate) {
    throw new ApiError(409, 'An assessment with this name already exists for the course')
  }

  const assessment = await AssessmentModel.create({
    courseOffering: offering._id,
    teacher: teacher._id,
    name: payload.name,
    category: payload.category,
    maximumMarks: payload.maximumMarks,
  })

  return serializeAssessment(await populateAssessment(assessment))
}

export async function listAssessments(user: UserDocument, offeringId: string) {
  const offering = await assertCanAccessCourseOffering(user, offeringId)
  const assessments = await AssessmentModel.find({ courseOffering: offering._id })
    .sort({ category: 1, createdAt: 1 })
    .exec()
  const serializedOffering = await serializeCourseOffering(offering)

  return assessments.map((assessment) =>
    serializeAssessmentWithOffering(assessment, serializedOffering)
  )
}

export async function getMarkSheet(user: UserDocument, assessmentId: string) {
  const assessment = await findAccessibleAssessment(user, assessmentId)
  const offeringId = assessment.courseOffering.toString()
  const [{ offering, students }, sheet] = await Promise.all([
    listAcademicPerformanceOfferingStudents(user, offeringId),
    MarkSheetModel.findOne({ assessment: assessment._id }).exec(),
  ])
  const savedRecords = new Map(
    (sheet?.records ?? []).map((record) => [relationId(record.student), record])
  )
  const records = students.map((student) => {
    const saved = savedRecords.get(student.id)

    return {
      student,
      obtainedMarks: saved?.obtainedMarks,
      status: saved?.status,
      missing: saved?.obtainedMarks === undefined && saved?.status === undefined,
    }
  })

  return {
    assessment: serializeAssessmentWithOffering(assessment, offering),
    records,
    isDraft: true,
    missingCount: records.filter((record) => record.missing).length,
    updatedAt: sheet?.updatedAt,
  } satisfies SerializedMarkSheet
}

function validateMarkRecords(
  students: AcademicPerformanceStudent[],
  maximumMarks: number,
  records: MarkSheetPayload['records']
) {
  const enrolledIds = new Set(students.map((student) => student.id))
  const submittedIds = new Set<string>()

  for (const record of records) {
    ensureValidObjectId(record.studentId, 'student')

    if (submittedIds.has(record.studentId)) {
      throw new ApiError(400, 'Marks cannot include duplicate students')
    }

    if (!enrolledIds.has(record.studentId)) {
      throw new ApiError(400, 'Marks can only be saved for enrolled students')
    }

    if (record.obtainedMarks !== undefined && record.obtainedMarks > maximumMarks) {
      throw new ApiError(400, `Marks cannot exceed the assessment maximum of ${maximumMarks}`)
    }

    submittedIds.add(record.studentId)
  }
}

export async function saveMarkSheetDraft(
  teacher: UserDocument,
  assessmentId: string,
  payload: MarkSheetPayload
) {
  if (teacher.role !== 'teacher') {
    throw new ApiError(403, 'Teacher marks access required')
  }

  const assessment = await findAccessibleAssessment(teacher, assessmentId)
  const offeringId = assessment.courseOffering.toString()
  const { students } = await listAcademicPerformanceOfferingStudents(teacher, offeringId)
  validateMarkRecords(students, assessment.maximumMarks, payload.records)

  await MarkSheetModel.findOneAndUpdate(
    { assessment: assessment._id },
    {
      $set: {
        courseOffering: assessment.courseOffering,
        teacher: teacher._id,
        records: payload.records.map((record) => ({
          student: new Types.ObjectId(record.studentId),
          obtainedMarks: record.obtainedMarks,
          status: record.status,
        })),
        isDraft: true,
      },
      $setOnInsert: { assessment: assessment._id },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).exec()

  return getMarkSheet(teacher, assessmentId)
}

function rounded(value: number) {
  return Math.round(value * 100) / 100
}

export async function getWeightedMarksSummary(user: UserDocument, offeringId: string) {
  const { students } = await listAcademicPerformanceOfferingStudents(user, offeringId)
  const assessments = await AssessmentModel.find({ courseOffering: offeringId }).exec()
  const sheets = await MarkSheetModel.find({
    assessment: { $in: assessments.map((assessment) => assessment._id) },
  }).exec()
  const sheetByAssessment = new Map(
    sheets.map((sheet) => [sheet.assessment.toString(), sheet.records])
  )

  return students.map((student): StudentWeightedSummary => {
    let missingAssessments = 0
    const categories = activeAssessmentCategories.map((definition) => {
      let obtainedMarks = 0
      let maximumMarks = 0

      for (const assessment of assessments) {
        if (assessment.category !== definition.id) continue

        const record = sheetByAssessment
          .get(assessment.id)
          ?.find((candidate) => relationId(candidate.student) === student.id)

        if (!record || (record.obtainedMarks === undefined && record.status === undefined)) {
          missingAssessments += 1
          continue
        }

        if (record.status === 'exempted' || record.status === 'result_withheld') continue

        maximumMarks += assessment.maximumMarks
        obtainedMarks += record.obtainedMarks ?? 0
      }

      const percentage = maximumMarks > 0 ? rounded((obtainedMarks / maximumMarks) * 100) : 0

      return {
        category: definition.id,
        obtainedMarks: rounded(obtainedMarks),
        maximumMarks: rounded(maximumMarks),
        percentage,
        weightedMarks: rounded((percentage / 100) * definition.weightPercentage),
      }
    })

    return {
      student,
      categories,
      weightedTotal: rounded(
        categories.reduce((total, category) => total + category.weightedMarks, 0)
      ),
      missingAssessments,
    }
  })
}
