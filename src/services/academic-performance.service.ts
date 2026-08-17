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
import { EnrollmentModel } from '../models/enrollment.model.js'
import type { UserRole } from '../models/user.model.js'
import { UserModel, type StudentAcademicStatus, type UserDocument } from '../models/user.model.js'
import { serializeCourseOffering, type SerializedCourseOffering } from './course.service.js'
import { listSections, type SerializedSection } from './section.service.js'
import { listSemesters, type SerializedSemester } from './semester.service.js'
import { ApiError } from '../utils/api-error.js'
import { notifyAttendanceUpdated } from './notification.service.js'
import type {
  AttendanceConfigurationPayload,
  AttendanceSessionPayload,
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
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
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
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
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
    }).exec(),
    getAttendanceConfiguration(),
  ])
  const serializedStudent = serializeAcademicStudent(studentRecord)
  const serializedOfferings = await Promise.all(
    offerings.map((offering) => serializeCourseOffering(offering))
  )

  return serializedOfferings.map((offering) =>
    summarizeAttendanceRecords(
      offering,
      serializedStudent,
      sessions.filter((session) => objectIdEquals(session.courseOffering, offering.id)),
      configuration.minimumAttendancePercentage
    )
  )
}

export async function listLowAttendanceStudents(user: UserDocument): Promise<AttendanceShortage[]> {
  if (user.role !== 'hod' && user.role !== 'admin') {
    throw new ApiError(403, 'HOD attendance access required')
  }

  const offerings = await listAcademicPerformanceOfferings(user)
  const [sessions, configuration] = await Promise.all([
    AttendanceSessionModel.find({
      courseOffering: { $in: offerings.map((offering) => offering.id) },
    }).exec(),
    getAttendanceConfiguration(),
  ])

  const shortageGroups = await Promise.all(
    offerings.map(async (offering) => {
      const { students } = await listAcademicPerformanceOfferingStudents(user, offering.id)
      const offeringSessions = sessions.filter((session) =>
        objectIdEquals(session.courseOffering, offering.id)
      )

      return students.map((student) => ({
        student,
        ...summarizeAttendanceRecords(
          offering,
          student,
          offeringSessions,
          configuration.minimumAttendancePercentage
        ),
      }))
    })
  )

  return shortageGroups
    .flat()
    .filter((summary) => summary.isBelowThreshold)
    .sort((left, right) => left.attendancePercentage - right.attendancePercentage)
}
