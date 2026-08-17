import { Types, isValidObjectId } from 'mongoose'
import {
  CourseOfferingModel,
  type CourseOfferingDocument,
} from '../models/course-offering.model.js'
import { type CourseDocument } from '../models/course.model.js'
import { EnrollmentModel } from '../models/enrollment.model.js'
import { ExamModel, type ExamDocument } from '../models/exam.model.js'
import { type ProgramDocument } from '../models/program.model.js'
import { type SectionDocument } from '../models/section.model.js'
import { type SemesterDocument } from '../models/semester.model.js'
import type { UserDocument } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'
import type { SaveExamPayload } from '../validators/exam.validator.js'

type PopulatedCourse = CourseDocument & {
  program: ProgramDocument
  semester: SemesterDocument
}

type PopulatedSection = SectionDocument & {
  program: ProgramDocument
  semester: SemesterDocument
}

type PopulatedOffering = CourseOfferingDocument & {
  course: PopulatedCourse
  section: PopulatedSection
}

type PopulatedExam = ExamDocument & {
  courseOffering: CourseOfferingDocument
  course: PopulatedCourse
  program: ProgramDocument
  semester: SemesterDocument
  section: PopulatedSection
}

export type SerializedExam = {
  id: string
  examType: string
  courseOfferingId: string
  course: { id: string; code: string; title: string }
  program: { id: string; name: string; code: string }
  semester: { id: string; name: string; academicYear: string }
  section: { id: string; name: string }
  examDate: string
  startTime: string
  endTime: string
  room: string
  instructions?: string
  createdAt?: Date
  updatedAt?: Date
}

function ensureValidObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} ID`)
  }
}

function toMinutes(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':')
  return Number(hours) * 60 + Number(minutes)
}

function optionalString(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined
}

function isPopulatedProgram(value: Types.ObjectId | ProgramDocument): value is ProgramDocument {
  return typeof value === 'object' && 'name' in value && 'code' in value
}

function isPopulatedSemester(value: Types.ObjectId | SemesterDocument): value is SemesterDocument {
  return typeof value === 'object' && 'name' in value && 'academicYear' in value
}

function isPopulatedCourse(value: Types.ObjectId | CourseDocument): value is PopulatedCourse {
  return (
    typeof value === 'object' &&
    'code' in value &&
    'title' in value &&
    isPopulatedProgram(value.program) &&
    isPopulatedSemester(value.semester)
  )
}

function isPopulatedSection(value: Types.ObjectId | SectionDocument): value is PopulatedSection {
  return (
    typeof value === 'object' &&
    'name' in value &&
    isPopulatedProgram(value.program) &&
    isPopulatedSemester(value.semester)
  )
}

function assertOfferingRelationships(
  offering: CourseOfferingDocument
): asserts offering is PopulatedOffering {
  if (!isPopulatedCourse(offering.course) || !isPopulatedSection(offering.section)) {
    throw new ApiError(500, 'Course offering relationships were not loaded')
  }

  if (
    offering.course.program.id !== offering.section.program.id ||
    offering.course.semester.id !== offering.section.semester.id
  ) {
    throw new ApiError(
      400,
      'Course offering must belong to the selected section program and semester'
    )
  }
}

async function resolveOffering(courseOfferingId: string) {
  ensureValidObjectId(courseOfferingId, 'course offering')

  const offering = await CourseOfferingModel.findById(courseOfferingId)
    .populate({ path: 'course', populate: ['program', 'semester'] })
    .populate({ path: 'section', populate: ['program', 'semester'] })
    .exec()

  if (!offering || !offering.isActive) {
    throw new ApiError(404, 'Active course offering not found')
  }

  assertOfferingRelationships(offering)

  if (!offering.course.isActive || !offering.section.isActive) {
    throw new ApiError(400, 'Exam entries require an active course and section')
  }

  return offering
}

async function populateExam(exam: ExamDocument) {
  await exam.populate([
    { path: 'courseOffering', populate: ['teacher'] },
    { path: 'course', populate: ['program', 'semester'] },
    { path: 'program' },
    { path: 'semester' },
    { path: 'section', populate: ['program', 'semester'] },
  ])

  return assertPopulatedExam(exam)
}

function assertPopulatedExam(exam: ExamDocument) {
  if (
    typeof exam.courseOffering !== 'object' ||
    !('course' in exam.courseOffering) ||
    !isPopulatedCourse(exam.course) ||
    !isPopulatedProgram(exam.program) ||
    !isPopulatedSemester(exam.semester) ||
    !isPopulatedSection(exam.section)
  ) {
    throw new ApiError(500, 'Exam relationships were not loaded')
  }

  return exam as PopulatedExam
}

function serializeExam(exam: PopulatedExam): SerializedExam {
  return {
    id: exam.id,
    examType: exam.examType,
    courseOfferingId: exam.courseOffering.id,
    course: {
      id: exam.course.id,
      code: exam.course.code,
      title: exam.course.title,
    },
    program: {
      id: exam.program.id,
      name: exam.program.name,
      code: exam.program.code,
    },
    semester: {
      id: exam.semester.id,
      name: exam.semester.name,
      academicYear: exam.semester.academicYear,
    },
    section: { id: exam.section.id, name: exam.section.name },
    examDate: exam.examDate.toISOString().slice(0, 10),
    startTime: exam.startTime,
    endTime: exam.endTime,
    room: exam.room,
    instructions: exam.instructions,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
  }
}

export async function createExam(payload: SaveExamPayload, adminId: string) {
  ensureValidObjectId(adminId, 'administrator')
  const offering = await resolveOffering(payload.courseOfferingId)
  const values = examValues(payload, offering, adminId)

  const exam = await ExamModel.create({
    ...values,
    createdBy: values.updatedBy,
  })

  return serializeExam(await populateExam(exam))
}

function examValues(payload: SaveExamPayload, offering: PopulatedOffering, adminId: string) {
  return {
    examType: payload.examType.trim(),
    courseOffering: offering._id,
    course: offering.course._id,
    program: offering.course.program._id,
    semester: offering.course.semester._id,
    section: offering.section._id,
    examDate: new Date(`${payload.examDate}T00:00:00.000Z`),
    startTime: payload.startTime,
    endTime: payload.endTime,
    startMinutes: toMinutes(payload.startTime),
    endMinutes: toMinutes(payload.endTime),
    room: payload.room.trim(),
    instructions: optionalString(payload.instructions),
    updatedBy: new Types.ObjectId(adminId),
  }
}

async function findExams(filter: Record<string, unknown>) {
  const exams = await ExamModel.find(filter)
    .sort({ examDate: 1, startMinutes: 1 })
    .limit(200)
    .populate([
      { path: 'courseOffering', populate: ['teacher'] },
      { path: 'course', populate: ['program', 'semester'] },
      { path: 'program' },
      { path: 'semester' },
      { path: 'section', populate: ['program', 'semester'] },
    ])
    .exec()

  return exams.map((exam) => serializeExam(assertPopulatedExam(exam)))
}

export async function updateExam(examId: string, payload: SaveExamPayload, adminId: string) {
  ensureValidObjectId(examId, 'exam')
  ensureValidObjectId(adminId, 'administrator')
  const offering = await resolveOffering(payload.courseOfferingId)
  const exam = await ExamModel.findById(examId).exec()

  if (!exam) {
    throw new ApiError(404, 'Exam entry not found')
  }

  exam.set(examValues(payload, offering, adminId))
  await exam.save()

  return serializeExam(await populateExam(exam))
}

export async function deleteExam(examId: string) {
  ensureValidObjectId(examId, 'exam')
  const exam = await ExamModel.findByIdAndDelete(examId).exec()

  if (!exam) {
    throw new ApiError(404, 'Exam entry not found')
  }
}

export async function listAdminSectionExams(sectionId: string) {
  ensureValidObjectId(sectionId, 'section')
  return findExams({ section: new Types.ObjectId(sectionId) })
}

export async function listStudentExams(student: UserDocument) {
  const enrollments = await EnrollmentModel.find({ student: student._id, isActive: true })
    .select('courseOffering')
    .lean()
    .exec()
  const offeringIds = enrollments.map((enrollment) => enrollment.courseOffering)

  if (offeringIds.length === 0) {
    return []
  }

  return findExams({ courseOffering: { $in: offeringIds } })
}

export async function listTeacherExams(teacher: UserDocument) {
  const offerings = await CourseOfferingModel.find({ teacher: teacher._id, isActive: true })
    .select('_id')
    .lean()
    .exec()
  const offeringIds = offerings.map((offering) => offering._id)

  if (offeringIds.length === 0) {
    return []
  }

  return findExams({ courseOffering: { $in: offeringIds } })
}
