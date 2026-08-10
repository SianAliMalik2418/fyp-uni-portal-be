import type { UserRole } from '../models/user.model.js'
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
  timetableScope: StudentServiceStructureScope
  examScope: StudentServiceStructureScope
  aiScope: StudentServiceStructureScope
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

export async function getStudentServiceContext(): Promise<StudentServiceContext> {
  const [semesters, sections] = await Promise.all([listSemesters(), listSections()])
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
  const scope: StudentServiceStructureScope = {
    canReferenceProgram: hasSection,
    canReferenceSemester: Boolean(currentSemester),
    canReferenceSection: hasSection,
  }

  return {
    currentSemester,
    availableSections,
    timetableScope: scope,
    examScope: scope,
    aiScope: hasSection && currentSemester ? scope : unresolvedScope,
  }
}
