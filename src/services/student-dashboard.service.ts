import type { UserDocument } from '../models/user.model.js'
import {
  getStudentAttendanceSummaries,
  type AttendanceCourseSummary,
} from './academic-performance.service.js'
import { listPublishedStudentMarks, type PublishedStudentMarks } from './student-marks.service.js'
import { getPublishedStudentResults, type StudentCourseResult } from './result.service.js'
import { listNotifications, type SerializedNotification } from './notification.service.js'

export type StudentDashboardSummary = {
  attendance: {
    summaries: AttendanceCourseSummary[]
  }
  academics: PublishedStudentMarks
  results: {
    latest: StudentCourseResult | null
    gpa: number
    cgpa: number
  }
  notifications: SerializedNotification[]
}

export async function getStudentDashboardSummary(
  student: UserDocument
): Promise<StudentDashboardSummary> {
  const [summaries, academics, publishedResults, notifications] = await Promise.all([
    getStudentAttendanceSummaries(student),
    listPublishedStudentMarks(student),
    getPublishedStudentResults(student),
    listNotifications(student),
  ])
  const latestSemester = publishedResults.semesters[0]

  return {
    attendance: {
      summaries,
    },
    academics,
    results: {
      latest: latestSemester?.courses[0] ?? null,
      gpa: latestSemester?.gpa ?? 0,
      cgpa: publishedResults.cgpa,
    },
    notifications,
  }
}
