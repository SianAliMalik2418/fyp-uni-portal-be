import type { UserDocument } from '../models/user.model.js'
import type { AiContextSection } from '../validators/ai-assistant.validator.js'
import { ApiError } from '../utils/api-error.js'
import { getStudentAttendanceSummaries } from './academic-performance.service.js'
import { listAnnouncements } from './announcement.service.js'
import { listStudentExams } from './exam.service.js'
import { getCurrentStudentFee } from './fee.service.js'
import { getPublishedStudentResults } from './result.service.js'
import { listPublishedStudentMarks } from './student-marks.service.js'
import { getStudentServiceContext } from './student-services.service.js'
import { getStudentTimetable } from './timetable.service.js'

type IdentityAndStructure = Pick<
  Awaited<ReturnType<typeof getStudentServiceContext>>,
  'student' | 'currentSemester' | 'enrolledCourses'
>

export type StudentIdentityField = 'name' | 'email' | 'registrationNumber'

export type StudentAiContextRequest = {
  sections: readonly AiContextSection[]
  identityFields?: readonly StudentIdentityField[]
}

export type StudentAiContext = Partial<Record<AiContextSection, unknown>>

export type StudentAiContextDependencies = {
  getIdentityAndStructure(student: UserDocument): Promise<IdentityAndStructure>
  getAttendance(student: UserDocument): ReturnType<typeof getStudentAttendanceSummaries>
  getMarks(student: UserDocument): ReturnType<typeof listPublishedStudentMarks>
  getResults(student: UserDocument): ReturnType<typeof getPublishedStudentResults>
  getFee(studentId: string): ReturnType<typeof getCurrentStudentFee>
  getTimetable(student: UserDocument): ReturnType<typeof getStudentTimetable>
  getExams(student: UserDocument): ReturnType<typeof listStudentExams>
  getAnnouncements(
    student: UserDocument
  ): Promise<Awaited<ReturnType<typeof listAnnouncements>>['announcements']>
}

const defaultDependencies: StudentAiContextDependencies = {
  getIdentityAndStructure: async (student) => {
    const context = await getStudentServiceContext(student.id, student.role)
    return {
      student: context.student,
      currentSemester: context.currentSemester,
      enrolledCourses: context.enrolledCourses,
    }
  },
  getAttendance: getStudentAttendanceSummaries,
  getMarks: listPublishedStudentMarks,
  getResults: getPublishedStudentResults,
  getFee: getCurrentStudentFee,
  getTimetable: getStudentTimetable,
  getExams: listStudentExams,
  getAnnouncements: async (student) =>
    (await listAnnouncements(student, { page: 1, limit: 10, status: 'active' })).announcements,
}

function requestedIdentity(
  student: NonNullable<IdentityAndStructure['student']>,
  fields: readonly StudentIdentityField[]
) {
  return Object.fromEntries(fields.map((field) => [field, student[field]]))
}

export function createStudentAiContextService(dependencies: StudentAiContextDependencies) {
  return {
    async getContext(
      student: UserDocument,
      request: StudentAiContextRequest
    ): Promise<StudentAiContext> {
      if (student.role !== 'student') {
        throw new ApiError(403, 'Student AI context access required')
      }

      const sections = new Set(request.sections)
      const needsIdentityAndStructure = ['identity', 'academic_structure', 'courses'].some(
        (section) => sections.has(section as AiContextSection)
      )
      const needsResults = ['grades', 'gpa', 'results'].some((section) =>
        sections.has(section as AiContextSection)
      )
      const [
        identityAndStructure,
        attendance,
        marks,
        results,
        fee,
        timetable,
        exams,
        announcements,
      ] = await Promise.all([
        needsIdentityAndStructure ? dependencies.getIdentityAndStructure(student) : null,
        sections.has('attendance') ? dependencies.getAttendance(student) : null,
        sections.has('marks') ? dependencies.getMarks(student) : null,
        needsResults ? dependencies.getResults(student) : null,
        sections.has('fee') ? dependencies.getFee(student.id) : null,
        sections.has('timetable') ? dependencies.getTimetable(student) : null,
        sections.has('exams') ? dependencies.getExams(student) : null,
        sections.has('announcements') ? dependencies.getAnnouncements(student) : null,
      ])

      if (needsIdentityAndStructure && !identityAndStructure?.student) {
        throw new ApiError(404, 'Authenticated student context not found')
      }

      const context: StudentAiContext = {}
      if (sections.has('identity') && identityAndStructure?.student) {
        context.identity = requestedIdentity(
          identityAndStructure.student,
          request.identityFields ?? []
        )
      }
      if (sections.has('academic_structure') && identityAndStructure?.student) {
        context.academic_structure = {
          currentSemester: identityAndStructure.currentSemester,
          program: identityAndStructure.student.program,
          semester: identityAndStructure.student.semester,
          section: identityAndStructure.student.section,
        }
      }
      if (sections.has('courses')) context.courses = identityAndStructure?.enrolledCourses ?? []
      if (sections.has('attendance')) context.attendance = attendance
      if (sections.has('marks')) context.marks = marks
      if (sections.has('grades')) {
        context.grades =
          results?.semesters.flatMap((semester) =>
            semester.courses.map((course) => ({
              course: course.offering.course,
              finalPercentage: course.finalPercentage,
              letterGrade: course.letterGrade,
              gradePoint: course.gradePoint,
            }))
          ) ?? []
      }
      if (sections.has('gpa')) {
        context.gpa = {
          semesters:
            results?.semesters.map((semester) => ({
              semester: semester.semester,
              gpa: semester.gpa,
            })) ?? [],
          cgpa: results?.cgpa ?? 0,
        }
      }
      if (sections.has('results')) context.results = results
      if (sections.has('fee')) context.fee = fee
      if (sections.has('timetable')) context.timetable = timetable
      if (sections.has('exams')) context.exams = exams
      if (sections.has('announcements')) context.announcements = announcements

      return context
    },
  }
}

export const getAuthenticatedStudentAiContext =
  createStudentAiContextService(defaultDependencies).getContext
