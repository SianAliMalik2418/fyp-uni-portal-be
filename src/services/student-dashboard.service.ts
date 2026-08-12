import type { UserDocument } from '../models/user.model.js'
import {
  getStudentAttendanceSummaries,
  type AttendanceCourseSummary,
} from './academic-performance.service.js'
import {
  listPublishedStudentMarks,
  type PublishedStudentMarks,
} from './student-marks.service.js'

export type StudentDashboardSummary = {
  attendance: {
    summaries: AttendanceCourseSummary[]
  }
  academics: PublishedStudentMarks
}

export async function getStudentDashboardSummary(
  student: UserDocument
): Promise<StudentDashboardSummary> {
  const [summaries, academics] = await Promise.all([
    getStudentAttendanceSummaries(student),
    listPublishedStudentMarks(student),
  ])

  return {
    attendance: {
      summaries,
    },
    academics,
  }
}
