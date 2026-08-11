import { isValidObjectId, Types } from 'mongoose'
import {
  CourseOfferingModel,
  type CourseOfferingDocument,
} from '../models/course-offering.model.js'
import { EnrollmentModel } from '../models/enrollment.model.js'
import type { UserRole } from '../models/user.model.js'
import { UserModel, type StudentAcademicStatus, type UserDocument } from '../models/user.model.js'
import { serializeCourseOffering, type SerializedCourseOffering } from './course.service.js'
import { listSections, type SerializedSection } from './section.service.js'
import { listSemesters, type SerializedSemester } from './semester.service.js'
import { ApiError } from '../utils/api-error.js'

export type AcademicPerformanceModule = 'attendance' | 'assessments' | 'marks' | 'results'

export type AcademicPerformancePlaceholder = {
  module: AcademicPerformanceModule
  items: []
  empty: true
  message: string
  allowedRoles: UserRole[]
}

export type AcademicPerformanceContext = {
  currentSemester: SerializedSemester | null
  activeSections: SerializedSection[]
  studentSection: AcademicPerformanceStudentRelation | null
  students: AcademicPerformanceStudent[]
  canResolveStudentSection: boolean
}

export type AcademicPerformanceOfferingStudents = {
  offering: SerializedCourseOffering
  students: AcademicPerformanceStudent[]
}

export type AcademicPerformanceStudentRelation = {
  id: string
  name: string
  code?: string
  academicYear?: string
}

export type AcademicPerformanceStudent = {
  id: string
  name: string
  registrationNumber: string
  academicStatus?: StudentAcademicStatus
  isActive: boolean
  department: AcademicPerformanceStudentRelation | null
  program: AcademicPerformanceStudentRelation | null
  batch: AcademicPerformanceStudentRelation | null
  semester: AcademicPerformanceStudentRelation | null
  section: AcademicPerformanceStudentRelation | null
}

const placeholders: Record<
  AcademicPerformanceModule,
  Omit<AcademicPerformancePlaceholder, 'module'>
> = {
  attendance: {
    items: [],
    empty: true,
    message: 'No attendance records available yet.',
    allowedRoles: ['student', 'teacher', 'hod', 'admin'],
  },
  assessments: {
    items: [],
    empty: true,
    message: 'No assessment structure available yet.',
    allowedRoles: ['teacher', 'admin'],
  },
  marks: {
    items: [],
    empty: true,
    message: 'No marks records available yet.',
    allowedRoles: ['teacher', 'admin'],
  },
  results: {
    items: [],
    empty: true,
    message: 'No results available yet.',
    allowedRoles: ['student', 'teacher', 'hod', 'admin'],
  },
}

export function getAcademicPerformancePlaceholder(
  module: AcademicPerformanceModule
): AcademicPerformancePlaceholder {
  return {
    module,
    ...placeholders[module],
  }
}

export function getAcademicPerformanceAllowedRoles(module: AcademicPerformanceModule) {
  return placeholders[module].allowedRoles
}

function serializeStudentRelation(value: unknown): AcademicPerformanceStudentRelation | null {
  if (!value || typeof value !== 'object' || !('id' in value) || !('name' in value)) {
    return null
  }

  const relation = value as {
    id: string
    name: string
    code?: string
    academicYear?: string
  }

  return {
    id: relation.id,
    name: relation.name,
    code: relation.code,
    academicYear: relation.academicYear,
  }
}

function ensureValidObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} ID`)
  }
}

function relationId(value: unknown) {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && '_id' in value) {
    return String((value as { _id: Types.ObjectId | string })._id)
  }

  if (value instanceof Types.ObjectId) {
    return value.toString()
  }

  return null
}

function isPopulatedAcademicStudent(value: unknown): value is {
  id: string
  fullName: string
  registrationNumber?: string
  academicStatus?: StudentAcademicStatus
  isActive: boolean
  department?: unknown
  program?: unknown
  batch?: unknown
  semester?: unknown
  section?: unknown
} {
  return Boolean(value && typeof value === 'object' && 'fullName' in value)
}

function isPopulatedOfferingCourse(value: unknown): value is { department: unknown } {
  return Boolean(value && typeof value === 'object' && 'department' in value)
}

function serializeAcademicStudent(student: {
  id: string
  fullName: string
  registrationNumber?: string
  academicStatus?: StudentAcademicStatus
  isActive: boolean
  department?: unknown
  program?: unknown
  batch?: unknown
  semester?: unknown
  section?: unknown
}): AcademicPerformanceStudent {
  return {
    id: student.id,
    name: student.fullName,
    registrationNumber: student.registrationNumber ?? '-',
    academicStatus: student.academicStatus,
    isActive: student.isActive,
    department: serializeStudentRelation(student.department),
    program: serializeStudentRelation(student.program),
    batch: serializeStudentRelation(student.batch),
    semester: serializeStudentRelation(student.semester),
    section: serializeStudentRelation(student.section),
  }
}

async function listAcademicPerformanceStudents(): Promise<AcademicPerformanceStudent[]> {
  const students = await UserModel.find({ role: 'student' })
    .sort({ registrationNumber: 1, fullName: 1 })
    .select(
      'fullName registrationNumber department program batch semester section academicStatus isActive'
    )
    .populate(['department', 'program', 'batch', 'semester', 'section'])
    .exec()

  return students.map((student) => serializeAcademicStudent(student))
}

export async function getAcademicPerformanceContext(
  currentUserId?: string
): Promise<AcademicPerformanceContext> {
  const [semesters, sections, students] = await Promise.all([
    listSemesters(),
    listSections(),
    listAcademicPerformanceStudents(),
  ])
  const currentSemester =
    semesters.find((semester) => semester.isActive && !semester.isClosed) ?? null
  const activeSections = sections.filter((section) => {
    if (!section.isActive) {
      return false
    }

    if (!currentSemester) {
      return true
    }

    return section.semester.id === currentSemester.id
  })
  const currentStudentSection =
    students.find((student) => student.id === currentUserId)?.section ?? null

  return {
    currentSemester,
    activeSections,
    studentSection: currentStudentSection,
    students,
    canResolveStudentSection: Boolean(currentStudentSection),
  }
}

async function findActiveOffering(offeringId: string) {
  ensureValidObjectId(offeringId, 'course offering')
  const offering = await CourseOfferingModel.findOne({ _id: offeringId, isActive: true })
    .populate({ path: 'course', populate: ['department', 'program', 'semester'] })
    .populate({ path: 'section', populate: ['program', 'semester'] })
    .populate({ path: 'teacher', populate: ['department'] })
    .exec()

  if (!offering) {
    throw new ApiError(404, 'Course offering not found')
  }

  return offering as unknown as CourseOfferingDocument
}

export async function assertTeacherOwnsCourseOffering(teacher: UserDocument, offeringId: string) {
  if (teacher.role !== 'teacher') {
    throw new ApiError(403, 'Teacher course access required')
  }

  ensureValidObjectId(offeringId, 'course offering')
  const offering = await CourseOfferingModel.findOne({
    _id: offeringId,
    teacher: teacher._id,
    isActive: true,
  })
    .select('_id')
    .exec()

  if (!offering) {
    throw new ApiError(403, 'Teacher can only access assigned course sections')
  }
}

export async function assertStudentEnrolledInCourseOffering(
  student: UserDocument,
  offeringId: string
) {
  if (student.role !== 'student') {
    throw new ApiError(403, 'Student course access required')
  }

  ensureValidObjectId(offeringId, 'course offering')
  const enrollment = await EnrollmentModel.findOne({
    student: student._id,
    courseOffering: offeringId,
    isActive: true,
  })
    .select('_id')
    .exec()

  if (!enrollment) {
    throw new ApiError(403, 'Student is not enrolled in this course offering')
  }
}

export async function assertCanAccessCourseOffering(user: UserDocument, offeringId: string) {
  const offering = await findActiveOffering(offeringId)

  if (user.role === 'admin') {
    return offering
  }

  if (user.role === 'teacher') {
    const teacherId = relationId(offering.teacher)

    if (teacherId !== user._id.toString()) {
      throw new ApiError(403, 'Teacher can only access assigned course sections')
    }

    return offering
  }

  if (user.role === 'student') {
    await assertStudentEnrolledInCourseOffering(user, offeringId)
    return offering
  }

  if (user.role === 'hod' && user.department && isPopulatedOfferingCourse(offering.course)) {
    const departmentId = relationId(offering.course.department)

    if (departmentId === user.department.toString()) {
      return offering
    }
  }

  throw new ApiError(403, 'Unauthorized course offering access')
}

async function listStudentOfferings(student: UserDocument) {
  const enrollments = await EnrollmentModel.find({ student: student._id, isActive: true })
    .populate({
      path: 'courseOffering',
      match: { isActive: true },
      populate: [
        { path: 'course', populate: ['department', 'program', 'semester'] },
        { path: 'section', populate: ['program', 'semester'] },
        { path: 'teacher', populate: ['department'] },
      ],
    })
    .exec()

  const offerings = enrollments
    .map((enrollment) => enrollment.courseOffering)
    .filter(Boolean) as unknown as CourseOfferingDocument[]

  return Promise.all(offerings.map((offering) => serializeCourseOffering(offering)))
}

async function listTeacherOfferings(teacher: UserDocument) {
  const offerings = await CourseOfferingModel.find({ teacher: teacher._id, isActive: true })
    .sort({ createdAt: 1 })
    .populate({ path: 'course', populate: ['department', 'program', 'semester'] })
    .populate({ path: 'section', populate: ['program', 'semester'] })
    .populate({ path: 'teacher', populate: ['department'] })
    .exec()

  return Promise.all(
    offerings.map((offering) =>
      serializeCourseOffering(offering as unknown as CourseOfferingDocument)
    )
  )
}

async function listManagedOfferings(user: UserDocument) {
  const offerings = await CourseOfferingModel.find({ isActive: true })
    .sort({ createdAt: 1 })
    .populate({ path: 'course', populate: ['department', 'program', 'semester'] })
    .populate({ path: 'section', populate: ['program', 'semester'] })
    .populate({ path: 'teacher', populate: ['department'] })
    .exec()

  const serializedOfferings = await Promise.all(
    offerings.map((offering) =>
      serializeCourseOffering(offering as unknown as CourseOfferingDocument)
    )
  )

  if (user.role !== 'hod' || !user.department) {
    return serializedOfferings
  }

  return serializedOfferings.filter(
    (offering) => offering.course.department.id === user.department!.toString()
  )
}

export async function listAcademicPerformanceOfferings(user: UserDocument) {
  if (user.role === 'student') {
    return listStudentOfferings(user)
  }

  if (user.role === 'teacher') {
    return listTeacherOfferings(user)
  }

  return listManagedOfferings(user)
}

export async function listAcademicPerformanceOfferingStudents(
  user: UserDocument,
  offeringId: string
): Promise<AcademicPerformanceOfferingStudents> {
  const offering = await assertCanAccessCourseOffering(user, offeringId)
  const enrollments = await EnrollmentModel.find({ courseOffering: offering._id, isActive: true })
    .populate({
      path: 'student',
      select:
        'fullName registrationNumber department program batch semester section academicStatus isActive',
      populate: ['department', 'program', 'batch', 'semester', 'section'],
    })
    .exec()

  const students = (enrollments.map((enrollment) => enrollment.student) as unknown[])
    .filter(isPopulatedAcademicStudent)
    .map((student) => serializeAcademicStudent(student))

  return {
    offering: await serializeCourseOffering(offering),
    students,
  }
}
