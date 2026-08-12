import type { UserDocument } from '../models/user.model.js'
import {
  getStudentAttendanceSummaries,
  type AttendanceCourseSummary,
} from './academic-performance.service.js'

export type StudentDashboardSummary = {
  attendance: {
    summaries: AttendanceCourseSummary[]
  }
}

export async function getStudentDashboardSummary(
  student: UserDocument
): Promise<StudentDashboardSummary> {
  const summaries = await getStudentAttendanceSummaries(student)

  return {
    attendance: {
      summaries,
    },
  }
}
