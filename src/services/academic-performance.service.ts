import type { UserRole } from '../models/user.model.js'

export type AcademicPerformanceModule = 'attendance' | 'assessments' | 'marks' | 'results'

export type AcademicPerformancePlaceholder = {
  module: AcademicPerformanceModule
  items: []
  empty: true
  message: string
  allowedRoles: UserRole[]
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
