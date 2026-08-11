import type { UserRole } from '../models/user.model.js'
import { UserModel } from '../models/user.model.js'
import { listSections, type SerializedSection } from './section.service.js'
import { listSemesters, type SerializedSemester } from './semester.service.js'

export type StudentServiceModule =
  'fees' | 'timetable' | 'exams' | 'materials' | 'announcements' | 'notifications' | 'ai-assistant'

export type StudentServicePlaceholder = {
  module: StudentServiceModule
  items: []
  empty: true
  message: string
  allowedRoles: UserRole[]
}

export type StudentServiceContext = {
  currentSemester: SerializedSemester | null
  availableSections: SerializedSection[]
  student: StudentServiceStudentContext | null
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

const placeholders: Record<StudentServiceModule, Omit<StudentServicePlaceholder, 'module'>> = {
  fees: {
    items: [],
    empty: true,
    message: 'No fee records available yet.',
    allowedRoles: ['student', 'admin'],
  },
  timetable: {
    items: [],
    empty: true,
    message: 'No timetable entries available yet.',
    allowedRoles: ['student', 'teacher', 'admin'],
  },
  exams: {
    items: [],
    empty: true,
    message: 'No exam date sheet available yet.',
    allowedRoles: ['student', 'teacher', 'admin'],
  },
  materials: {
    items: [],
    empty: true,
    message: 'No course materials available yet.',
    allowedRoles: ['student', 'teacher', 'admin'],
  },
  announcements: {
    items: [],
    empty: true,
    message: 'No announcements available yet.',
    allowedRoles: ['student', 'teacher', 'hod', 'admin'],
  },
  notifications: {
    items: [],
    empty: true,
    message: 'No notifications available yet.',
    allowedRoles: ['student', 'teacher', 'hod', 'admin'],
  },
  'ai-assistant': {
    items: [],
    empty: true,
    message: 'The AI assistant boundary is ready, but chat responses are not enabled yet.',
    allowedRoles: ['student'],
  },
}

export function getStudentServicePlaceholder(
  module: StudentServiceModule
): StudentServicePlaceholder {
  return {
    module,
    ...placeholders[module],
  }
}

export function getStudentServiceAllowedRoles(module: StudentServiceModule) {
  return placeholders[module].allowedRoles
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
  const [semesters, sections, student] = await Promise.all([
    listSemesters(),
    listSections(),
    getLoggedInStudentContext(userId, role),
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
    timetableScope: scope,
    examScope: scope,
    aiScope:
      scope.canReferenceProgram && scope.canReferenceSemester && scope.canReferenceSection
        ? scope
        : unresolvedScope,
  }
}
