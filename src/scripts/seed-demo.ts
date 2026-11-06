import mongoose, { Types } from 'mongoose'
import { connectDatabase, disconnectDatabase } from '../config/db.js'
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
import { AuditLogModel, type AuditAction, type AuditModule } from '../models/audit-log.model.js'
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
import { NotificationModel, type NotificationType } from '../models/notification.model.js'
import { ProgramModel } from '../models/program.model.js'
import { ResultModel, type ResultHistoryEntry, type ResultStatus } from '../models/result.model.js'
import { SectionModel } from '../models/section.model.js'
import { SemesterModel } from '../models/semester.model.js'
import {
  TimetableModel,
  type TimetableDay,
  type TimetableSlotType,
} from '../models/timetable.model.js'
import { UserModel, type UserRole } from '../models/user.model.js'
import { hashPassword } from '../services/auth.service.js'
import { defaultGradingScale } from '../services/grading-scale.service.js'

const password = 'Password123!'
const demoPrefix = 'demo-real'

type DemoUser = {
  id: Types.ObjectId
  fullName: string
  email: string
  role: UserRole
  employeeId?: string
  registrationNumber?: string
  department?: Types.ObjectId
  program?: Types.ObjectId
  batch?: Types.ObjectId
  semester?: Types.ObjectId
  section?: Types.ObjectId
  academicStatus?: 'active' | 'frozen' | 'repeating' | 'dropped' | 'graduated'
  designation?: string
  profilePictureUrl?: string
}

type CourseSeed = {
  id: Types.ObjectId
  code: string
  title: string
  creditHours: number
  description: string
  semester: Types.ObjectId
  teacher: Types.ObjectId
}

type OfferingSeed = CourseSeed & {
  offeringId: Types.ObjectId
  section: Types.ObjectId
}

const ids = {
  departments: {
    cs: objectId(1),
    se: objectId(2),
    business: objectId(3),
    english: objectId(4),
  },
  programs: {
    bscs: objectId(20),
    bsse: objectId(21),
    bba: objectId(22),
    bsEnglish: objectId(23),
  },
  batches: {
    bscs2024: objectId(40),
    bscs2025: objectId(41),
    bsse2024: objectId(42),
    bba2025: objectId(43),
  },
  semesters: {
    fall2026: objectId(60),
    spring2027: objectId(61),
    summer2027: objectId(62),
  },
  sections: {
    bscsA: objectId(80),
    bscsB: objectId(81),
    bsseA: objectId(82),
    bbaA: objectId(83),
    bscsNextA: objectId(84),
  },
  users: {
    admin: objectId(100),
    hodCs: objectId(101),
    hodBusiness: objectId(102),
    teacherAyesha: objectId(103),
    teacherBilal: objectId(104),
    teacherDanish: objectId(105),
    teacherMaria: objectId(106),
    teacherSara: objectId(107),
    teacherUsman: objectId(108),
    studentStart: 200,
  },
  courseStart: 300,
  offeringStart: 400,
  assessmentStart: 500,
  resultStart: 700,
  feeStart: 800,
  timetableStart: 900,
  examStart: 950,
  announcementStart: 980,
  notificationStart: 1020,
}

function objectId(index: number) {
  return new Types.ObjectId(`66d100000000000000${index.toString(16).padStart(6, '0')}`)
}

async function seedDemo() {
  await connectDatabase()
  await removeExistingDemoData()

  await seedConfigurations()

  await seedAcademicStructure()
  const users = await seedUsers()
  const offerings = await seedCoursesAndOfferings({
    teacherIds: [
      ids.users.teacherAyesha,
      ids.users.teacherBilal,
      ids.users.teacherDanish,
      ids.users.teacherMaria,
      ids.users.teacherSara,
      ids.users.teacherUsman,
    ],
  })
  await seedEnrollments(offerings, users.students)
  await seedAttendance(offerings, users.students)
  await seedAssessmentsAndResults(offerings, users.students)
  await seedStudentServices({ offerings, users })
  await seedAuditLog(users.admin.id)

  console.log(
    JSON.stringify(
      {
        database: mongoose.connection.name,
        password,
        users: {
          admin: 'admin.demo@ncbae.edu.pk',
          hod: 'hod.cs.demo@ncbae.edu.pk',
          teacher: 'ayesha.rafiq@ncbae.edu.pk',
          student: 'ali.hassan@student.ncbae.edu.pk',
        },
        seeded: {
          departments: 4,
          programs: 4,
          users: users.all.length,
          courses: 8,
          offerings: offerings.length,
          students: users.students.length,
        },
      },
      null,
      2
    )
  )
}

async function removeExistingDemoData() {
  const allIds = demoObjectIds()
  await Promise.all([
    NotificationModel.deleteMany({ notificationKey: new RegExp(`^${demoPrefix}:`) }),
    AuditLogModel.deleteMany({ affectedRecordId: { $in: allIds.map(String) } }),
    MarkSheetModel.deleteMany({ assessment: { $in: allIds } }),
    AssessmentModel.deleteMany({ _id: { $in: allIds } }),
    ResultModel.deleteMany({ _id: { $in: allIds } }),
    AttendanceSessionModel.deleteMany({ courseOffering: { $in: allIds } }),
    TimetableModel.deleteMany({ _id: { $in: allIds } }),
    ExamModel.deleteMany({ _id: { $in: allIds } }),
    FeeModel.deleteMany({ _id: { $in: allIds } }),
    EnrollmentModel.deleteMany({ courseOffering: { $in: allIds } }),
    CourseOfferingModel.deleteMany({ _id: { $in: allIds } }),
    CourseModel.deleteMany({ _id: { $in: allIds } }),
    UserModel.deleteMany({ _id: { $in: allIds } }),
    SectionModel.deleteMany({ _id: { $in: allIds } }),
    BatchModel.deleteMany({ _id: { $in: allIds } }),
    ProgramModel.deleteMany({ _id: { $in: allIds } }),
    DepartmentModel.deleteMany({ _id: { $in: allIds } }),
    SemesterModel.deleteMany({ _id: { $in: allIds } }),
  ])
}

function demoObjectIds() {
  return Array.from({ length: 1_100 }, (_, index) => objectId(index + 1))
}

async function seedConfigurations() {
  await Promise.all([
    AttendanceConfigurationModel.updateOne(
      { key: ATTENDANCE_CONFIGURATION_KEY },
      { $set: { minimumAttendancePercentage: 75 } },
      { upsert: true }
    ),
    AssessmentConfigurationModel.updateOne(
      { key: ASSESSMENT_CONFIGURATION_KEY },
      {
        $set: {
          categories: [
            { id: 'quiz', weightPercentage: 10 },
            { id: 'assignment', weightPercentage: 10 },
            { id: 'attendance', weightPercentage: 10 },
            { id: 'presentation', weightPercentage: 10 },
            { id: 'midterm', weightPercentage: 25 },
            { id: 'final', weightPercentage: 35 },
          ],
        },
      },
      { upsert: true }
    ),
    GradingConfigurationModel.updateOne(
      { key: GRADING_CONFIGURATION_KEY },
      { $set: { ranges: defaultGradingScale } },
      { upsert: true }
    ),
  ])
}

async function seedAcademicStructure() {
  await DepartmentModel.create([
    {
      _id: ids.departments.cs,
      name: 'Demo Computer Science',
      code: 'DCS',
      description: 'Programming, data, networks, and AI courses.',
      isActive: true,
    },
    {
      _id: ids.departments.se,
      name: 'Demo Software Engineering',
      code: 'DSE',
      description: 'Software design, testing, and project management.',
      isActive: true,
    },
    {
      _id: ids.departments.business,
      name: 'Demo Business Administration',
      code: 'DBA',
      description: 'Accounting, finance, management, and marketing.',
      isActive: true,
    },
    {
      _id: ids.departments.english,
      name: 'Demo English Studies',
      code: 'DEN',
      description: 'Communication, literature, and academic writing.',
      isActive: true,
    },
  ])
  await ProgramModel.create([
    {
      _id: ids.programs.bscs,
      name: 'Demo BS Computer Science',
      code: 'DBSCS',
      department: ids.departments.cs,
      totalSemesters: 8,
      duration: 4,
      durationUnit: 'years',
      isActive: true,
    },
    {
      _id: ids.programs.bsse,
      name: 'Demo BS Software Engineering',
      code: 'DBSSE',
      department: ids.departments.se,
      totalSemesters: 8,
      duration: 4,
      durationUnit: 'years',
      isActive: true,
    },
    {
      _id: ids.programs.bba,
      name: 'Demo BBA',
      code: 'DBBA',
      department: ids.departments.business,
      totalSemesters: 8,
      duration: 4,
      durationUnit: 'years',
      isActive: true,
    },
    {
      _id: ids.programs.bsEnglish,
      name: 'Demo BS English',
      code: 'DBSEN',
      department: ids.departments.english,
      totalSemesters: 8,
      duration: 4,
      durationUnit: 'years',
      isActive: true,
    },
  ])
  await SemesterModel.create([
    {
      _id: ids.semesters.fall2026,
      name: 'Demo Fall 2026',
      academicYear: '2026-2027',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2027-01-15T00:00:00.000Z'),
      isActive: true,
      isClosed: false,
    },
    {
      _id: ids.semesters.spring2027,
      name: 'Demo Spring 2027',
      academicYear: '2026-2027',
      startsAt: new Date('2027-02-01T00:00:00.000Z'),
      endsAt: new Date('2027-06-15T00:00:00.000Z'),
      isActive: false,
      isClosed: false,
    },
    {
      _id: ids.semesters.summer2027,
      name: 'Demo Summer 2027',
      academicYear: '2026-2027',
      startsAt: new Date('2027-07-01T00:00:00.000Z'),
      endsAt: new Date('2027-08-20T00:00:00.000Z'),
      isActive: false,
      isClosed: false,
    },
  ])
  await BatchModel.create([
    {
      _id: ids.batches.bscs2024,
      name: 'Demo BSCS 2024',
      program: ids.programs.bscs,
      startingYear: 2024,
      expectedGraduationYear: 2028,
      isActive: true,
    },
    {
      _id: ids.batches.bscs2025,
      name: 'Demo BSCS 2025',
      program: ids.programs.bscs,
      startingYear: 2025,
      expectedGraduationYear: 2029,
      isActive: true,
    },
    {
      _id: ids.batches.bsse2024,
      name: 'Demo BSSE 2024',
      program: ids.programs.bsse,
      startingYear: 2024,
      expectedGraduationYear: 2028,
      isActive: true,
    },
    {
      _id: ids.batches.bba2025,
      name: 'Demo BBA 2025',
      program: ids.programs.bba,
      startingYear: 2025,
      expectedGraduationYear: 2029,
      isActive: true,
    },
  ])
  await SectionModel.create([
    section(
      ids.sections.bscsA,
      'A',
      ids.programs.bscs,
      ids.batches.bscs2024,
      ids.semesters.fall2026
    ),
    section(
      ids.sections.bscsB,
      'B',
      ids.programs.bscs,
      ids.batches.bscs2025,
      ids.semesters.fall2026
    ),
    section(
      ids.sections.bsseA,
      'A',
      ids.programs.bsse,
      ids.batches.bsse2024,
      ids.semesters.fall2026
    ),
    section(ids.sections.bbaA, 'A', ids.programs.bba, ids.batches.bba2025, ids.semesters.fall2026),
    section(
      ids.sections.bscsNextA,
      'A',
      ids.programs.bscs,
      ids.batches.bscs2024,
      ids.semesters.spring2027
    ),
  ])
}

function section(
  _id: Types.ObjectId,
  name: string,
  program: Types.ObjectId,
  batch: Types.ObjectId,
  semester: Types.ObjectId
) {
  return { _id, name, program, batch, semester, isActive: true }
}

async function seedUsers() {
  const passwordHash = hashPassword(password)
  const staff: DemoUser[] = [
    user(ids.users.admin, 'Sian Demo Admin', 'admin.demo@ncbae.edu.pk', 'admin'),
    user(ids.users.hodCs, 'Dr. Hammad Farooq', 'hod.cs.demo@ncbae.edu.pk', 'hod', {
      employeeId: 'D-HOD-CS-001',
      department: ids.departments.cs,
      designation: 'Head of Department',
    }),
    user(ids.users.hodBusiness, 'Dr. Nadia Iqbal', 'hod.business.demo@ncbae.edu.pk', 'hod', {
      employeeId: 'D-HOD-BA-001',
      department: ids.departments.business,
      designation: 'Academic Coordinator',
    }),
    user(ids.users.teacherAyesha, 'Ayesha Rafiq', 'ayesha.rafiq@ncbae.edu.pk', 'teacher', {
      employeeId: 'D-TCH-CS-001',
      department: ids.departments.cs,
      designation: 'Lecturer',
      profilePictureUrl: 'https://i.pravatar.cc/160?img=47',
    }),
    user(ids.users.teacherBilal, 'Bilal Ahmed', 'bilal.ahmed@ncbae.edu.pk', 'teacher', {
      employeeId: 'D-TCH-CS-002',
      department: ids.departments.cs,
      designation: 'Assistant Professor',
      profilePictureUrl: 'https://i.pravatar.cc/160?img=12',
    }),
    user(ids.users.teacherDanish, 'Danish Malik', 'danish.malik@ncbae.edu.pk', 'teacher', {
      employeeId: 'D-TCH-SE-001',
      department: ids.departments.se,
      designation: 'Senior Lecturer',
      profilePictureUrl: 'https://i.pravatar.cc/160?img=33',
    }),
    user(ids.users.teacherMaria, 'Maria Khan', 'maria.khan@ncbae.edu.pk', 'teacher', {
      employeeId: 'D-TCH-BA-001',
      department: ids.departments.business,
      designation: 'Lecturer',
      profilePictureUrl: 'https://i.pravatar.cc/160?img=44',
    }),
    user(ids.users.teacherSara, 'Sara Javed', 'sara.javed@ncbae.edu.pk', 'teacher', {
      employeeId: 'D-TCH-EN-001',
      department: ids.departments.english,
      designation: 'Lecturer',
      profilePictureUrl: 'https://i.pravatar.cc/160?img=5',
    }),
    user(ids.users.teacherUsman, 'Usman Tariq', 'usman.tariq@ncbae.edu.pk', 'teacher', {
      employeeId: 'D-TCH-CS-003',
      department: ids.departments.cs,
      designation: 'Lab Instructor',
      profilePictureUrl: 'https://i.pravatar.cc/160?img=60',
    }),
  ]
  const students = demoStudents()
  const all = await UserModel.create(
    [...staff, ...students].map((demoUser) => ({
      _id: demoUser.id,
      fullName: demoUser.fullName,
      email: demoUser.email,
      profilePictureUrl: demoUser.profilePictureUrl,
      role: demoUser.role,
      employeeId: demoUser.employeeId,
      registrationNumber: demoUser.registrationNumber,
      department: demoUser.department,
      program: demoUser.program,
      batch: demoUser.batch,
      semester: demoUser.semester,
      section: demoUser.section,
      academicStatus: demoUser.academicStatus,
      designation: demoUser.role === 'teacher' ? demoUser.designation : undefined,
      passwordHash,
      isActive: true,
      mustChangePassword: false,
    }))
  )

  return { all, admin: staff[0]!, students }
}

function user(
  id: Types.ObjectId,
  fullName: string,
  email: string,
  role: UserRole,
  extras: Partial<DemoUser> = {}
): DemoUser {
  return { id, fullName, email, role, ...extras }
}

function demoStudents(): DemoUser[] {
  const names = [
    ['Ali Hassan', 'ali.hassan'],
    ['Fatima Noor', 'fatima.noor'],
    ['Zain Ali', 'zain.ali'],
    ['Maham Sheikh', 'maham.sheikh'],
    ['Hamza Raza', 'hamza.raza'],
    ['Areeba Khan', 'areeba.khan'],
    ['Ahmed Saeed', 'ahmed.saeed'],
    ['Laiba Aslam', 'laiba.aslam'],
    ['Omar Farooq', 'omar.farooq'],
    ['Hira Mahmood', 'hira.mahmood'],
    ['Talha Nadeem', 'talha.nadeem'],
    ['Sana Javed', 'sana.javed'],
    ['Usama Khalid', 'usama.khalid'],
    ['Minal Tariq', 'minal.tariq'],
    ['Saad Qureshi', 'saad.qureshi'],
    ['Iqra Batool', 'iqra.batool'],
    ['Rayyan Abbas', 'rayyan.abbas'],
    ['Noor Ul Ain', 'noor.ain'],
  ] as const
  return names.map(([fullName, emailSlug], index) => {
    const isBscsA = index < 8
    const isBscsB = index >= 8 && index < 12
    const isBsse = index >= 12 && index < 15
    const program = isBsse
      ? ids.programs.bsse
      : isBscsA || isBscsB
        ? ids.programs.bscs
        : ids.programs.bba
    const batch = isBsse
      ? ids.batches.bsse2024
      : isBscsB
        ? ids.batches.bscs2025
        : isBscsA
          ? ids.batches.bscs2024
          : ids.batches.bba2025
    const sectionId = isBsse
      ? ids.sections.bsseA
      : isBscsB
        ? ids.sections.bscsB
        : isBscsA
          ? ids.sections.bscsA
          : ids.sections.bbaA
    const department = isBsse
      ? ids.departments.se
      : isBscsA || isBscsB
        ? ids.departments.cs
        : ids.departments.business

    return user(
      objectId(ids.users.studentStart + index),
      fullName,
      `${emailSlug}@student.ncbae.edu.pk`,
      'student',
      {
        registrationNumber: `NCBAE-${2024 + Math.floor(index / 8)}-${isBsse ? 'SE' : isBscsA || isBscsB ? 'CS' : 'BBA'}-${String(index + 1).padStart(3, '0')}`,
        department,
        program,
        batch,
        semester: ids.semesters.fall2026,
        section: sectionId,
        academicStatus: index === 5 ? 'repeating' : index === 10 ? 'frozen' : 'active',
        profilePictureUrl: `https://i.pravatar.cc/160?img=${20 + index}`,
      }
    )
  })
}

async function seedCoursesAndOfferings({ teacherIds }: { teacherIds: Types.ObjectId[] }) {
  const courses: CourseSeed[] = [
    course(
      0,
      'D-PF101',
      'Programming Fundamentals',
      3,
      'C programming, problem solving, and labs.',
      ids.semesters.fall2026,
      teacherIds[0]!
    ),
    course(
      1,
      'D-DB201',
      'Database Systems',
      3,
      'ER modeling, SQL, transactions, and normalization.',
      ids.semesters.fall2026,
      teacherIds[1]!
    ),
    course(
      2,
      'D-WE301',
      'Web Engineering',
      3,
      'Frontend, backend APIs, sessions, and deployment basics.',
      ids.semesters.fall2026,
      teacherIds[2]!
    ),
    course(
      3,
      'D-AI401',
      'Artificial Intelligence',
      3,
      'Search, knowledge systems, and applied ML concepts.',
      ids.semesters.fall2026,
      teacherIds[1]!
    ),
    course(
      4,
      'D-SE205',
      'Software Requirements Engineering',
      3,
      'Requirements discovery, use cases, and validation.',
      ids.semesters.fall2026,
      teacherIds[2]!
    ),
    course(
      5,
      'D-ACC110',
      'Financial Accounting',
      3,
      'Accounting cycle, journals, ledgers, and reports.',
      ids.semesters.fall2026,
      teacherIds[3]!
    ),
    course(
      6,
      'D-COM101',
      'Business Communication',
      2,
      'Presentations, email writing, and academic communication.',
      ids.semesters.fall2026,
      teacherIds[4]!
    ),
    course(
      7,
      'D-OOP102',
      'Object-Oriented Programming',
      3,
      'Classes, inheritance, interfaces, and design basics.',
      ids.semesters.spring2027,
      teacherIds[5]!
    ),
  ]
  await CourseModel.create(
    courses.map((courseSeed) => ({
      _id: courseSeed.id,
      code: courseSeed.code,
      title: courseSeed.title,
      creditHours: courseSeed.creditHours,
      description: courseSeed.description,
      department: courseSeed.code.includes('ACC') ? ids.departments.business : ids.departments.cs,
      program: courseSeed.code.includes('ACC') ? ids.programs.bba : ids.programs.bscs,
      semester: courseSeed.semester,
      isActive: true,
    }))
  )

  const offerings: OfferingSeed[] = [
    offering(courses[0]!, 0, ids.sections.bscsA),
    offering(courses[1]!, 1, ids.sections.bscsA),
    offering(courses[2]!, 2, ids.sections.bscsA),
    offering(courses[3]!, 3, ids.sections.bscsA),
    offering(courses[0]!, 4, ids.sections.bscsB),
    offering(courses[4]!, 5, ids.sections.bsseA),
    offering(courses[5]!, 6, ids.sections.bbaA),
    offering(courses[6]!, 7, ids.sections.bbaA),
    offering(courses[7]!, 8, ids.sections.bscsNextA),
  ]
  await CourseOfferingModel.create(
    offerings.map((offeringSeed) => ({
      _id: offeringSeed.offeringId,
      course: offeringSeed.id,
      section: offeringSeed.section,
      teacher: offeringSeed.teacher,
      isActive: true,
    }))
  )

  return offerings
}

function course(
  offset: number,
  code: string,
  title: string,
  creditHours: number,
  description: string,
  semester: Types.ObjectId,
  teacher: Types.ObjectId
): CourseSeed {
  return {
    id: objectId(ids.courseStart + offset),
    code,
    title,
    creditHours,
    description,
    semester,
    teacher,
  }
}

function offering(courseSeed: CourseSeed, offset: number, sectionId: Types.ObjectId): OfferingSeed {
  return { ...courseSeed, offeringId: objectId(ids.offeringStart + offset), section: sectionId }
}

async function seedEnrollments(offerings: OfferingSeed[], students: DemoUser[]) {
  const enrollments = offerings.flatMap((offeringSeed) =>
    students
      .filter((student) => student.section?.equals(offeringSeed.section))
      .map((student) => ({
        student: student.id,
        courseOffering: offeringSeed.offeringId,
        section: offeringSeed.section,
        isActive: true,
      }))
  )
  await EnrollmentModel.create(enrollments)
}

async function seedAttendance(offerings: OfferingSeed[], students: DemoUser[]) {
  const statuses: AttendanceStatus[][] = [
    ['present', 'present', 'present', 'absent', 'present', 'leave'],
    ['present', 'absent', 'present', 'present', 'present', 'present'],
    ['absent', 'present', 'present', 'present', 'absent', 'present'],
    ['present', 'present', 'leave', 'present', 'present', 'present'],
  ]
  const sessions = offerings.slice(0, 7).flatMap((offeringSeed, offeringIndex) => {
    const enrolled = students.filter((student) => student.section?.equals(offeringSeed.section))
    return Array.from({ length: 6 }, (_, dayIndex) => {
      const day = 3 + dayIndex
      const dateKey = `2026-09-${String(day).padStart(2, '0')}`
      return {
        courseOffering: offeringSeed.offeringId,
        section: offeringSeed.section,
        teacher: offeringSeed.teacher,
        date: new Date(`${dateKey}T00:00:00.000Z`),
        dateKey,
        records: enrolled.map((student, studentIndex) => ({
          student: student.id,
          status: statuses[(studentIndex + offeringIndex) % statuses.length]![dayIndex % 6]!,
        })),
      }
    })
  })
  await AttendanceSessionModel.create(sessions)
}

async function seedAssessmentsAndResults(offerings: OfferingSeed[], students: DemoUser[]) {
  for (const [index, offeringSeed] of offerings.slice(0, 7).entries()) {
    const enrolled = students.filter((student) => student.section?.equals(offeringSeed.section))
    const status: ResultStatus =
      index % 4 === 0
        ? 'approved'
        : index % 4 === 1
          ? 'pending'
          : index % 4 === 2
            ? 'returned'
            : 'draft'
    await seedOfferingResult({
      offeringSeed,
      students: enrolled,
      resultId: objectId(ids.resultStart + index),
      assessmentStart: ids.assessmentStart + index * 10,
      status,
    })
  }
}

async function seedOfferingResult({
  offeringSeed,
  students,
  resultId,
  assessmentStart,
  status,
}: {
  offeringSeed: OfferingSeed
  students: DemoUser[]
  resultId: Types.ObjectId
  assessmentStart: number
  status: ResultStatus
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
    definitions.map((definition, index) => ({
      _id: objectId(assessmentStart + index),
      courseOffering: offeringSeed.offeringId,
      teacher: offeringSeed.teacher,
      name: definition.name,
      category: definition.category,
      maximumMarks: definition.maximumMarks,
    }))
  )
  await MarkSheetModel.create(
    assessments.map((assessment, assessmentIndex) => ({
      assessment: assessment._id,
      courseOffering: offeringSeed.offeringId,
      teacher: offeringSeed.teacher,
      records: students.map((student, studentIndex) => ({
        student: student.id,
        obtainedMarks: scoreFor(
          definitions[assessmentIndex]!.maximumMarks,
          studentIndex,
          assessmentIndex
        ),
      })),
      isDraft: status === 'draft',
    }))
  )

  const history = resultHistory(status, offeringSeed.teacher)
  await ResultModel.create({
    _id: resultId,
    courseOffering: offeringSeed.offeringId,
    teacher: offeringSeed.teacher,
    status,
    records: students.map((student, studentIndex) => {
      const categories = definitions.map((definition, assessmentIndex) =>
        assessmentCategory(
          definition.category,
          scoreFor(definition.maximumMarks, studentIndex, assessmentIndex),
          definition.maximumMarks,
          definition.weightPercentage
        )
      )
      const finalPercentage = categories.reduce(
        (total, category) => total + category.weightedMarks,
        0
      )
      const { letterGrade, gradePoint } = gradeFor(finalPercentage)
      return { student: student.id, categories, finalPercentage, letterGrade, gradePoint }
    }),
    submittedAt: status === 'draft' ? undefined : new Date('2026-10-10T09:00:00.000Z'),
    hodComment:
      status === 'returned'
        ? 'Please recheck attendance and assignment marks before approval.'
        : undefined,
    returnedAt: status === 'returned' ? new Date('2026-10-11T09:00:00.000Z') : undefined,
    approvedAt: status === 'approved' ? new Date('2026-10-12T09:00:00.000Z') : undefined,
    approvedBy: status === 'approved' ? ids.users.hodCs : undefined,
    history,
  })
}

function scoreFor(maximumMarks: number, studentIndex: number, assessmentIndex: number) {
  const percentage = Math.max(48, Math.min(96, 92 - studentIndex * 3 + assessmentIndex * 2))
  return Math.round((maximumMarks * percentage) / 100)
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

function gradeFor(finalPercentage: number) {
  const range = defaultGradingScale.find(
    (grade) =>
      finalPercentage >= grade.minimumPercentage && finalPercentage <= grade.maximumPercentage
  )
  return {
    letterGrade: range?.letterGrade ?? 'F',
    gradePoint: range?.gradePoint ?? 0,
  }
}

function resultHistory(status: ResultStatus, teacherId: Types.ObjectId): ResultHistoryEntry[] {
  if (status === 'draft') return []
  const submitted = {
    action: 'submitted' as const,
    actor: teacherId,
    occurredAt: new Date('2026-10-10T09:00:00.000Z'),
  }
  if (status === 'pending') return [submitted]
  if (status === 'returned') {
    return [
      submitted,
      {
        action: 'returned',
        actor: ids.users.hodCs,
        comment: 'Please recheck attendance and assignment marks before approval.',
        occurredAt: new Date('2026-10-11T09:00:00.000Z'),
      },
    ]
  }
  return [
    submitted,
    {
      action: 'approved',
      actor: ids.users.hodCs,
      occurredAt: new Date('2026-10-12T09:00:00.000Z'),
    },
  ]
}

async function seedStudentServices({
  offerings,
  users,
}: {
  offerings: OfferingSeed[]
  users: Awaited<ReturnType<typeof seedUsers>>
}) {
  await FeeModel.create(
    users.students.map((student, index) => ({
      _id: objectId(ids.feeStart + index),
      student: student.id,
      semester: ids.semesters.fall2026,
      totalAmount: 118_000 + (index % 3) * 8_000,
      paidAmount: index % 5 === 0 ? 0 : index % 4 === 0 ? 60_000 : 118_000 + (index % 3) * 8_000,
      dueDate: new Date('2026-10-15T00:00:00.000Z'),
      paymentDate: index % 5 === 0 ? undefined : new Date('2026-09-20T00:00:00.000Z'),
      notes: index % 5 === 0 ? 'Pending first installment' : 'Demo fee record',
    }))
  )
  await TimetableModel.insertMany([
    timetable(
      objectId(ids.timetableStart),
      ids.sections.bscsA,
      ids.programs.bscs,
      ids.semesters.fall2026,
      users.admin.id,
      [
        timetableEntry(offerings[0]!, 'monday', '09:00', '10:30', 540, 630, 'CS Lab 1', 'lab'),
        timetableEntry(offerings[1]!, 'tuesday', '11:00', '12:30', 660, 750, 'Room 204', 'lecture'),
        timetableEntry(
          offerings[2]!,
          'wednesday',
          '10:00',
          '11:30',
          600,
          690,
          'Room 205',
          'lecture'
        ),
        timetableEntry(offerings[3]!, 'thursday', '13:00', '14:30', 780, 870, 'AI Lab', 'seminar'),
      ]
    ),
    timetable(
      objectId(ids.timetableStart + 1),
      ids.sections.bscsB,
      ids.programs.bscs,
      ids.semesters.fall2026,
      users.admin.id,
      [timetableEntry(offerings[4]!, 'monday', '11:00', '12:30', 660, 750, 'CS Lab 2', 'lab')]
    ),
    timetable(
      objectId(ids.timetableStart + 2),
      ids.sections.bbaA,
      ids.programs.bba,
      ids.semesters.fall2026,
      users.admin.id,
      [
        timetableEntry(
          offerings[6]!,
          'tuesday',
          '09:00',
          '10:30',
          540,
          630,
          'Business Room 1',
          'lecture'
        ),
        timetableEntry(
          offerings[7]!,
          'wednesday',
          '11:00',
          '12:00',
          660,
          720,
          'Seminar Hall',
          'seminar'
        ),
      ]
    ),
  ])
  await ExamModel.create(
    offerings.slice(0, 7).map((offeringSeed, index) => ({
      _id: objectId(ids.examStart + index),
      examType: index % 2 === 0 ? 'Midterm' : 'Final',
      courseOffering: offeringSeed.offeringId,
      course: offeringSeed.id,
      program: sectionProgram(offeringSeed.section),
      semester: ids.semesters.fall2026,
      section: offeringSeed.section,
      examDate: new Date(`2026-11-${String(15 + index).padStart(2, '0')}T00:00:00.000Z`),
      startTime: '09:00',
      endTime: '11:00',
      startMinutes: 540,
      endMinutes: 660,
      room: index % 2 === 0 ? 'Main Hall' : 'Block B Room 3',
      instructions: 'Bring university ID card and required stationery.',
      createdBy: users.admin.id,
      updatedBy: users.admin.id,
    }))
  )
  await AnnouncementModel.create([
    announcement(
      0,
      'Final term registration open',
      'Students can verify fee status and course enrollment before final term registration.',
      true,
      users.admin.id
    ),
    announcement(
      1,
      'Midterm date sheet published',
      'Midterm exams begin on 15 November 2026. Check the exams screen for room and timing details.',
      false,
      users.admin.id
    ),
    announcement(
      2,
      'Attendance shortage review',
      'Students below the attendance threshold should contact their course teacher before the review meeting.',
      false,
      users.admin.id
    ),
  ])
  await NotificationModel.create([
    ...users.students
      .slice(0, 8)
      .map((student, index) =>
        notification(
          index,
          student.id,
          'course_assigned',
          'Courses assigned',
          'Your Fall 2026 course enrollment is ready.',
          '/courses'
        )
      ),
    notification(
      30,
      users.students[0]!.id,
      'attendance_updated',
      'Attendance updated',
      'Programming Fundamentals attendance is below the threshold.',
      '/attendance'
    ),
    notification(
      31,
      users.students[0]!.id,
      'result_published',
      'Result published',
      'Your approved Programming Fundamentals result is available.',
      '/results'
    ),
    notification(
      32,
      ids.users.teacherBilal,
      'result_returned',
      'Result returned',
      'Database Systems result was returned by the HOD for review.',
      '/results'
    ),
  ])
}

function sectionProgram(sectionId: Types.ObjectId) {
  if (sectionId.equals(ids.sections.bbaA)) return ids.programs.bba
  if (sectionId.equals(ids.sections.bsseA)) return ids.programs.bsse
  return ids.programs.bscs
}

function timetable(
  _id: Types.ObjectId,
  section: Types.ObjectId,
  program: Types.ObjectId,
  semester: Types.ObjectId,
  adminId: Types.ObjectId,
  entries: ReturnType<typeof timetableEntry>[]
) {
  return {
    _id,
    section,
    program,
    semester,
    status: 'published',
    version: 1,
    notes: 'Demo published timetable',
    entries,
    createdBy: adminId,
    updatedBy: adminId,
    publishedBy: adminId,
    publishedAt: new Date('2026-09-05T09:00:00.000Z'),
  }
}

function timetableEntry(
  offeringSeed: OfferingSeed,
  dayOfWeek: TimetableDay,
  startTime: string,
  endTime: string,
  startMinutes: number,
  endMinutes: number,
  room: string,
  slotType: TimetableSlotType
) {
  return {
    courseOffering: offeringSeed.offeringId,
    course: offeringSeed.id,
    teacher: offeringSeed.teacher,
    dayOfWeek,
    startTime,
    endTime,
    startMinutes,
    endMinutes,
    room,
    slotType,
  }
}

function announcement(
  offset: number,
  title: string,
  description: string,
  isPinned: boolean,
  adminId: Types.ObjectId
) {
  return {
    _id: objectId(ids.announcementStart + offset),
    title,
    description,
    publishDate: new Date('2026-09-05T09:00:00.000Z'),
    expiryDate: new Date('2027-01-31T23:59:59.000Z'),
    isPinned,
    isActive: true,
    createdBy: adminId,
  }
}

function notification(
  offset: number,
  recipient: Types.ObjectId,
  type: NotificationType,
  title: string,
  message: string,
  resourcePath: string
) {
  return {
    _id: objectId(ids.notificationStart + offset),
    recipient,
    type,
    notificationKey: `${demoPrefix}:${offset}`,
    title,
    message,
    resourcePath,
  }
}

async function seedAuditLog(adminId: Types.ObjectId) {
  const entries: Array<[AuditAction, AuditModule, Types.ObjectId, string]> = [
    ['created', 'users', ids.users.teacherAyesha, 'Ayesha Rafiq'],
    ['created', 'courses', objectId(ids.courseStart), 'Programming Fundamentals'],
    ['assigned', 'courses', objectId(ids.offeringStart), 'Programming Fundamentals Section A'],
    ['saved', 'attendance', objectId(ids.offeringStart), 'Programming Fundamentals attendance'],
    ['approved', 'results', objectId(ids.resultStart), 'Programming Fundamentals results'],
    ['published', 'timetable', objectId(ids.timetableStart), 'BSCS Section A timetable'],
    ['created', 'announcements', objectId(ids.announcementStart), 'Final term registration open'],
  ]
  await AuditLogModel.insertMany(
    entries.map(([action, module, affectedRecordId, affectedRecordLabel]) => ({
      actorId: adminId,
      actorName: 'Sian Demo Admin',
      actorRole: 'admin',
      action,
      module,
      affectedRecordId: affectedRecordId.toString(),
      affectedRecordLabel,
      reason: 'Seeded for final demo',
    }))
  )
}

void seedDemo()
  .catch((error) => {
    console.error('Failed to seed demo data', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDatabase()
  })
