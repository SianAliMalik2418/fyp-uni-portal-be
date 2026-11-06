import { isValidObjectId, Types } from 'mongoose'
import {
  AttendanceSessionModel,
  type AttendanceSessionDocument,
  type AttendanceStatus,
} from '../models/attendance-session.model.js'
import {
  ATTENDANCE_CONFIGURATION_KEY,
  AttendanceConfigurationModel,
} from '../models/attendance-configuration.model.js'
import {
  CourseOfferingModel,
  type CourseOfferingDocument,
} from '../models/course-offering.model.js'
import { CourseModel } from '../models/course.model.js'
import { EnrollmentModel } from '../models/enrollment.model.js'
import { ResultModel } from '../models/result.model.js'
import { SectionModel } from '../models/section.model.js'
import type { UserRole } from '../models/user.model.js'
import { UserModel, type StudentAcademicStatus, type UserDocument } from '../models/user.model.js'
import {
  serializeCourseOfferings,
  serializeCourseOffering,
  type SerializedCourseOffering,
} from './course.service.js'
import { listSections, type SerializedSection } from './section.service.js'
import { listSemesters, type SerializedSemester } from './semester.service.js'
import { ApiError } from '../utils/api-error.js'
import { notifyAttendanceUpdated } from './notification.service.js'
import type {
  AcademicPerformanceOfferingsQuery,
  AttendanceConfigurationPayload,
  AttendanceSessionPayload,
  AttendanceShortagesQuery,
} from '../validators/academic-performance.validator.js'

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

export type SerializedAttendanceRecord = {
  student: AcademicPerformanceStudent
  status: AttendanceStatus
}

export type SerializedAttendanceSession = {
  id: string
  offering: SerializedCourseOffering
  date: string
  records: SerializedAttendanceRecord[]
  studentCount: number
  createdAt?: Date
  updatedAt?: Date
}

export type AttendanceCourseSummary = {
  offering: SerializedCourseOffering
  totalClasses: number
  present: number
  absent: number
  leave: number
  attendancePercentage: number
  requiredPercentage: number
  isBelowThreshold: boolean
}

export type AttendanceShortage = AttendanceCourseSummary & {
  student: AcademicPerformanceStudent
}

export type SerializedAttendanceConfiguration = {
  minimumAttendancePercentage: number
  updatedAt?: Date
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

const DEFAULT_REQUIRED_ATTENDANCE_PERCENTAGE = 75

export async function getAttendanceConfiguration(): Promise<SerializedAttendanceConfiguration> {
  const configuration = await AttendanceConfigurationModel.findOne({
    key: ATTENDANCE_CONFIGURATION_KEY,
  }).exec()

  return {
    minimumAttendancePercentage:
      configuration?.minimumAttendancePercentage ?? DEFAULT_REQUIRED_ATTENDANCE_PERCENTAGE,
    updatedAt: configuration?.updatedAt,
  }
}

export async function updateAttendanceConfiguration(
  payload: AttendanceConfigurationPayload
): Promise<SerializedAttendanceConfiguration> {
  const configuration = await AttendanceConfigurationModel.findOneAndUpdate(
    { key: ATTENDANCE_CONFIGURATION_KEY },
    {
      $set: { minimumAttendancePercentage: payload.minimumAttendancePercentage },
      $setOnInsert: { key: ATTENDANCE_CONFIGURATION_KEY },
    },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).exec()

  return {
    minimumAttendancePercentage: configuration!.minimumAttendancePercentage,
    updatedAt: configuration!.updatedAt,
  }
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

function objectIdEquals(left: unknown, right: unknown) {
  const leftId = relationId(left)
  const rightId = relationId(right)

  return Boolean(leftId && rightId && leftId === rightId)
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

function isPopulatedCourseOffering(value: unknown): value is CourseOfferingDocument {
  return Boolean(value && typeof value === 'object' && 'course' in value && 'section' in value)
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

function normalizeAttendanceDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, 'Invalid attendance date')
  }

  return {
    date,
    dateKey: date.toISOString().slice(0, 10),
  }
}

async function populateAttendanceSession(session: AttendanceSessionDocument) {
  await session.populate([
    {
      path: 'courseOffering',
      populate: [
        { path: 'course', populate: ['department', 'program', 'semester'] },
        { path: 'section', populate: ['program', 'semester'] },
        { path: 'teacher', populate: ['department'] },
      ],
    },
    {
      path: 'records.student',
      select:
        'fullName registrationNumber department program batch semester section academicStatus isActive',
      populate: ['department', 'program', 'batch', 'semester', 'section'],
    },
  ])

  return session
}

async function serializeAttendanceSession(
  session: AttendanceSessionDocument
): Promise<SerializedAttendanceSession> {
  if (!isPopulatedCourseOffering(session.courseOffering)) {
    throw new ApiError(500, 'Attendance course offering was not loaded')
  }

  const records = session.records.map((record) => {
    if (!isPopulatedAcademicStudent(record.student)) {
      throw new ApiError(500, 'Attendance student records were not loaded')
    }

    return {
      student: serializeAcademicStudent(record.student),
      status: record.status,
    }
  })

  return {
    id: session.id,
    offering: await serializeCourseOffering(session.courseOffering),
    date: session.dateKey,
    records,
    studentCount: records.length,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  }
}

async function listActiveEnrollmentStudents(offeringId: Types.ObjectId | string) {
  const enrollments = await EnrollmentModel.find({ courseOffering: offeringId, isActive: true })
    .populate({
      path: 'student',
      select:
        'fullName registrationNumber department program batch semester section academicStatus isActive',
      populate: ['department', 'program', 'batch', 'semester', 'section'],
    })
    .exec()

  return (enrollments.map((enrollment) => enrollment.student) as unknown[]).filter(
    isPopulatedAcademicStudent
  )
}

async function assertAttendanceRecordsMatchEnrollment(
  offeringId: Types.ObjectId | string,
  records: AttendanceSessionPayload['records']
) {
  const enrolledStudents = await listActiveEnrollmentStudents(offeringId)
  const enrolledStudentIds = new Set(enrolledStudents.map((student) => student.id))
  const submittedStudentIds = new Set(records.map((record) => record.studentId))

  if (submittedStudentIds.size !== records.length) {
    throw new ApiError(400, 'Attendance records cannot include duplicate students')
  }

  for (const record of records) {
    ensureValidObjectId(record.studentId, 'student')

    if (!enrolledStudentIds.has(record.studentId)) {
      throw new ApiError(400, 'Attendance can only be saved for enrolled students')
    }
  }

  if (submittedStudentIds.size !== enrolledStudentIds.size) {
    throw new ApiError(400, 'Attendance must include every enrolled student')
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

const relationSearchLimit = 500

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function findCourseIds(user: UserDocument, query: AcademicPerformanceOfferingsQuery) {
  const departmentId = user.role === 'hod' ? user.department?.toString() : query.departmentId
  const shouldFilter = Boolean(departmentId || query.programId || query.semesterId || query.search)
  if (!shouldFilter) return null

  const filter: Record<string, unknown> = { isActive: true }
  if (departmentId) filter.department = departmentId
  if (query.programId) filter.program = query.programId
  if (query.semesterId) filter.semester = query.semesterId
  if (query.search) {
    const search = new RegExp(escapeRegExp(query.search), 'i')
    filter.$or = [{ code: search }, { title: search }]
  }

  const courses = await CourseModel.find(filter)
    .select('_id')
    .limit(relationSearchLimit)
    .lean()
    .exec()
  return courses.map((course) => course._id)
}

async function findSectionIds(query: AcademicPerformanceOfferingsQuery) {
  const shouldFilter = Boolean(
    query.sectionId || query.programId || query.batchId || query.semesterId
  )
  if (!shouldFilter) return null

  const filter: Record<string, unknown> = { isActive: true }
  if (query.sectionId) filter._id = query.sectionId
  if (query.programId) filter.program = query.programId
  if (query.batchId) filter.batch = query.batchId
  if (query.semesterId) filter.semester = query.semesterId

  const sections = await SectionModel.find(filter)
    .select('_id')
    .limit(relationSearchLimit)
    .lean()
    .exec()
  return sections.map((section) => section._id)
}

async function findResultOfferingIds(status: AcademicPerformanceOfferingsQuery['resultStatus']) {
  if (!status) return null

  const results = await ResultModel.find({ status })
    .select('courseOffering')
    .limit(relationSearchLimit)
    .lean()
    .exec()
  return results.map((result) => result.courseOffering)
}

async function findStudentOfferingIds(user: UserDocument) {
  if (user.role !== 'student') return null

  const enrollments = await EnrollmentModel.find({ student: user._id, isActive: true })
    .select('courseOffering')
    .limit(relationSearchLimit)
    .lean()
    .exec()
  return enrollments.map((enrollment) => enrollment.courseOffering)
}

export async function listAcademicPerformanceOfferings(
  user: UserDocument,
  query: AcademicPerformanceOfferingsQuery = { limit: 50 }
) {
  if (user.role === 'hod' && !user.department) {
    throw new ApiError(403, 'HOD department assignment required')
  }

  const [courseIds, sectionIds, resultOfferingIds, studentOfferingIds] = await Promise.all([
    findCourseIds(user, query),
    findSectionIds(query),
    findResultOfferingIds(query.resultStatus),
    findStudentOfferingIds(user),
  ])
  const filter: Record<string, unknown> = { isActive: true }
  if (user.role === 'teacher') filter.teacher = user._id
  if (courseIds) filter.course = { $in: courseIds }
  if (sectionIds) filter.section = { $in: sectionIds }
  if (resultOfferingIds) filter._id = { $in: resultOfferingIds }
  if (studentOfferingIds) filter._id = { $in: studentOfferingIds }

  const offerings = await CourseOfferingModel.find(filter)
    .sort({ createdAt: 1 })
    .limit(query.limit)
    .populate({ path: 'course', populate: ['department', 'program', 'semester'] })
    .populate({ path: 'section', populate: ['program', 'semester'] })
    .populate({ path: 'teacher', populate: ['department'] })
    .exec()

  return serializeCourseOfferings(offerings)
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

export async function saveAttendanceSession(
  teacher: UserDocument,
  payload: AttendanceSessionPayload
) {
  if (teacher.role !== 'teacher') {
    throw new ApiError(403, 'Teacher attendance access required')
  }

  const offering = await assertCanAccessCourseOffering(teacher, payload.offeringId)
  await assertAttendanceRecordsMatchEnrollment(offering._id, payload.records)

  const { date, dateKey } = normalizeAttendanceDate(payload.date)
  const records = payload.records.map((record) => ({
    student: new Types.ObjectId(record.studentId),
    status: record.status,
  }))

  const session = await AttendanceSessionModel.findOneAndUpdate(
    { courseOffering: offering._id, dateKey },
    {
      $set: {
        courseOffering: offering._id,
        section: offering.section,
        teacher: teacher._id,
        date,
        dateKey,
        records,
      },
    },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).exec()

  await notifyAttendanceUpdated(session!)
  return serializeAttendanceSession(await populateAttendanceSession(session!))
}

export async function updateAttendanceSession(
  teacher: UserDocument,
  sessionId: string,
  payload: AttendanceSessionPayload
) {
  if (teacher.role !== 'teacher') {
    throw new ApiError(403, 'Teacher attendance access required')
  }

  ensureValidObjectId(sessionId, 'attendance session')
  const existingSession = await AttendanceSessionModel.findById(sessionId).exec()

  if (!existingSession) {
    throw new ApiError(404, 'Attendance session not found')
  }

  if (!objectIdEquals(existingSession.teacher, teacher._id)) {
    throw new ApiError(403, 'Teacher can only edit assigned attendance sessions')
  }

  if (!objectIdEquals(existingSession.courseOffering, payload.offeringId)) {
    throw new ApiError(400, 'Attendance session course offering cannot be changed')
  }

  await assertAttendanceRecordsMatchEnrollment(existingSession.courseOffering, payload.records)

  const { date, dateKey } = normalizeAttendanceDate(payload.date)
  existingSession.date = date
  existingSession.dateKey = dateKey
  existingSession.records = payload.records.map((record) => ({
    student: new Types.ObjectId(record.studentId),
    status: record.status,
  }))

  await existingSession.save()
  await notifyAttendanceUpdated(existingSession)

  return serializeAttendanceSession(await populateAttendanceSession(existingSession))
}

export async function listAttendanceHistory(user: UserDocument, offeringId?: string) {
  if (user.role === 'student') {
    throw new ApiError(403, 'Student attendance history is available through course summaries')
  }

  const offerings = await listAcademicPerformanceOfferings(user)
  const offeringIds = new Set(offerings.map((offering) => offering.id))

  if (offeringId) {
    ensureValidObjectId(offeringId, 'course offering')

    if (!offeringIds.has(offeringId)) {
      throw new ApiError(403, 'Unauthorized course offering access')
    }
  }

  const sessions = await AttendanceSessionModel.find({
    courseOffering: offeringId ?? { $in: [...offeringIds] },
  })
    .sort({ dateKey: -1, createdAt: -1 })
    .populate({
      path: 'courseOffering',
      populate: [
        { path: 'course', populate: ['department', 'program', 'semester'] },
        { path: 'section', populate: ['program', 'semester'] },
        { path: 'teacher', populate: ['department'] },
      ],
    })
    .populate({
      path: 'records.student',
      select:
        'fullName registrationNumber department program batch semester section academicStatus isActive',
      populate: ['department', 'program', 'batch', 'semester', 'section'],
    })
    .exec()

  return Promise.all(
    sessions.map((session) => serializeAttendanceSession(session as AttendanceSessionDocument))
  )
}

export async function getAttendanceSession(user: UserDocument, sessionId: string) {
  ensureValidObjectId(sessionId, 'attendance session')
  const session = await AttendanceSessionModel.findById(sessionId).exec()

  if (!session) {
    throw new ApiError(404, 'Attendance session not found')
  }

  await assertCanAccessCourseOffering(user, session.courseOffering.toString())

  return serializeAttendanceSession(await populateAttendanceSession(session))
}

function attendancePercentage(present: number, totalClasses: number) {
  if (totalClasses === 0) {
    return 0
  }

  return Math.round((present / totalClasses) * 10000) / 100
}

function summarizeAttendanceRecords(
  offering: SerializedCourseOffering,
  student: AcademicPerformanceStudent,
  sessions: AttendanceSessionDocument[],
  requiredPercentage: number
): AttendanceCourseSummary {
  const totals = {
    present: 0,
    absent: 0,
    leave: 0,
  }

  for (const session of sessions) {
    const record = session.records.find((item) => objectIdEquals(item.student, student.id))

    if (record) {
      totals[record.status] += 1
    }
  }

  return attendanceSummary(offering, totals, requiredPercentage)
}

type AttendanceTotals = { present: number; absent: number; leave: number }

function attendanceSummary(
  offering: SerializedCourseOffering,
  totals: AttendanceTotals,
  requiredPercentage: number
): AttendanceCourseSummary {
  const totalClasses = totals.present + totals.absent + totals.leave
  const percentage = attendancePercentage(totals.present, totalClasses)

  return {
    offering,
    totalClasses,
    present: totals.present,
    absent: totals.absent,
    leave: totals.leave,
    attendancePercentage: percentage,
    requiredPercentage,
    isBelowThreshold: totalClasses > 0 && percentage < requiredPercentage,
  }
}

export async function getStudentAttendanceSummaries(
  student: UserDocument
): Promise<AttendanceCourseSummary[]> {
  if (student.role !== 'student') {
    throw new ApiError(403, 'Student attendance access required')
  }

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
    .populate({
      path: 'student',
      select:
        'fullName registrationNumber department program batch semester section academicStatus isActive',
      populate: ['department', 'program', 'batch', 'semester', 'section'],
    })
    .exec()

  const studentRecord = (enrollments.map((enrollment) => enrollment.student) as unknown[]).find(
    isPopulatedAcademicStudent
  )

  if (!studentRecord) {
    return []
  }

  const offerings = (
    enrollments.map((enrollment) => enrollment.courseOffering) as unknown[]
  ).filter(isPopulatedCourseOffering)

  const [sessions, configuration] = await Promise.all([
    AttendanceSessionModel.find({
      courseOffering: { $in: offerings.map((offering) => offering._id) },
    })
      .select({ courseOffering: 1, records: { $elemMatch: { student: student._id } } })
      .exec(),
    getAttendanceConfiguration(),
  ])
  const serializedStudent = serializeAcademicStudent(studentRecord)
  const serializedOfferings = await serializeCourseOfferings(offerings)

  return serializedOfferings.map((offering) =>
    summarizeAttendanceRecords(
      offering,
      serializedStudent,
      sessions.filter((session) => objectIdEquals(session.courseOffering, offering.id)),
      configuration.minimumAttendancePercentage
    )
  )
}

export async function listLowAttendanceStudents(
  user: UserDocument,
  query: AttendanceShortagesQuery = { page: 1, limit: 20 }
) {
  if (user.role !== 'hod' && user.role !== 'admin') {
    throw new ApiError(403, 'HOD attendance access required')
  }

  const offerings = await listAcademicPerformanceOfferings(user, {
    search: query.search,
    departmentId: query.departmentId,
    programId: query.programId,
    batchId: query.batchId,
    semesterId: query.semesterId,
    sectionId: query.sectionId,
    limit: 50,
  })
  const [sessions, configuration] = await Promise.all([
    AttendanceSessionModel.find({
      courseOffering: { $in: offerings.map((offering) => offering.id) },
    }).exec(),
    getAttendanceConfiguration(),
  ])

  const enrollments = await EnrollmentModel.find({
    courseOffering: { $in: offerings.map((offering) => offering.id) },
    isActive: true,
  })
    .populate({
      path: 'student',
      select:
        'fullName registrationNumber department program batch semester section academicStatus isActive',
      populate: ['department', 'program', 'batch', 'semester', 'section'],
    })
    .exec()
  const studentsByOffering = new Map<string, AcademicPerformanceStudent[]>()
  for (const enrollment of enrollments) {
    if (!isPopulatedAcademicStudent(enrollment.student)) continue
    const id = enrollment.courseOffering.toString()
    const students = studentsByOffering.get(id) ?? []
    students.push(serializeAcademicStudent(enrollment.student))
    studentsByOffering.set(id, students)
  }
  const totalsByOffering = new Map<string, Map<string, AttendanceTotals>>()
  for (const session of sessions) {
    const offeringId = session.courseOffering.toString()
    const totalsByStudent = totalsByOffering.get(offeringId) ?? new Map<string, AttendanceTotals>()
    const seen = new Set<string>()
    for (const record of session.records) {
      const studentId = relationId(record.student)
      if (!studentId || seen.has(studentId)) continue
      seen.add(studentId)
      const totals = totalsByStudent.get(studentId) ?? { present: 0, absent: 0, leave: 0 }
      totals[record.status] += 1
      totalsByStudent.set(studentId, totals)
    }
    totalsByOffering.set(offeringId, totalsByStudent)
  }
  const shortageGroups = offerings.map((offering) =>
    (studentsByOffering.get(offering.id) ?? []).map((student) => ({
      student,
      ...attendanceSummary(
        offering,
        totalsByOffering.get(offering.id)?.get(student.id) ?? { present: 0, absent: 0, leave: 0 },
        configuration.minimumAttendancePercentage
      ),
    }))
  )

  const shortages = shortageGroups
    .flat()
    .filter((summary) => summary.isBelowThreshold)
    .sort((left, right) => left.attendancePercentage - right.attendancePercentage)

  return pageAttendanceShortages(shortages, query)
}

export function pageAttendanceShortages(
  shortages: AttendanceShortage[],
  query: Pick<AttendanceShortagesQuery, 'studentSearch' | 'page' | 'limit'>
) {
  const search = query.studentSearch?.toLowerCase()
  const filtered = search
    ? shortages.filter((shortage) =>
        [shortage.student.name, shortage.student.registrationNumber].some((value) =>
          value.toLowerCase().includes(search)
        )
      )
    : shortages
  const total = filtered.length
  const start = (query.page - 1) * query.limit

  return {
    shortages: filtered.slice(start, start + query.limit),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  }
}
