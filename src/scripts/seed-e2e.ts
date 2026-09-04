import mongoose, { Types } from 'mongoose'
import { connectDatabase, disconnectDatabase } from '../config/db.js'
import { env } from '../config/env.js'
import { AnnouncementModel } from '../models/announcement.model.js'
import {
  ASSESSMENT_CONFIGURATION_KEY,
  AssessmentConfigurationModel,
} from '../models/assessment-configuration.model.js'
import { AssessmentModel, type AssessmentCategory } from '../models/assessment.model.js'
import {
  ATTENDANCE_CONFIGURATION_KEY,
  AttendanceConfigurationModel,
} from '../models/attendance-configuration.model.js'
import {
  AttendanceSessionModel,
  type AttendanceStatus,
} from '../models/attendance-session.model.js'
import { BatchModel } from '../models/batch.model.js'
import { CourseOfferingModel } from '../models/course-offering.model.js'
import { CourseModel } from '../models/course.model.js'
import { DepartmentModel } from '../models/department.model.js'
import { EnrollmentModel } from '../models/enrollment.model.js'
import { ExamModel } from '../models/exam.model.js'
import { FeeModel } from '../models/fee.model.js'
import {
  GRADING_CONFIGURATION_KEY,
  GradingConfigurationModel,
} from '../models/grading-configuration.model.js'
import { MarkSheetModel } from '../models/mark-sheet.model.js'
import { NotificationModel } from '../models/notification.model.js'
import { ProgramModel } from '../models/program.model.js'
import { ResultModel, type ResultHistoryEntry, type ResultStatus } from '../models/result.model.js'
import { SectionModel } from '../models/section.model.js'
import { SemesterModel } from '../models/semester.model.js'
import { TimetableModel } from '../models/timetable.model.js'
import { UserModel } from '../models/user.model.js'
import { hashPassword } from '../services/auth.service.js'
import { defaultGradingScale } from '../services/grading-scale.service.js'

const password = 'Password123!'
const requiredDatabaseName = 'fyp_uni_portal_e2e'

const ids = {
  department: objectId('001'),
  program: objectId('002'),
  batch: objectId('003'),
  semester: objectId('004'),
  section: objectId('005'),
  targetSemester: objectId('040'),
  targetSection: objectId('041'),
  courses: {
    programming: objectId('006'),
    webEngineering: objectId('00d'),
    databases: objectId('00e'),
    networks: objectId('00f'),
    objectOrientedProgramming: objectId('042'),
  },
  offerings: {
    programming: objectId('007'),
    webEngineering: objectId('010'),
    databases: objectId('011'),
    networks: objectId('012'),
    objectOrientedProgramming: objectId('043'),
  },
  admin: objectId('008'),
  hod: objectId('009'),
  teacher: objectId('00a'),
  student: objectId('00b'),
  programmingQuiz: objectId('00c'),
  results: {
    draft: objectId('030'),
    pending: objectId('031'),
    returned: objectId('032'),
    approved: objectId('033'),
  },
  fee: objectId('034'),
  timetable: objectId('035'),
  exam: objectId('036'),
  announcement: objectId('037'),
  notifications: {
    course: objectId('038'),
    attendance: objectId('039'),
    result: objectId('03a'),
    returned: objectId('03b'),
  },
}

type CourseSeed = {
  _id: Types.ObjectId
  code: string
  title: string
  description: string
}

function objectId(suffix: string) {
  return new Types.ObjectId(`66b000000000000000000${suffix}`)
}

function databaseName(databaseUri: string) {
  try {
    return new URL(databaseUri).pathname.replace(/^\//, '')
  } catch {
    return ''
  }
}

function assertSafeTarget() {
  if (env.NODE_ENV !== 'test' || databaseName(env.MONGODB_URI) !== requiredDatabaseName) {
    throw new Error(`Refusing to seed non-e2e database; expected ${requiredDatabaseName}`)
  }
}

async function seed() {
  assertSafeTarget()
  await connectDatabase()
  await mongoose.connection.dropDatabase()

  const department = await DepartmentModel.create({
    _id: ids.department,
    name: 'Computer Science',
    code: 'CS',
    description: 'School of computing',
    isActive: true,
  })
  const program = await ProgramModel.create({
    _id: ids.program,
    name: 'BS Computer Science',
    code: 'BSCS',
    department: department._id,
    totalSemesters: 8,
    duration: 4,
    durationUnit: 'years',
    isActive: true,
  })
  const semester = await SemesterModel.create({
    _id: ids.semester,
    name: 'Fall Semester',
    academicYear: '2026-2027',
    startsAt: new Date('2026-09-01T00:00:00.000Z'),
    endsAt: new Date('2027-01-15T00:00:00.000Z'),
    isActive: true,
    isClosed: false,
  })
  const batch = await BatchModel.create({
    _id: ids.batch,
    name: 'Fall 2026',
    program: program._id,
    startingYear: 2026,
    expectedGraduationYear: 2030,
    isActive: true,
  })
  const section = await SectionModel.create({
    _id: ids.section,
    name: 'A',
    program: program._id,
    batch: batch._id,
    semester: semester._id,
    isActive: true,
  })
  const targetSemester = await SemesterModel.create({
    _id: ids.targetSemester,
    name: 'Spring Semester',
    academicYear: '2026-2027',
    startsAt: new Date('2027-02-01T00:00:00.000Z'),
    endsAt: new Date('2027-06-15T00:00:00.000Z'),
    isActive: false,
    isClosed: false,
  })
  const targetSection = await SectionModel.create({
    _id: ids.targetSection,
    name: 'A',
    program: program._id,
    batch: batch._id,
    semester: targetSemester._id,
    isActive: true,
  })

  const passwordHash = hashPassword(password)
  const [admin, hod, teacher, student] = await UserModel.create([
    {
      _id: ids.admin,
      fullName: 'Sian Admin',
      email: 'admin.e2e@example.com',
      role: 'admin',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
    },
    {
      _id: ids.hod,
      fullName: 'Hammad HOD',
      email: 'hod.e2e@example.com',
      role: 'hod',
      employeeId: 'HOD-E2E-001',
      department: department._id,
      passwordHash,
      isActive: true,
      mustChangePassword: false,
    },
    {
      _id: ids.teacher,
      fullName: 'Tayabba Teacher',
      email: 'teacher.e2e@example.com',
      role: 'teacher',
      employeeId: 'TCH-E2E-001',
      department: department._id,
      designation: 'Lecturer',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
    },
    {
      _id: ids.student,
      fullName: 'Ayesha Noor',
      email: 'student.e2e@example.com',
      role: 'student',
      registrationNumber: 'NCBAE-2026-CS-001',
      department: department._id,
      program: program._id,
      batch: batch._id,
      semester: semester._id,
      section: section._id,
      academicStatus: 'active',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
    },
  ])
  if (!admin || !hod || !teacher || !student) {
    throw new Error('Every demo role is required')
  }

  const courseSeeds: CourseSeed[] = [
    {
      _id: ids.courses.programming,
      code: 'PF',
      title: 'Programming Fundamentals',
      description: 'Introductory programming course',
    },
    {
      _id: ids.courses.webEngineering,
      code: 'WE',
      title: 'Web Engineering',
      description: 'Web application engineering course',
    },
    {
      _id: ids.courses.databases,
      code: 'DB',
      title: 'Database Systems',
      description: 'Database design and implementation course',
    },
    {
      _id: ids.courses.networks,
      code: 'CN',
      title: 'Computer Networks',
      description: 'Computer networking fundamentals course',
    },
  ]
  await CourseModel.create(
    courseSeeds.map((course) => ({
      ...course,
      creditHours: 3,
      department: department._id,
      program: program._id,
      semester: semester._id,
      isActive: true,
    }))
  )
  const objectOrientedProgramming = await CourseModel.create({
    _id: ids.courses.objectOrientedProgramming,
    code: 'OOP',
    title: 'Object-Oriented Programming',
    description: 'Object-oriented analysis and programming course',
    creditHours: 3,
    department: department._id,
    program: program._id,
    semester: targetSemester._id,
    isActive: true,
  })

  const offerings = await CourseOfferingModel.create(
    courseSeeds.map((course) => ({
      _id: offeringIdFor(course._id),
      course: course._id,
      section: section._id,
      teacher: teacher._id,
      isActive: true,
    }))
  )
  await CourseOfferingModel.create({
    _id: ids.offerings.objectOrientedProgramming,
    course: objectOrientedProgramming._id,
    section: targetSection._id,
    teacher: teacher._id,
    isActive: true,
  })
  await EnrollmentModel.create(
    offerings.map((offering) => ({
      student: student._id,
      courseOffering: offering._id,
      section: section._id,
      isActive: true,
    }))
  )

  await seedConfigurations()
  await seedAttendance(offerings[0]!._id, section._id, teacher._id, student._id)
  await seedAssessmentsAndResults(offerings, teacher._id, hod._id, student._id)
  await seedStudentServices({
    adminId: admin._id,
    teacherId: teacher._id,
    studentId: student._id,
    programId: program._id,
    semesterId: semester._id,
    sectionId: section._id,
    programmingCourseId: ids.courses.programming,
    programmingOfferingId: ids.offerings.programming,
  })

  console.log(
    JSON.stringify({
      database: mongoose.connection.name,
      users: {
        admin: admin.email,
        hod: hod.email,
        teacher: teacher.email,
        student: student.email,
      },
    })
  )
}

function offeringIdFor(courseId: Types.ObjectId) {
  const entry = Object.entries(ids.courses).find(([, id]) => id.equals(courseId))
  if (!entry) throw new Error('Course seed does not have a matching offering ID')
  return ids.offerings[entry[0] as keyof typeof ids.offerings]
}

async function seedConfigurations() {
  await Promise.all([
    AttendanceConfigurationModel.create({
      key: ATTENDANCE_CONFIGURATION_KEY,
      minimumAttendancePercentage: 75,
    }),
    AssessmentConfigurationModel.create({
      key: ASSESSMENT_CONFIGURATION_KEY,
      categories: [
        { id: 'quiz', weightPercentage: 10 },
        { id: 'assignment', weightPercentage: 10 },
        { id: 'attendance', weightPercentage: 10 },
        { id: 'presentation', weightPercentage: 10 },
        { id: 'midterm', weightPercentage: 25 },
        { id: 'final', weightPercentage: 35 },
      ],
    }),
    GradingConfigurationModel.create({
      key: GRADING_CONFIGURATION_KEY,
      ranges: defaultGradingScale,
    }),
  ])
}

async function seedAttendance(
  offeringId: Types.ObjectId,
  sectionId: Types.ObjectId,
  teacherId: Types.ObjectId,
  studentId: Types.ObjectId
) {
  await AttendanceSessionModel.create(
    (['present', 'present', 'absent', 'absent'] satisfies AttendanceStatus[]).map(
      (status, index) => {
        const day = index + 3
        const dateKey = `2026-08-0${day}`
        return {
          courseOffering: offeringId,
          section: sectionId,
          teacher: teacherId,
          date: new Date(`${dateKey}T00:00:00.000Z`),
          dateKey,
          records: [{ student: studentId, status }],
        }
      }
    )
  )
}

async function seedAssessmentsAndResults(
  offerings: Array<{ _id: Types.ObjectId }>,
  teacherId: Types.ObjectId,
  hodId: Types.ObjectId,
  studentId: Types.ObjectId
) {
  const [programming, webEngineering, databases, networks] = offerings
  if (!programming || !webEngineering || !databases || !networks) {
    throw new Error('Every demo course offering is required')
  }

  const programmingQuiz = await AssessmentModel.create({
    _id: ids.programmingQuiz,
    courseOffering: programming._id,
    teacher: teacherId,
    name: 'Quiz 1',
    category: 'quiz',
    maximumMarks: 10,
  })
  await MarkSheetModel.create({
    assessment: programmingQuiz._id,
    courseOffering: programming._id,
    teacher: teacherId,
    records: [{ student: studentId, obtainedMarks: 8 }],
    isDraft: false,
    createdAt: new Date('2026-08-25T08:00:00.000Z'),
    updatedAt: new Date('2026-08-25T08:00:00.000Z'),
  })
  await ResultModel.create({
    _id: ids.results.draft,
    courseOffering: programming._id,
    teacher: teacherId,
    status: 'draft',
    records: [resultRecord(studentId, [assessmentCategory('quiz', 8, 10, 10)], 'F', 0)],
    history: [],
  })

  await seedOfferingResult({
    offeringId: webEngineering._id,
    teacherId,
    hodId,
    studentId,
    status: 'pending',
    resultId: ids.results.pending,
    scores: [8, 16, 8, 8, 40, 75],
    marksPublishedAt: new Date('2026-08-22T08:00:00.000Z'),
    letterGrade: 'B+',
    gradePoint: 3.3,
  })
  await seedOfferingResult({
    offeringId: databases._id,
    teacherId,
    hodId,
    studentId,
    status: 'returned',
    resultId: ids.results.returned,
    scores: [7, 14, 8, 7, 35, 65],
    marksPublishedAt: new Date('2026-08-23T08:00:00.000Z'),
    letterGrade: 'B-',
    gradePoint: 2.7,
  })
  await seedOfferingResult({
    offeringId: networks._id,
    teacherId,
    hodId,
    studentId,
    status: 'approved',
    resultId: ids.results.approved,
    scores: [9, 18, 9, 8, 42, 88],
    marksPublishedAt: new Date('2026-08-24T08:00:00.000Z'),
    letterGrade: 'A',
    gradePoint: 4,
  })
}

async function seedOfferingResult({
  offeringId,
  teacherId,
  hodId,
  studentId,
  status,
  resultId,
  scores,
  marksPublishedAt,
  letterGrade,
  gradePoint,
}: {
  offeringId: Types.ObjectId
  teacherId: Types.ObjectId
  hodId: Types.ObjectId
  studentId: Types.ObjectId
  status: Exclude<ResultStatus, 'draft'>
  resultId: Types.ObjectId
  scores: number[]
  marksPublishedAt: Date
  letterGrade: string
  gradePoint: number
}) {
  const definitions = [
    { name: 'Quiz 1', category: 'quiz', maximumMarks: 10, weightPercentage: 10 },
    { name: 'Assignment 1', category: 'assignment', maximumMarks: 20, weightPercentage: 10 },
    { name: 'Attendance', category: 'attendance', maximumMarks: 10, weightPercentage: 10 },
    { name: 'Presentation', category: 'presentation', maximumMarks: 10, weightPercentage: 10 },
    { name: 'Midterm', category: 'midterm', maximumMarks: 50, weightPercentage: 25 },
    { name: 'Final', category: 'final', maximumMarks: 100, weightPercentage: 35 },
  ] as const
  const assessments = await AssessmentModel.create(
    definitions.map((definition) => ({
      courseOffering: offeringId,
      teacher: teacherId,
      name: definition.name,
      category: definition.category,
      maximumMarks: definition.maximumMarks,
    }))
  )
  await MarkSheetModel.create(
    assessments.map((assessment, index) => ({
      assessment: assessment._id,
      courseOffering: offeringId,
      teacher: teacherId,
      records: [{ student: studentId, obtainedMarks: scores[index] }],
      isDraft: false,
      createdAt: new Date(marksPublishedAt.getTime() + index * 60_000),
      updatedAt: new Date(marksPublishedAt.getTime() + index * 60_000),
    }))
  )
  const categories = definitions.map((definition, index) =>
    assessmentCategory(
      definition.category,
      scores[index] ?? 0,
      definition.maximumMarks,
      definition.weightPercentage
    )
  )
  const occurredAt = new Date('2026-08-20T10:00:00.000Z')
  const history: ResultHistoryEntry[] =
    status === 'pending'
      ? [{ action: 'submitted', actor: teacherId, occurredAt }]
      : status === 'returned'
        ? [
            { action: 'submitted', actor: teacherId, occurredAt },
            {
              action: 'returned',
              actor: hodId,
              comment: 'Review the recorded assessment marks.',
              occurredAt: new Date('2026-08-21T10:00:00.000Z'),
            },
          ]
        : [
            { action: 'submitted', actor: teacherId, occurredAt },
            {
              action: 'approved',
              actor: hodId,
              occurredAt: new Date('2026-08-22T10:00:00.000Z'),
            },
          ]

  await ResultModel.create({
    _id: resultId,
    courseOffering: offeringId,
    teacher: teacherId,
    status,
    records: [resultRecord(studentId, categories, letterGrade, gradePoint)],
    submittedAt: occurredAt,
    ...(status === 'returned'
      ? {
          hodComment: 'Review the recorded assessment marks.',
          returnedAt: new Date('2026-08-21T10:00:00.000Z'),
        }
      : {}),
    ...(status === 'approved'
      ? {
          approvedAt: new Date('2026-08-22T10:00:00.000Z'),
          approvedBy: hodId,
        }
      : {}),
    history,
  })
}

function assessmentCategory(
  category: AssessmentCategory,
  obtainedMarks: number,
  maximumMarks: number,
  weightPercentage: number
) {
  const percentage = (obtainedMarks / maximumMarks) * 100
  return {
    category,
    obtainedMarks,
    maximumMarks,
    percentage,
    weightedMarks: (percentage * weightPercentage) / 100,
  }
}

function resultRecord(
  studentId: Types.ObjectId,
  categories: ReturnType<typeof assessmentCategory>[],
  letterGrade: string,
  gradePoint: number
) {
  return {
    student: studentId,
    categories,
    finalPercentage: categories.reduce((total, category) => total + category.weightedMarks, 0),
    letterGrade,
    gradePoint,
  }
}

async function seedStudentServices({
  adminId,
  teacherId,
  studentId,
  programId,
  semesterId,
  sectionId,
  programmingCourseId,
  programmingOfferingId,
}: {
  adminId: Types.ObjectId
  teacherId: Types.ObjectId
  studentId: Types.ObjectId
  programId: Types.ObjectId
  semesterId: Types.ObjectId
  sectionId: Types.ObjectId
  programmingCourseId: Types.ObjectId
  programmingOfferingId: Types.ObjectId
}) {
  await FeeModel.create({
    _id: ids.fee,
    student: studentId,
    semester: semesterId,
    totalAmount: 100_000,
    paidAmount: 40_000,
    dueDate: new Date('2030-09-15T00:00:00.000Z'),
    paymentDate: new Date('2026-08-10T00:00:00.000Z'),
    notes: 'First installment received',
  })
  await TimetableModel.create({
    _id: ids.timetable,
    section: sectionId,
    program: programId,
    semester: semesterId,
    status: 'published',
    version: 1,
    notes: 'Demo timetable',
    entries: [
      {
        courseOffering: programmingOfferingId,
        course: programmingCourseId,
        teacher: teacherId,
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '10:30',
        startMinutes: 540,
        endMinutes: 630,
        room: 'Lab 1',
        slotType: 'lab',
        notes: 'Bring your lab manuals',
      },
    ],
    createdBy: adminId,
    updatedBy: adminId,
    publishedBy: adminId,
    publishedAt: new Date('2026-08-20T08:00:00.000Z'),
  })
  await ExamModel.create({
    _id: ids.exam,
    examType: 'Midterm',
    courseOffering: programmingOfferingId,
    course: programmingCourseId,
    program: programId,
    semester: semesterId,
    section: sectionId,
    examDate: new Date('2026-11-15T00:00:00.000Z'),
    startTime: '09:00',
    endTime: '11:00',
    startMinutes: 540,
    endMinutes: 660,
    room: 'Hall B',
    instructions: 'Demo exam entry',
    createdBy: adminId,
    updatedBy: adminId,
  })
  await AnnouncementModel.create({
    _id: ids.announcement,
    title: 'University portal demonstration notice',
    description: 'This notice demonstrates announcements in the university portal.',
    publishDate: new Date('2026-08-01T08:00:00.000Z'),
    expiryDate: new Date('2027-08-01T08:00:00.000Z'),
    isPinned: true,
    isActive: true,
    createdBy: adminId,
  })
  await NotificationModel.create([
    {
      _id: ids.notifications.course,
      recipient: studentId,
      type: 'course_assigned',
      notificationKey: 'demo:course-assigned:programming',
      title: 'Course assigned',
      message: 'Programming Fundamentals has been assigned to you.',
      resourcePath: '/courses',
    },
    {
      _id: ids.notifications.attendance,
      recipient: studentId,
      type: 'attendance_updated',
      notificationKey: 'demo:attendance-updated:programming',
      title: 'Attendance updated',
      message: 'Your Programming Fundamentals attendance summary is available.',
      resourcePath: '/attendance',
    },
    {
      _id: ids.notifications.result,
      recipient: studentId,
      type: 'result_published',
      notificationKey: 'demo:result-published:networks',
      result: ids.results.approved,
      title: 'Result published',
      message: 'Computer Networks has been approved. Your grade is A.',
      resourcePath: '/results',
    },
    {
      _id: ids.notifications.returned,
      recipient: teacherId,
      type: 'result_returned',
      notificationKey: 'demo:result-returned:databases',
      result: ids.results.returned,
      title: 'Result returned',
      message: 'A submitted result was returned for review.',
      resourcePath: '/results',
    },
  ])
}

void seed()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDatabase()
  })
