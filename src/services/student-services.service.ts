import type { UserRole } from '../models/user.model.js'
import { UserModel, type UserDocument } from '../models/user.model.js'
import { listStudentCourses, type SerializedCourseOffering } from './course.service.js'
import { listSections, type SerializedSection } from './section.service.js'
import { listSemesters, type SerializedSemester } from './semester.service.js'

export type StudentServiceModule =
  'fees' | 'timetable' | 'exams' | 'announcements' | 'notifications' | 'ai-assistant'

export type StudentServiceContext = {
  currentSemester: SerializedSemester | null
  availableSections: SerializedSection[]
  student: StudentServiceStudentContext | null
  enrolledCourses: SerializedCourseOffering[]
  timetableScope: StudentServiceStructureScope
  examScope: StudentServiceStructureScope
  aiScope: StudentServiceStructureScope
}

export type StudentServiceRelation = {
  id: string
  name: string
  code?: string
  academicYear?: string
}

export type StudentServiceStudentContext = {
  userId: string
  name: string
  email: string
  registrationNumber: string | null
  program: StudentServiceRelation | null
  semester: StudentServiceRelation | null
  section: StudentServiceRelation | null
}

export type StudentServiceStructureScope = {
  canReferenceProgram: boolean
  canReferenceSemester: boolean
  canReferenceSection: boolean
}

const unresolvedScope: StudentServiceStructureScope = {
  canReferenceProgram: false,
  canReferenceSemester: false,
  canReferenceSection: false,
}

const allowedRoles: Record<StudentServiceModule, UserRole[]> = {
  fees: ['student', 'admin'],
  timetable: ['student', 'teacher', 'admin'],
  exams: ['student', 'teacher', 'admin'],
  announcements: ['student', 'teacher', 'hod', 'admin'],
  notifications: ['student', 'teacher', 'hod', 'admin'],
  'ai-assistant': ['student'],
}

export function getStudentServiceAllowedRoles(module: StudentServiceModule) {
  return allowedRoles[module]
}

function serializeRelation(value: unknown): StudentServiceRelation | null {
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

async function getLoggedInStudentContext(
  userId: string,
  role: UserRole
): Promise<StudentServiceStudentContext | null> {
  if (role !== 'student') {
    return null
  }

  const student = await UserModel.findById(userId)
    .select('fullName email role registrationNumber program semester section')
    .populate(['program', 'semester', 'section'])
    .exec()

  if (!student || student.role !== 'student') {
    return null
  }

  return {
    userId: student.id,
    name: student.fullName,
    email: student.email,
    registrationNumber: student.registrationNumber ?? null,
    program: serializeRelation(student.program),
    semester: serializeRelation(student.semester),
    section: serializeRelation(student.section),
  }
}

async function getLoggedInStudentCourses(
  userId: string,
  role: UserRole
): Promise<SerializedCourseOffering[]> {
  if (role !== 'student') {
    return []
  }

  const student = await UserModel.findById(userId).select('-passwordHash').exec()

  if (!student || student.role !== 'student') {
    return []
  }

  return listStudentCourses(student as unknown as UserDocument)
}

function scopeFromStudent(student: StudentServiceStudentContext | null) {
  if (!student) {
    return null
  }

  return {
    canReferenceProgram: Boolean(student.program),
    canReferenceSemester: Boolean(student.semester),
    canReferenceSection: Boolean(student.section),
  }
}

export async function getStudentServiceContext(
  userId: string,
  role: UserRole
): Promise<StudentServiceContext> {
  const [semesters, sections, student, enrolledCourses] = await Promise.all([
    listSemesters(),
    listSections(),
    getLoggedInStudentContext(userId, role),
    getLoggedInStudentCourses(userId, role),
  ])
  const currentSemester =
    semesters.find((semester) => semester.isActive && !semester.isClosed) ?? null
  const availableSections = sections.filter((section) => {
    if (!section.isActive) {
      return false
    }

    if (!currentSemester) {
      return true
    }

    return section.semester.id === currentSemester.id
  })
  const hasSection = availableSections.length > 0
  const structureScope: StudentServiceStructureScope = {
    canReferenceProgram: hasSection,
    canReferenceSemester: Boolean(currentSemester),
    canReferenceSection: hasSection,
  }
  const studentScope = scopeFromStudent(student)
  const scope = role === 'student' ? (studentScope ?? unresolvedScope) : structureScope

  return {
    currentSemester,
    availableSections,
    student,
    enrolledCourses,
    timetableScope: scope,
    examScope: scope,
    aiScope:
      scope.canReferenceProgram && scope.canReferenceSemester && scope.canReferenceSection
        ? scope
        : unresolvedScope,
  }
}
