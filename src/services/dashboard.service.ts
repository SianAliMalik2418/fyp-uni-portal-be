import { AttendanceSessionModel } from '../models/attendance-session.model.js'
import { AssessmentModel } from '../models/assessment.model.js'
import { AuditLogModel } from '../models/audit-log.model.js'
import { CourseModel } from '../models/course.model.js'
import { CourseOfferingModel } from '../models/course-offering.model.js'
import { DepartmentModel } from '../models/department.model.js'
import { EnrollmentModel } from '../models/enrollment.model.js'
import { MarkSheetModel } from '../models/mark-sheet.model.js'
import { ProgramModel } from '../models/program.model.js'
import { ResultModel } from '../models/result.model.js'
import { SectionModel } from '../models/section.model.js'
import { SemesterModel } from '../models/semester.model.js'
import { UserModel, type UserDocument } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'
import {
  getStudentAttendanceSummaries,
  listLowAttendanceStudents,
} from './academic-performance.service.js'
import { listAnnouncements } from './announcement.service.js'
import { listStudentCourses, listTeacherCourseOfferings } from './course.service.js'
import { listStudentExams } from './exam.service.js'
import { getCurrentStudentFee } from './fee.service.js'
import { listNotifications } from './notification.service.js'
import { getPublishedStudentResults } from './result.service.js'
import { listPublishedStudentMarks } from './student-marks.service.js'
import { getStudentTimetable } from './timetable.service.js'

type StudentProfile = {
  id: string
  name: string
  registrationNumber?: string
  department: DashboardRelation | null
  program: DashboardRelation | null
  semester: DashboardSemester | null
  section: DashboardRelation | null
}

type DashboardRelation = {
  id: string
  name: string
  code?: string
}

type DashboardSemester = DashboardRelation & {
  academicYear?: string
}

type StudentResults = Awaited<ReturnType<typeof getPublishedStudentResults>>
type StudentMarks = Awaited<ReturnType<typeof listPublishedStudentMarks>>
type StudentAttendance = Awaited<ReturnType<typeof getStudentAttendanceSummaries>>
type StudentNotifications = Awaited<ReturnType<typeof listNotifications>>
type StudentCourses = Awaited<ReturnType<typeof listStudentCourses>>
type StudentFee = Awaited<ReturnType<typeof getCurrentStudentFee>>
type StudentTimetable = Awaited<ReturnType<typeof getStudentTimetable>>
type StudentExams = Awaited<ReturnType<typeof listStudentExams>>
type Announcements = Awaited<ReturnType<typeof listAnnouncements>>['announcements']

export type TeacherDashboardData = {
  summary: {
    assignedCourses: number
    sections: number
    students: number
    attendanceSessions: number
    completedMarkSheets: number
    totalAssessments: number
    draftResults: number
    pendingResults: number
    returnedResults: number
  }
  assignedCourses: StudentCourses
  attendanceActivity: Array<{
    id: string
    date: string
    courseCode: string
    courseTitle: string
    sectionName: string
    studentCount: number
  }>
}

export type HodDashboardData = {
  department: DashboardRelation | null
  summary: {
    students: number
    teachers: number
    courses: number
    lowAttendance: number
    pendingApprovals: number
    recentlyApproved: number
  }
  lowAttendance: Awaited<ReturnType<typeof listLowAttendanceStudents>>['shortages']
  recentlyApprovedResults: Array<{
    id: string
    courseCode: string
    courseTitle: string
    approvedAt?: Date
    studentCount: number
  }>
  academicSummary: {
    approvedResults: number
    studentsAssessed: number
    averagePercentage: number
    passRate: number
  }
}

export type AdminDashboardData = {
  summary: {
    students: number
    teachers: number
    departments: number
    programs: number
    sections: number
    courses: number
  }
  currentSemester: DashboardSemester | null
  recentImports: Array<{
    id: string
    fileName: string
    importedAt: Date
    importedCount: number
  }>
  recentActivity: Array<{
    id: string
    label: string
    detail: string
    occurredAt?: Date
  }>
}

export type DashboardDependencies = {
  getStudentProfile(user: UserDocument): Promise<StudentProfile>
  getStudentAttendance(user: UserDocument): Promise<StudentAttendance>
  getStudentMarks(user: UserDocument): Promise<StudentMarks>
  getStudentResults(user: UserDocument): Promise<StudentResults>
  getStudentNotifications(user: UserDocument): Promise<StudentNotifications>
  getStudentCourses(user: UserDocument): Promise<StudentCourses>
  getStudentFee(studentId: string): Promise<StudentFee>
  getStudentTimetable(user: UserDocument): Promise<StudentTimetable>
  getStudentExams(user: UserDocument): Promise<StudentExams>
  getAnnouncements(user: UserDocument): Promise<Announcements>
  getTeacherDashboard(user: UserDocument): Promise<TeacherDashboardData>
  getHodDashboard(user: UserDocument): Promise<HodDashboardData>
  getAdminDashboard(): Promise<AdminDashboardData>
}

const dashboardDays = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const
type DashboardDay = (typeof dashboardDays)[number]

const universityDateFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Karachi',
  weekday: 'long',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function serializeRelation(value: unknown): DashboardRelation | null {
  if (!value || typeof value !== 'object' || !('_id' in value) || !('name' in value)) {
    return null
  }

  const relation = value as { _id: { toString(): string }; name: string; code?: string }
  return { id: relation._id.toString(), name: relation.name, code: relation.code }
}

function serializeSemester(value: unknown): DashboardSemester | null {
  const relation = serializeRelation(value)
  if (!relation || !value || typeof value !== 'object') return null
  const academicYear = 'academicYear' in value ? String(value.academicYear) : undefined
  return { ...relation, academicYear }
}

async function getStudentProfile(user: UserDocument): Promise<StudentProfile> {
  const student = await UserModel.findById(user._id)
    .select('fullName registrationNumber department program semester section')
    .populate(['department', 'program', 'semester', 'section'])
    .exec()

  if (!student) throw new ApiError(404, 'Student profile not found')

  return {
    id: student.id,
    name: student.fullName,
    registrationNumber: student.registrationNumber,
    department: serializeRelation(student.department),
    program: serializeRelation(student.program),
    semester: serializeSemester(student.semester),
    section: serializeRelation(student.section),
  }
}

function isDashboardDay(value: string | undefined): value is DashboardDay {
  return dashboardDays.some((day) => day === value)
}

function universityDate(now: Date) {
  const parts = new Map(
    universityDateFormatter.formatToParts(now).map((part) => [part.type, part.value])
  )
  const dayOfWeek = parts.get('weekday')?.toLowerCase()
  const year = parts.get('year')
  const month = parts.get('month')
  const day = parts.get('day')

  if (!isDashboardDay(dayOfWeek) || !year || !month || !day) {
    throw new Error('Could not calculate the university date')
  }

  return { dayOfWeek, dateKey: `${year}-${month}-${day}` }
}

function todayClasses(timetable: StudentTimetable, now: Date) {
  const { dayOfWeek } = universityDate(now)
  return timetable?.entries.filter((entry) => entry.dayOfWeek === dayOfWeek) ?? []
}

function upcomingExams(exams: StudentExams, now: Date) {
  const { dateKey } = universityDate(now)
  return exams
    .filter((exam) => exam.examDate >= dateKey)
    .sort((left, right) => left.examDate.localeCompare(right.examDate))
    .slice(0, 5)
}

function referenceId(value: unknown) {
  if (!value) return ''
  if (typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id)
  }
  return String(value)
}

async function getTeacherDashboard(user: UserDocument): Promise<TeacherDashboardData> {
  const assignedCourses = await listTeacherCourseOfferings(user)
  const offeringIds = assignedCourses.map((offering) => offering.id)
  const offeringById = new Map(assignedCourses.map((offering) => [offering.id, offering]))

  if (!offeringIds.length) {
    return {
      summary: {
        assignedCourses: 0,
        sections: 0,
        students: 0,
        attendanceSessions: 0,
        completedMarkSheets: 0,
        totalAssessments: 0,
        draftResults: 0,
        pendingResults: 0,
        returnedResults: 0,
      },
      assignedCourses: [],
      attendanceActivity: [],
    }
  }

  const [
    studentIds,
    attendanceSessionCount,
    attendanceSessions,
    totalAssessments,
    completedMarkSheets,
    draftResults,
    pendingResults,
    returnedResults,
  ] = await Promise.all([
    EnrollmentModel.distinct('student', { courseOffering: { $in: offeringIds }, isActive: true }),
    AttendanceSessionModel.countDocuments({
      teacher: user._id,
      courseOffering: { $in: offeringIds },
    }).exec(),
    AttendanceSessionModel.find({ teacher: user._id, courseOffering: { $in: offeringIds } })
      .sort({ dateKey: -1 })
      .limit(6)
      .select('courseOffering dateKey records')
      .lean()
      .exec(),
    AssessmentModel.countDocuments({ courseOffering: { $in: offeringIds } }).exec(),
    MarkSheetModel.countDocuments({
      courseOffering: { $in: offeringIds },
      isDraft: false,
    }).exec(),
    ResultModel.countDocuments({ teacher: user._id, status: 'draft' }).exec(),
    ResultModel.countDocuments({ teacher: user._id, status: 'pending' }).exec(),
    ResultModel.countDocuments({ teacher: user._id, status: 'returned' }).exec(),
  ])

  return {
    summary: {
      assignedCourses: assignedCourses.length,
      sections: new Set(assignedCourses.map((offering) => offering.section.id)).size,
      students: studentIds.length,
      attendanceSessions: attendanceSessionCount,
      completedMarkSheets,
      totalAssessments,
      draftResults,
      pendingResults,
      returnedResults,
    },
    assignedCourses,
    attendanceActivity: attendanceSessions.flatMap((session) => {
      const offering = offeringById.get(referenceId(session.courseOffering))
      if (!offering) return []
      return [
        {
          id: referenceId(session._id),
          date: session.dateKey,
          courseCode: offering.course.code,
          courseTitle: offering.course.title,
          sectionName: offering.section.name,
          studentCount: session.records.length,
        },
      ]
    }),
  }
}

type RecentApprovedResult = {
  _id: unknown
  approvedAt?: Date
  records: unknown[]
  courseOffering?: {
    course?: { code?: string; title?: string }
  }
}

async function getHodDashboard(user: UserDocument): Promise<HodDashboardData> {
  if (!user.department) throw new ApiError(400, 'HOD does not have an assigned department')

  const departmentId = user.department
  const [department, students, teachers, courses, courseIds, lowAttendance] = await Promise.all([
    DepartmentModel.findById(departmentId).select('name code').lean().exec(),
    UserModel.countDocuments({ role: 'student', department: departmentId, isActive: true }).exec(),
    UserModel.countDocuments({
      role: { $in: ['teacher', 'hod'] },
      department: departmentId,
      isActive: true,
    }).exec(),
    CourseModel.countDocuments({ department: departmentId, isActive: true }).exec(),
    CourseModel.find({ department: departmentId, isActive: true })
      .select('_id')
      .limit(500)
      .lean()
      .exec(),
    listLowAttendanceStudents(user),
  ])
  const offeringRows = await CourseOfferingModel.find({
    course: { $in: courseIds.map((course) => course._id) },
    isActive: true,
  })
    .select('_id')
    .limit(1000)
    .lean()
    .exec()
  const offeringIds = offeringRows.map((offering) => offering._id)

  const [pendingApprovals, recentlyApprovedCount, recentResults, academicRows] = await Promise.all([
    ResultModel.countDocuments({ courseOffering: { $in: offeringIds }, status: 'pending' }).exec(),
    ResultModel.countDocuments({ courseOffering: { $in: offeringIds }, status: 'approved' }).exec(),
    ResultModel.find({ courseOffering: { $in: offeringIds }, status: 'approved' })
      .sort({ approvedAt: -1 })
      .limit(6)
      .select('courseOffering approvedAt records')
      .populate({ path: 'courseOffering', populate: { path: 'course' } })
      .lean()
      .exec(),
    ResultModel.aggregate<{
      approvedResults: number
      studentsAssessed: number
      averagePercentage: number
      passCount: number
    }>([
      { $match: { courseOffering: { $in: offeringIds }, status: 'approved' } },
      { $unwind: '$records' },
      {
        $group: {
          _id: null,
          approvedResults: { $addToSet: '$_id' },
          studentsAssessed: { $sum: 1 },
          averagePercentage: { $avg: '$records.finalPercentage' },
          passCount: { $sum: { $cond: [{ $gt: ['$records.gradePoint', 0] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          approvedResults: { $size: '$approvedResults' },
          studentsAssessed: 1,
          averagePercentage: 1,
          passCount: 1,
        },
      },
    ]).exec(),
  ])

  const academic = academicRows[0]
  const results = recentResults as unknown as RecentApprovedResult[]

  return {
    department: department
      ? { id: referenceId(department._id), name: department.name, code: department.code }
      : null,
    summary: {
      students,
      teachers,
      courses,
      lowAttendance: lowAttendance.total,
      pendingApprovals,
      recentlyApproved: recentlyApprovedCount,
    },
    lowAttendance: lowAttendance.shortages,
    recentlyApprovedResults: results.map((result) => ({
      id: referenceId(result._id),
      courseCode: result.courseOffering?.course?.code ?? '-',
      courseTitle: result.courseOffering?.course?.title ?? 'Course',
      approvedAt: result.approvedAt,
      studentCount: result.records.length,
    })),
    academicSummary: {
      approvedResults: academic?.approvedResults ?? 0,
      studentsAssessed: academic?.studentsAssessed ?? 0,
      averagePercentage: Math.round((academic?.averagePercentage ?? 0) * 100) / 100,
      passRate: academic?.studentsAssessed
        ? Math.round((academic.passCount / academic.studentsAssessed) * 10000) / 100
        : 0,
    },
  }
}

async function getAdminDashboard(): Promise<AdminDashboardData> {
  const [
    students,
    teachers,
    departments,
    programs,
    sections,
    courses,
    semester,
    recentUsers,
    recentImports,
  ] = await Promise.all([
    UserModel.countDocuments({ role: 'student', isActive: true }).exec(),
    UserModel.countDocuments({ role: { $in: ['teacher', 'hod'] }, isActive: true }).exec(),
    DepartmentModel.countDocuments({ isActive: true }).exec(),
    ProgramModel.countDocuments({ isActive: true }).exec(),
    SectionModel.countDocuments({ isActive: true }).exec(),
    CourseModel.countDocuments({ isActive: true }).exec(),
    SemesterModel.findOne({ isActive: true })
      .sort({ startsAt: -1, createdAt: -1 })
      .select('name academicYear')
      .lean()
      .exec(),
    UserModel.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('fullName role createdAt')
      .lean()
      .exec(),
    AuditLogModel.find({ module: 'users', affectedRecordId: 'student-csv-import' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .exec(),
  ])

  return {
    summary: { students, teachers, departments, programs, sections, courses },
    currentSemester: semester
      ? {
          id: referenceId(semester._id),
          name: semester.name,
          academicYear: semester.academicYear,
        }
      : null,
    recentImports: recentImports.map((entry) => ({
      id: referenceId(entry._id),
      fileName: entry.affectedRecordLabel ?? 'Student import.csv',
      importedAt: entry.createdAt ?? new Date(0),
      importedCount: Number.parseInt(entry.reason ?? '0', 10) || 0,
    })),
    recentActivity: recentUsers.map((recentUser) => ({
      id: referenceId(recentUser._id),
      label: 'Account created',
      detail: `${recentUser.fullName} · ${recentUser.role}`,
      occurredAt: recentUser.createdAt,
    })),
  }
}

const defaultDependencies: DashboardDependencies = {
  getStudentProfile,
  getStudentAttendance: getStudentAttendanceSummaries,
  getStudentMarks: listPublishedStudentMarks,
  getStudentResults: getPublishedStudentResults,
  getStudentNotifications: listNotifications,
  getStudentCourses: listStudentCourses,
  getStudentFee: getCurrentStudentFee,
  getStudentTimetable,
  getStudentExams: listStudentExams,
  getAnnouncements: async (user) =>
    (await listAnnouncements(user, { page: 1, limit: 5, status: 'active' })).announcements,
  getTeacherDashboard,
  getHodDashboard,
  getAdminDashboard,
}

export function createDashboardService(dependencies: DashboardDependencies) {
  return {
    async getDashboard(user: UserDocument, now = new Date()) {
      if (user.role === 'teacher') {
        return { role: 'teacher' as const, ...(await dependencies.getTeacherDashboard(user)) }
      }

      if (user.role === 'hod') {
        return { role: 'hod' as const, ...(await dependencies.getHodDashboard(user)) }
      }

      if (user.role === 'admin') {
        return { role: 'admin' as const, ...(await dependencies.getAdminDashboard()) }
      }

      const [
        student,
        attendance,
        academics,
        publishedResults,
        notifications,
        courses,
        fee,
        timetable,
        exams,
        announcements,
      ] = await Promise.all([
        dependencies.getStudentProfile(user),
        dependencies.getStudentAttendance(user),
        dependencies.getStudentMarks(user),
        dependencies.getStudentResults(user),
        dependencies.getStudentNotifications(user),
        dependencies.getStudentCourses(user),
        dependencies.getStudentFee(user.id),
        dependencies.getStudentTimetable(user),
        dependencies.getStudentExams(user),
        dependencies.getAnnouncements(user),
      ])
      const latestSemester = publishedResults.semesters[0]

      return {
        role: 'student' as const,
        student,
        currentSemester: student.semester,
        courses,
        attendance: { summaries: attendance },
        academics,
        results: {
          latest: latestSemester?.courses[0] ?? null,
          gpa: latestSemester?.gpa ?? 0,
          cgpa: publishedResults.cgpa,
        },
        fee,
        todayClasses: todayClasses(timetable, now),
        upcomingExams: upcomingExams(exams, now),
        announcements,
        notifications,
      }
    },
  }
}

export const getRoleDashboard = createDashboardService(defaultDependencies).getDashboard
