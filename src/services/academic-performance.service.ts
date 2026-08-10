import type { UserRole } from '../models/user.model.js'
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
  studentSection: SerializedSection | null
  canResolveStudentSection: boolean
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

export async function getAcademicPerformanceContext(): Promise<AcademicPerformanceContext> {
  const [semesters, sections] = await Promise.all([listSemesters(), listSections()])
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

  return {
    currentSemester,
    activeSections,
    studentSection: null,
    canResolveStudentSection: false,
  }
}
