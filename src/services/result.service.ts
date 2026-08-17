import { isValidObjectId, Types } from 'mongoose'
import type { CourseOfferingDocument } from '../models/course-offering.model.js'
import { AssessmentModel } from '../models/assessment.model.js'
import { ResultModel, type ResultDocument, type ResultStatus } from '../models/result.model.js'
import type { UserDocument } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'
import type { ResultCommentPayload } from '../validators/academic-performance.validator.js'
import {
  assertCanAccessCourseOffering,
  listAcademicPerformanceOfferingStudents,
  type AcademicPerformanceStudent,
} from './academic-performance.service.js'
import { getWeightedMarksSummary, type StudentWeightedSummary } from './assessment.service.js'
import { serializeCourseOffering, type SerializedCourseOffering } from './course.service.js'
import { getGradingScale, mapPercentageToGrade } from './grading-scale.service.js'
import { publishResultNotifications } from './notification.service.js'
import type { GradeRange } from '../models/grading-configuration.model.js'

export type SerializedResultRecord = {
  student: AcademicPerformanceStudent
  categories: StudentWeightedSummary['categories']
  finalPercentage: number
  letterGrade: string
  gradePoint: number
}

export type ResultStatistics = {
  studentCount: number
  averagePercentage: number
  highestPercentage: number
  lowestPercentage: number
  passCount: number
}

export type SerializedResult = {
  id?: string
  offering: SerializedCourseOffering
  status: ResultStatus
  records: SerializedResultRecord[]
  statistics: ResultStatistics
  submissionReady: boolean
  hodComment?: string
  reopenReason?: string
  submittedAt?: Date
  approvedAt?: Date
  returnedAt?: Date
  reopenedAt?: Date
  updatedAt?: Date
}

export type StudentCourseResult = {
  id: string
  offering: SerializedCourseOffering
  finalPercentage: number
  letterGrade: string
  gradePoint: number
  approvedAt?: Date
}

export type StudentResultCard = {
  student: {
    name: string
    registrationNumber: string
  }
  program: {
    id: string
    name: string
    code: string
  }
  semester: SerializedCourseOffering['course']['semester']
  courses: Array<{
    resultId: string
    code: string
    title: string
    creditHours: number
    marks: number
    grade: string
    gradePoint: number
  }>
  totalCreditHours: number
  gpa: number
}

function rounded(value: number) {
  return Math.round(value * 100) / 100
}

function ensureValidObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} ID`)
  }
}

function relationId(value: unknown) {
  if (typeof value === 'string') return value
  if (value instanceof Types.ObjectId) return value.toString()
  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: Types.ObjectId | string })._id)
  }
  return null
}

export function calculateCreditWeightedGpa(
  courses: Array<{ creditHours: number; gradePoint: number }>
) {
  const creditHours = courses.reduce((total, course) => total + course.creditHours, 0)
  if (!creditHours) return 0

  const qualityPoints = courses.reduce(
    (total, course) => total + course.creditHours * course.gradePoint,
    0
  )
  return rounded(qualityPoints / creditHours)
}

function createStatistics(records: SerializedResultRecord[]): ResultStatistics {
  if (!records.length) {
    return {
      studentCount: 0,
      averagePercentage: 0,
      highestPercentage: 0,
      lowestPercentage: 0,
      passCount: 0,
    }
  }

  const percentages = records.map((record) => record.finalPercentage)
  return {
    studentCount: records.length,
    averagePercentage: rounded(
      percentages.reduce((total, percentage) => total + percentage, 0) / records.length
    ),
    highestPercentage: Math.max(...percentages),
    lowestPercentage: Math.min(...percentages),
    passCount: records.filter((record) => record.gradePoint > 0).length,
  }
}

function calculateRecords(
  summaries: StudentWeightedSummary[],
  gradingScale: GradeRange[]
): SerializedResultRecord[] {
  return summaries.map((summary) => ({
    student: summary.student,
    categories: summary.categories,
    finalPercentage: summary.weightedTotal,
    ...mapPercentageToGrade(summary.weightedTotal, gradingScale),
  }))
}

function storedRecords(
  result: ResultDocument,
  students: AcademicPerformanceStudent[]
): SerializedResultRecord[] {
  const studentById = new Map(students.map((student) => [student.id, student]))

  return result.records.flatMap((record) => {
    const student = studentById.get(relationId(record.student) ?? '')
    return student
      ? [
          {
            student,
            categories: record.categories,
            finalPercentage: record.finalPercentage,
            letterGrade: record.letterGrade,
            gradePoint: record.gradePoint,
          },
        ]
      : []
  })
}

function serializeResult(
  offering: SerializedCourseOffering,
  records: SerializedResultRecord[],
  result?: ResultDocument | null,
  submissionReady = true
): SerializedResult {
  return {
    id: result?.id,
    offering,
    status: result?.status ?? 'draft',
    records,
    statistics: createStatistics(records),
    submissionReady,
    hodComment: result?.hodComment,
    reopenReason: result?.reopenReason,
    submittedAt: result?.submittedAt,
    approvedAt: result?.approvedAt,
    returnedAt: result?.returnedAt,
    reopenedAt: result?.reopenedAt,
    updatedAt: result?.updatedAt,
  }
}

async function findResultForAction(user: UserDocument, resultId: string) {
  ensureValidObjectId(resultId, 'result')
  const result = await ResultModel.findById(resultId).exec()
  if (!result) throw new ApiError(404, 'Result not found')

  await assertCanAccessCourseOffering(user, result.courseOffering.toString())
  return result
}

export async function getCourseResult(user: UserDocument, offeringId: string) {
  if (user.role === 'student') {
    throw new ApiError(403, 'Students can only access approved published results')
  }

  const [{ offering, students }, summaries, result, assessmentCount, gradingScale] =
    await Promise.all([
      listAcademicPerformanceOfferingStudents(user, offeringId),
      getWeightedMarksSummary(user, offeringId),
      ResultModel.findOne({ courseOffering: offeringId }).exec(),
      AssessmentModel.countDocuments({ courseOffering: offeringId }).exec(),
      getGradingScale(),
    ])
  const records =
    result?.status === 'pending' || result?.status === 'approved'
      ? storedRecords(result, students)
      : calculateRecords(summaries, gradingScale.ranges)

  return serializeResult(
    offering,
    records,
    result,
    assessmentCount > 0 && summaries.every((summary) => summary.missingAssessments === 0)
  )
}

export async function submitCourseResult(teacher: UserDocument, offeringId: string) {
  if (teacher.role !== 'teacher') {
    throw new ApiError(403, 'Teacher result submission required')
  }

  const [context, summaries, current, assessmentCount, gradingScale] = await Promise.all([
    listAcademicPerformanceOfferingStudents(teacher, offeringId),
    getWeightedMarksSummary(teacher, offeringId),
    ResultModel.findOne({ courseOffering: offeringId }).exec(),
    AssessmentModel.countDocuments({ courseOffering: offeringId }).exec(),
    getGradingScale(),
  ])

  if (!summaries.length) throw new ApiError(400, 'A result requires at least one enrolled student')
  if (!assessmentCount) throw new ApiError(400, 'Create at least one assessment before submitting')
  if (summaries.some((summary) => summary.missingAssessments > 0)) {
    throw new ApiError(400, 'Complete every student assessment before submitting the result')
  }
  if (current?.status === 'pending' || current?.status === 'approved') {
    throw new ApiError(409, 'This result is locked and cannot be submitted')
  }

  const records = calculateRecords(summaries, gradingScale.ranges)
  const now = new Date()
  const result = await ResultModel.findOneAndUpdate(
    { courseOffering: offeringId },
    {
      $set: {
        teacher: teacher._id,
        status: 'pending',
        records: records.map((record) => ({
          student: new Types.ObjectId(record.student.id),
          categories: record.categories,
          finalPercentage: record.finalPercentage,
          letterGrade: record.letterGrade,
          gradePoint: record.gradePoint,
        })),
        submittedAt: now,
      },
      $unset: { hodComment: 1 },
      $push: { history: { action: 'submitted', actor: teacher._id, occurredAt: now } },
      $setOnInsert: { courseOffering: new Types.ObjectId(offeringId) },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).exec()

  return serializeResult(context.offering, records, result)
}

export async function approveCourseResult(hod: UserDocument, resultId: string) {
  if (hod.role !== 'hod') throw new ApiError(403, 'HOD result approval required')
  const result = await findResultForAction(hod, resultId)
  if (result.status === 'approved') {
    await publishResultNotifications(result)
    return getCourseResult(hod, result.courseOffering.toString())
  }
  if (result.status !== 'pending') {
    throw new ApiError(409, 'Only pending results can be approved')
  }

  const now = new Date()
  result.status = 'approved'
  result.approvedAt = now
  result.approvedBy = hod._id
  result.hodComment = undefined
  result.history.push({ action: 'approved', actor: hod._id, occurredAt: now })
  await result.save()
  await publishResultNotifications(result)

  return getCourseResult(hod, result.courseOffering.toString())
}

export async function returnCourseResult(
  hod: UserDocument,
  resultId: string,
  payload: ResultCommentPayload
) {
  if (hod.role !== 'hod') throw new ApiError(403, 'HOD result review required')
  const result = await findResultForAction(hod, resultId)
  if (result.status !== 'pending') {
    throw new ApiError(409, 'Only pending results can be returned')
  }

  const now = new Date()
  result.status = 'returned'
  result.hodComment = payload.comment
  result.returnedAt = now
  result.history.push({
    action: 'returned',
    actor: hod._id,
    comment: payload.comment,
    occurredAt: now,
  })
  await result.save()

  return getCourseResult(hod, result.courseOffering.toString())
}

export async function reopenCourseResult(
  user: UserDocument,
  resultId: string,
  payload: ResultCommentPayload
) {
  if (user.role !== 'hod' && user.role !== 'admin') {
    throw new ApiError(403, 'HOD or administrator result reopening required')
  }
  const result = await findResultForAction(user, resultId)
  if (result.status !== 'approved') {
    throw new ApiError(409, 'Only approved results can be reopened')
  }

  const now = new Date()
  result.status = 'returned'
  result.reopenReason = payload.comment
  result.hodComment = payload.comment
  result.reopenedAt = now
  result.history.push({
    action: 'reopened',
    actor: user._id,
    comment: payload.comment,
    occurredAt: now,
  })
  await result.save()

  return getCourseResult(user, result.courseOffering.toString())
}

function isPopulatedOffering(value: unknown): value is CourseOfferingDocument {
  return Boolean(value && typeof value === 'object' && 'course' in value && 'section' in value)
}

export async function getPublishedStudentResults(student: UserDocument) {
  if (student.role !== 'student') {
    throw new ApiError(403, 'Student result access required')
  }

  const results = await ResultModel.find({ status: 'approved', 'records.student': student._id })
    .populate({
      path: 'courseOffering',
      populate: [
        { path: 'course', populate: ['department', 'program', 'semester'] },
        { path: 'section', populate: ['program', 'semester'] },
        { path: 'teacher', populate: ['department'] },
      ],
    })
    .sort({ approvedAt: -1 })
    .exec()

  const courses: StudentCourseResult[] = []
  for (const result of results) {
    if (!isPopulatedOffering(result.courseOffering)) continue
    const record = result.records.find((candidate) => relationId(candidate.student) === student.id)
    if (!record) continue

    courses.push({
      id: result.id,
      offering: await serializeCourseOffering(result.courseOffering),
      finalPercentage: record.finalPercentage,
      letterGrade: record.letterGrade,
      gradePoint: record.gradePoint,
      approvedAt: result.approvedAt,
    })
  }

  const bySemester = new Map<string, StudentCourseResult[]>()
  for (const courseResult of courses) {
    const semesterId = courseResult.offering.course.semester.id
    bySemester.set(semesterId, [...(bySemester.get(semesterId) ?? []), courseResult])
  }

  const semesters = [...bySemester.values()].map((semesterCourses) => ({
    semester: semesterCourses[0]!.offering.course.semester,
    gpa: calculateCreditWeightedGpa(
      semesterCourses.map((course) => ({
        creditHours: course.offering.course.creditHours,
        gradePoint: course.gradePoint,
      }))
    ),
    courses: semesterCourses,
  }))
  const cgpa = calculateCreditWeightedGpa(
    courses.map((course) => ({
      creditHours: course.offering.course.creditHours,
      gradePoint: course.gradePoint,
    }))
  )

  return { semesters, cgpa }
}

export async function getStudentResultCard(student: UserDocument, semesterId: string) {
  if (student.role !== 'student') {
    throw new ApiError(403, 'Student result-card access required')
  }
  ensureValidObjectId(semesterId, 'semester')

  const publishedResults = await getPublishedStudentResults(student)
  const semesterResult = publishedResults.semesters.find(
    (candidate) => candidate.semester.id === semesterId
  )
  if (!semesterResult?.courses.length) {
    throw new ApiError(404, 'Approved semester result not found')
  }

  const firstCourse = semesterResult.courses[0]!
  const courses = semesterResult.courses.map((courseResult) => ({
    resultId: courseResult.id,
    code: courseResult.offering.course.code,
    title: courseResult.offering.course.title,
    creditHours: courseResult.offering.course.creditHours,
    marks: courseResult.finalPercentage,
    grade: courseResult.letterGrade,
    gradePoint: courseResult.gradePoint,
  }))
  return {
    student: {
      name: student.fullName,
      registrationNumber: student.registrationNumber ?? 'Not assigned',
    },
    program: firstCourse.offering.course.program,
    semester: semesterResult.semester,
    courses,
    totalCreditHours: courses.reduce((total, course) => total + course.creditHours, 0),
    gpa: semesterResult.gpa,
  } satisfies StudentResultCard
}
