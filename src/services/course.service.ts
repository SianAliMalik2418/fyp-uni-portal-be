import { isValidObjectId, type Types } from 'mongoose'
import {
  CourseOfferingModel,
  type CourseOfferingDocument,
} from '../models/course-offering.model.js'
import { CourseModel, type CourseDocument } from '../models/course.model.js'
import { DepartmentModel, type DepartmentDocument } from '../models/department.model.js'
import { EnrollmentModel } from '../models/enrollment.model.js'
import { ProgramModel, type ProgramDocument } from '../models/program.model.js'
import { SectionModel, type SectionDocument } from '../models/section.model.js'
import { SemesterModel, type SemesterDocument } from '../models/semester.model.js'
import { UserModel, type UserDocument } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'
import type {
  CreateCoursePayload,
  SectionCourseAssignmentPayload,
  TeacherAssignmentPayload,
  UpdateCoursePayload,
} from '../validators/course.validator.js'

type SerializedRelationship = { id: string; name: string; code?: string; isActive: boolean }

export interface SerializedCourse {
  id: string
  code: string
  title: string
  creditHours: number
  department: Required<Pick<SerializedRelationship, 'id' | 'name' | 'code' | 'isActive'>>
  program: Required<Pick<SerializedRelationship, 'id' | 'name' | 'code' | 'isActive'>>
  semester: {
    id: string
    name: string
    academicYear: string
    isActive: boolean
    isClosed: boolean
  }
  description?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface SerializedCourseOffering {
  id: string
  course: SerializedCourse
  section: {
    id: string
    name: string
    program: Required<Pick<SerializedRelationship, 'id' | 'name' | 'code' | 'isActive'>>
    semester: SerializedCourse['semester']
    isActive: boolean
  }
  teacher?: {
    id: string
    fullName: string
    email: string
    employeeId?: string
    department?: Required<Pick<SerializedRelationship, 'id' | 'name' | 'code' | 'isActive'>>
  }
  studentCount: number
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface SerializedAssignableTeacher {
  id: string
  fullName: string
  email: string
  employeeId?: string
  department?: Required<Pick<SerializedRelationship, 'id' | 'name' | 'code' | 'isActive'>>
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

function optionalString(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined
}

function ensureValidObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} ID`)
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isPopulatedDepartment(
  value: Types.ObjectId | DepartmentDocument | undefined
): value is DepartmentDocument {
  return Boolean(value && typeof value === 'object' && 'code' in value && 'name' in value)
}

function isPopulatedProgram(
  value: Types.ObjectId | ProgramDocument | undefined
): value is ProgramDocument {
  return Boolean(value && typeof value === 'object' && 'code' in value && 'totalSemesters' in value)
}

function isPopulatedSemester(
  value: Types.ObjectId | SemesterDocument | undefined
): value is SemesterDocument {
  return Boolean(value && typeof value === 'object' && 'academicYear' in value)
}

function isPopulatedCourse(value: Types.ObjectId | CourseDocument): value is CourseDocument {
  return typeof value === 'object' && 'creditHours' in value
}

function isPopulatedSection(value: Types.ObjectId | SectionDocument): value is SectionDocument {
  return typeof value === 'object' && 'batch' in value && 'program' in value
}

function isPopulatedTeacher(
  value: Types.ObjectId | UserDocument | undefined
): value is UserDocument {
  return Boolean(value && typeof value === 'object' && 'fullName' in value && 'role' in value)
}

function departmentSummary(department: DepartmentDocument) {
  return {
    id: department.id,
    name: department.name,
    code: department.code,
    isActive: department.isActive,
  }
}

function programSummary(program: ProgramDocument) {
  return {
    id: program.id,
    name: program.name,
    code: program.code,
    isActive: program.isActive,
  }
}

function semesterSummary(semester: SemesterDocument) {
  return {
    id: semester.id,
    name: semester.name,
    academicYear: semester.academicYear,
    isActive: semester.isActive,
    isClosed: semester.isClosed,
  }
}

export function serializeCourse(course: CourseDocument): SerializedCourse {
  if (
    !isPopulatedDepartment(course.department) ||
    !isPopulatedProgram(course.program) ||
    !isPopulatedSemester(course.semester)
  ) {
    throw new ApiError(500, 'Course relationships were not loaded')
  }

  return {
    id: course.id,
    code: course.code,
    title: course.title,
    creditHours: course.creditHours,
    department: departmentSummary(course.department),
    program: programSummary(course.program),
    semester: semesterSummary(course.semester),
    description: course.description,
    isActive: course.isActive,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  }
}

function serializeTeacher(teacher: UserDocument) {
  return {
    id: teacher.id,
    fullName: teacher.fullName,
    email: teacher.email,
    employeeId: teacher.employeeId,
    department: isPopulatedDepartment(teacher.department)
      ? departmentSummary(teacher.department)
      : undefined,
  }
}

function serializeAssignableTeacher(teacher: UserDocument): SerializedAssignableTeacher {
  return serializeTeacher(teacher)
}

async function studentCountForOffering(offeringId: string) {
  return EnrollmentModel.countDocuments({ courseOffering: offeringId, isActive: true }).exec()
}

export async function serializeCourseOffering(
  offering: CourseOfferingDocument
): Promise<SerializedCourseOffering> {
  if (!isPopulatedCourse(offering.course) || !isPopulatedSection(offering.section)) {
    throw new ApiError(500, 'Course offering relationships were not loaded')
  }

  const course = serializeCourse(offering.course)
  const section = offering.section

  if (!isPopulatedProgram(section.program) || !isPopulatedSemester(section.semester)) {
    throw new ApiError(500, 'Section relationships were not loaded')
  }

  return {
    id: offering.id,
    course,
    section: {
      id: section.id,
      name: section.name,
      program: programSummary(section.program),
      semester: semesterSummary(section.semester),
      isActive: section.isActive,
    },
    teacher: isPopulatedTeacher(offering.teacher) ? serializeTeacher(offering.teacher) : undefined,
    studentCount: await studentCountForOffering(offering.id),
    isActive: offering.isActive,
    createdAt: offering.createdAt,
    updatedAt: offering.updatedAt,
  }
}

async function populateCourse(course: CourseDocument) {
  await course.populate(['department', 'program', 'semester'])
  return course
}

async function populateOffering(offering: CourseOfferingDocument) {
  await offering.populate([
    { path: 'course', populate: ['department', 'program', 'semester'] },
    { path: 'section', populate: ['program', 'semester'] },
    { path: 'teacher', populate: ['department'] },
  ])
  return offering
}

async function resolveDepartment(departmentId: string) {
  ensureValidObjectId(departmentId, 'department')
  const department = await DepartmentModel.findById(departmentId).exec()

  if (!department) {
    throw new ApiError(400, 'Department not found')
  }

  return department
}

async function resolveProgram(programId: string, departmentId: string) {
  ensureValidObjectId(programId, 'program')
  const program = await ProgramModel.findById(programId).exec()

  if (!program) {
    throw new ApiError(400, 'Program not found')
  }

  if (program.department.toString() !== departmentId) {
    throw new ApiError(400, 'Program does not belong to the selected department')
  }

  return program
}

async function resolveSemester(semesterId: string) {
  ensureValidObjectId(semesterId, 'semester')
  const semester = await SemesterModel.findById(semesterId).exec()

  if (!semester) {
    throw new ApiError(400, 'Semester not found')
  }

  return semester
}

async function resolveSection(sectionId: string) {
  ensureValidObjectId(sectionId, 'section')
  const section = await SectionModel.findById(sectionId).exec()

  if (!section) {
    throw new ApiError(400, 'Section not found')
  }

  return section
}

async function findCourseById(courseId: string) {
  ensureValidObjectId(courseId, 'course')
  const course = await CourseModel.findById(courseId).exec()

  if (!course) {
    throw new ApiError(404, 'Course not found')
  }

  return course
}

async function findOfferingById(offeringId: string) {
  ensureValidObjectId(offeringId, 'course offering')
  const offering = await CourseOfferingModel.findById(offeringId).exec()

  if (!offering) {
    throw new ApiError(404, 'Course offering not found')
  }

  return offering
}

async function assertCourseIsUnique(
  payload: Pick<CreateCoursePayload, 'code' | 'title' | 'programId' | 'semesterId'>,
  currentCourseId?: string
) {
  const duplicate = await CourseModel.findOne({
    ...(currentCourseId ? { _id: { $ne: currentCourseId } } : {}),
    $or: [
      { code: normalizeCode(payload.code) },
      {
        program: payload.programId,
        semester: payload.semesterId,
        title: new RegExp(`^${escapeRegExp(payload.title.trim())}$`, 'i'),
      },
    ],
  })
    .select('_id code')
    .exec()

  if (!duplicate) {
    return
  }

  if (duplicate.code === normalizeCode(payload.code)) {
    throw new ApiError(409, 'A course with this code already exists')
  }

  throw new ApiError(409, 'A course with this title already exists for this program semester')
}

async function assignActiveStudentsToOfferings(sectionId: string, offeringIds: Types.ObjectId[]) {
  const activeStudents = await UserModel.find({
    role: 'student',
    isActive: true,
    academicStatus: 'active',
    section: sectionId,
  })
    .select('_id')
    .exec()

  await Promise.all(
    offeringIds.flatMap((offeringId) =>
      activeStudents.map((student) =>
        EnrollmentModel.updateOne(
          { student: student._id, courseOffering: offeringId },
          {
            $set: {
              section: sectionId,
              isActive: true,
            },
          },
          { upsert: true }
        ).exec()
      )
    )
  )
}

export async function syncStudentEnrollments(userId: string) {
  ensureValidObjectId(userId, 'user')
  const student = await UserModel.findById(userId).select('-passwordHash').exec()

  if (
    !student ||
    student.role !== 'student' ||
    !student.isActive ||
    student.academicStatus !== 'active' ||
    !student.section
  ) {
    return
  }

  const offerings = await CourseOfferingModel.find({
    section: student.section,
    isActive: true,
  })
    .select('_id')
    .exec()

  await Promise.all(
    offerings.map((offering) =>
      EnrollmentModel.updateOne(
        { student: student._id, courseOffering: offering._id },
        {
          $set: {
            section: student.section,
            isActive: true,
          },
        },
        { upsert: true }
      ).exec()
    )
  )
}

export async function listCourses(user?: UserDocument) {
  const query =
    user?.role === 'hod' && user.department ? { department: user.department.toString() } : {}
  const courses = await CourseModel.find(query)
    .sort({ code: 1 })
    .populate<{ department: DepartmentDocument }>('department')
    .populate<{ program: ProgramDocument }>('program')
    .populate<{ semester: SemesterDocument }>('semester')
    .exec()

  return courses.map((course) => serializeCourse(course as unknown as CourseDocument))
}

export async function listAssignableTeachers(user: UserDocument) {
  const query: { role: 'teacher'; isActive: boolean; department?: Types.ObjectId } = {
    role: 'teacher',
    isActive: true,
  }

  if (user.role === 'hod' && user.department) {
    query.department = user.department
  }

  const teachers = await UserModel.find(query)
    .sort({ fullName: 1 })
    .select('-passwordHash')
    .populate<{ department: DepartmentDocument }>('department')
    .exec()

  return teachers.map((teacher) => serializeAssignableTeacher(teacher as unknown as UserDocument))
}

export async function createCourse(payload: CreateCoursePayload) {
  const department = await resolveDepartment(payload.departmentId)
  const program = await resolveProgram(payload.programId, department.id)
  const semester = await resolveSemester(payload.semesterId)

  await assertCourseIsUnique({
    code: payload.code,
    title: payload.title,
    programId: program.id,
    semesterId: semester.id,
  })

  const course = await CourseModel.create({
    code: normalizeCode(payload.code),
    title: payload.title.trim(),
    creditHours: payload.creditHours,
    department: department._id,
    program: program._id,
    semester: semester._id,
    description: optionalString(payload.description),
    isActive: payload.isActive,
  })

  return serializeCourse(await populateCourse(course))
}

export async function updateCourse(courseId: string, payload: UpdateCoursePayload) {
  const course = await findCourseById(courseId)
  const nextDepartmentId = payload.departmentId ?? course.department.toString()
  const nextProgramId = payload.programId ?? course.program.toString()
  const nextSemesterId = payload.semesterId ?? course.semester.toString()
  const nextCode = payload.code ? normalizeCode(payload.code) : course.code
  const nextTitle = payload.title?.trim() ?? course.title
  const relationshipChanged = Boolean(
    payload.departmentId || payload.programId || payload.semesterId
  )
  const department = relationshipChanged ? await resolveDepartment(nextDepartmentId) : null
  const program = relationshipChanged ? await resolveProgram(nextProgramId, nextDepartmentId) : null
  const semester = relationshipChanged ? await resolveSemester(nextSemesterId) : null

  if (payload.code || payload.title || payload.programId || payload.semesterId) {
    await assertCourseIsUnique(
      {
        code: nextCode,
        title: nextTitle,
        programId: nextProgramId,
        semesterId: nextSemesterId,
      },
      courseId
    )
  }

  course.code = nextCode
  course.title = nextTitle

  if (payload.creditHours !== undefined) {
    course.creditHours = payload.creditHours
  }

  if (department) {
    course.department = department._id
  }

  if (program) {
    course.program = program._id
  }

  if (semester) {
    course.semester = semester._id
  }

  if (payload.description !== undefined) {
    course.description = optionalString(payload.description)
  }

  if (payload.isActive !== undefined) {
    course.isActive = payload.isActive
  }

  await course.save()

  return serializeCourse(await populateCourse(course))
}

export async function deleteCourse(courseId: string) {
  ensureValidObjectId(courseId, 'course')
  const offerings = await CourseOfferingModel.find({ course: courseId }).select('_id').exec()
  await EnrollmentModel.deleteMany({
    courseOffering: { $in: offerings.map((offering) => offering._id) },
  }).exec()
  await CourseOfferingModel.deleteMany({ course: courseId }).exec()
  const course = await CourseModel.findByIdAndDelete(courseId).exec()

  if (!course) {
    throw new ApiError(404, 'Course not found')
  }
}

function assertCourseMatchesSection(course: CourseDocument, section: SectionDocument) {
  if (course.program.toString() !== section.program.toString()) {
    throw new ApiError(400, 'Course does not belong to the selected section program')
  }

  if (course.semester.toString() !== section.semester.toString()) {
    throw new ApiError(400, 'Course does not belong to the selected section semester')
  }
}

export async function assignCoursesToSection(
  sectionId: string,
  payload: SectionCourseAssignmentPayload
) {
  const section = await resolveSection(sectionId)
  const uniqueCourseIds = [...new Set(payload.courseIds)]

  const courses = await CourseModel.find({ _id: { $in: uniqueCourseIds } }).exec()

  if (courses.length !== uniqueCourseIds.length) {
    throw new ApiError(400, 'One or more courses were not found')
  }

  courses.forEach((course) => assertCourseMatchesSection(course, section))

  const existingOfferings = await CourseOfferingModel.find({ section: section._id }).exec()
  const nextCourseIds = new Set(uniqueCourseIds)
  const offeringIdsToEnroll: Types.ObjectId[] = []

  await Promise.all(
    existingOfferings.map(async (offering) => {
      const shouldRemainAssigned = nextCourseIds.has(offering.course.toString())
      offering.isActive = shouldRemainAssigned
      await offering.save()

      if (shouldRemainAssigned) {
        offeringIdsToEnroll.push(offering._id)
      } else {
        await EnrollmentModel.updateMany(
          { courseOffering: offering._id },
          { $set: { isActive: false } }
        ).exec()
      }
    })
  )

  const existingCourseIds = new Set(existingOfferings.map((offering) => offering.course.toString()))
  const createdOfferings = await Promise.all(
    uniqueCourseIds
      .filter((courseId) => !existingCourseIds.has(courseId))
      .map((courseId) =>
        CourseOfferingModel.create({ course: courseId, section: section._id, isActive: true })
      )
  )

  offeringIdsToEnroll.push(...createdOfferings.map((offering) => offering._id))
  await assignActiveStudentsToOfferings(section.id, offeringIdsToEnroll)

  return getSectionCourseOfferings(section.id)
}

export async function getSectionCourseOfferings(sectionId: string, user?: UserDocument) {
  await resolveSection(sectionId)
  const offerings = await CourseOfferingModel.find({ section: sectionId, isActive: true })
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

  if (user?.role === 'hod' && user.department) {
    return serializedOfferings.filter(
      (offering) => offering.course.department.id === user.department!.toString()
    )
  }

  return serializedOfferings
}

export async function listCourseOfferings(user: UserDocument) {
  const courseFilter =
    user.role === 'hod' && user.department ? { department: user.department.toString() } : {}
  const courses = await CourseModel.find(courseFilter).select('_id').exec()
  const offerings = await CourseOfferingModel.find({
    isActive: true,
    ...(user.role === 'hod' ? { course: { $in: courses.map((course) => course._id) } } : {}),
  })
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

async function assertCanManageOfferingTeacher(
  offering: CourseOfferingDocument,
  user: UserDocument
) {
  if (user.role === 'admin') {
    return
  }

  if (user.role !== 'hod' || !user.department) {
    throw new ApiError(403, 'Insufficient role permissions')
  }

  await offering.populate({ path: 'course', populate: ['department'] })

  if (!isPopulatedCourse(offering.course)) {
    throw new ApiError(500, 'Course was not loaded')
  }

  if (offering.course.department.toString() !== user.department.toString()) {
    throw new ApiError(403, 'HOD can only assign teachers for their department courses')
  }
}

export async function assignTeacherToOffering(
  offeringId: string,
  payload: TeacherAssignmentPayload,
  user: UserDocument
) {
  const offering = await findOfferingById(offeringId)
  await assertCanManageOfferingTeacher(offering, user)

  if (payload.teacherId === null) {
    offering.teacher = undefined
  } else {
    ensureValidObjectId(payload.teacherId, 'teacher')
    const teacher = await UserModel.findOne({
      _id: payload.teacherId,
      role: 'teacher',
      isActive: true,
    })
      .select('-passwordHash')
      .exec()

    if (!teacher) {
      throw new ApiError(400, 'Teacher not found')
    }

    await offering.populate('course')

    if (!isPopulatedCourse(offering.course)) {
      throw new ApiError(500, 'Course was not loaded')
    }

    if (
      teacher.department &&
      offering.course.department.toString() !== teacher.department.toString()
    ) {
      throw new ApiError(400, 'Teacher does not belong to the course department')
    }

    offering.teacher = teacher._id
  }

  await offering.save()
  return serializeCourseOffering(await populateOffering(offering))
}

export async function listStudentCourses(student: UserDocument) {
  if (student.role !== 'student') {
    throw new ApiError(403, 'Student course access required')
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
    .exec()

  const offerings = enrollments
    .map((enrollment) => enrollment.courseOffering)
    .filter(Boolean) as unknown as CourseOfferingDocument[]

  return Promise.all(offerings.map((offering) => serializeCourseOffering(offering)))
}

export async function listTeacherCourseOfferings(teacher: UserDocument) {
  if (teacher.role !== 'teacher') {
    throw new ApiError(403, 'Teacher course access required')
  }

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
