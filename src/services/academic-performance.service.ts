import type { UserRole } from '../models/user.model.js'
import { UserModel, type StudentAcademicStatus } from '../models/user.model.js'
import { listSections, type SerializedSection } from './section.service.js'
import { listSemesters, type SerializedSemester } from './semester.service.js'

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

async function listAcademicPerformanceStudents(): Promise<AcademicPerformanceStudent[]> {
  const students = await UserModel.find({ role: 'student' })
    .sort({ registrationNumber: 1, fullName: 1 })
    .select(
      'fullName registrationNumber department program batch semester section academicStatus isActive'
    )
    .populate(['department', 'program', 'batch', 'semester', 'section'])
    .exec()

  return students.map((student) => ({
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
  }))
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
