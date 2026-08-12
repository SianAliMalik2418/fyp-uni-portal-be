import mongoose, { Types } from 'mongoose'
import { connectDatabase, disconnectDatabase } from '../config/db.js'
import {
  ASSESSMENT_CONFIGURATION_KEY,
  AssessmentConfigurationModel,
} from '../models/assessment-configuration.model.js'
import {
  ATTENDANCE_CONFIGURATION_KEY,
  AttendanceConfigurationModel,
} from '../models/attendance-configuration.model.js'
import { AssessmentModel } from '../models/assessment.model.js'
import { AttendanceSessionModel } from '../models/attendance-session.model.js'
import { BatchModel } from '../models/batch.model.js'
import { CourseOfferingModel } from '../models/course-offering.model.js'
import { CourseModel } from '../models/course.model.js'
import { DepartmentModel } from '../models/department.model.js'
import { EnrollmentModel } from '../models/enrollment.model.js'
import { MarkSheetModel } from '../models/mark-sheet.model.js'
import { ProgramModel } from '../models/program.model.js'
import { SectionModel } from '../models/section.model.js'
import { SemesterModel } from '../models/semester.model.js'
import { SessionModel } from '../models/session.model.js'
import { UserModel } from '../models/user.model.js'
import { hashPassword } from '../services/auth.service.js'

const password = 'Password123!'

const ids = {
  department: new Types.ObjectId('66b000000000000000000001'),
  program: new Types.ObjectId('66b000000000000000000002'),
  batch: new Types.ObjectId('66b000000000000000000003'),
  semester: new Types.ObjectId('66b000000000000000000004'),
  section: new Types.ObjectId('66b000000000000000000005'),
  course: new Types.ObjectId('66b000000000000000000006'),
  offering: new Types.ObjectId('66b000000000000000000007'),
  admin: new Types.ObjectId('66b000000000000000000008'),
  hod: new Types.ObjectId('66b000000000000000000009'),
  teacher: new Types.ObjectId('66b00000000000000000000a'),
  student: new Types.ObjectId('66b00000000000000000000b'),
  assessment: new Types.ObjectId('66b00000000000000000000c'),
}

async function seed() {
  await connectDatabase()
  await mongoose.connection.dropDatabase()

  await Promise.all([
    SessionModel.deleteMany({}),
    UserModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
    ProgramModel.deleteMany({}),
    BatchModel.deleteMany({}),
    SemesterModel.deleteMany({}),
    SectionModel.deleteMany({}),
    CourseModel.deleteMany({}),
    CourseOfferingModel.deleteMany({}),
    EnrollmentModel.deleteMany({}),
    AttendanceSessionModel.deleteMany({}),
    AssessmentModel.deleteMany({}),
    MarkSheetModel.deleteMany({}),
    AttendanceConfigurationModel.deleteMany({}),
    AssessmentConfigurationModel.deleteMany({}),
  ])

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

  const passwordHash = hashPassword(password)
  await UserModel.create([
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
  const admin = (await UserModel.findById(ids.admin).orFail().exec())!
  const hod = (await UserModel.findById(ids.hod).orFail().exec())!
  const teacher = (await UserModel.findById(ids.teacher).orFail().exec())!
  const student = (await UserModel.findById(ids.student).orFail().exec())!

  const course = await CourseModel.create({
    _id: ids.course,
    code: 'PF',
    title: 'Programming Fundamentals',
    creditHours: 3,
    department: department._id,
    program: program._id,
    semester: semester._id,
    description: 'Introductory programming course',
    isActive: true,
  })

  const offering = await CourseOfferingModel.create({
    _id: ids.offering,
    course: course._id,
    section: section._id,
    teacher: teacher._id,
    isActive: true,
  })

  await EnrollmentModel.create({
    student: student._id,
    courseOffering: offering._id,
    section: section._id,
    isActive: true,
  })

  await AttendanceConfigurationModel.create({
    key: ATTENDANCE_CONFIGURATION_KEY,
    minimumAttendancePercentage: 75,
  })

  await AttendanceSessionModel.create([
    {
      courseOffering: offering._id,
      section: section._id,
      teacher: teacher._id,
      date: new Date('2026-08-03T00:00:00.000Z'),
      dateKey: '2026-08-03',
      records: [{ student: student._id, status: 'present' }],
    },
    {
      courseOffering: offering._id,
      section: section._id,
      teacher: teacher._id,
      date: new Date('2026-08-04T00:00:00.000Z'),
      dateKey: '2026-08-04',
      records: [{ student: student._id, status: 'present' }],
    },
    {
      courseOffering: offering._id,
      section: section._id,
      teacher: teacher._id,
      date: new Date('2026-08-05T00:00:00.000Z'),
      dateKey: '2026-08-05',
      records: [{ student: student._id, status: 'absent' }],
    },
    {
      courseOffering: offering._id,
      section: section._id,
      teacher: teacher._id,
      date: new Date('2026-08-06T00:00:00.000Z'),
      dateKey: '2026-08-06',
      records: [{ student: student._id, status: 'absent' }],
    },
  ])

  await AssessmentConfigurationModel.create({
    key: ASSESSMENT_CONFIGURATION_KEY,
    categories: [
      { id: 'quiz', weightPercentage: 10 },
      { id: 'assignment', weightPercentage: 10 },
      { id: 'attendance', weightPercentage: 10 },
      { id: 'presentation', weightPercentage: 10 },
      { id: 'midterm', weightPercentage: 25 },
      { id: 'final', weightPercentage: 35 },
    ],
  })

  const assessment = await AssessmentModel.create({
    _id: ids.assessment,
    courseOffering: offering._id,
    teacher: teacher._id,
    name: 'Quiz 1',
    category: 'quiz',
    maximumMarks: 10,
  })

  await MarkSheetModel.create({
    assessment: assessment._id,
    courseOffering: offering._id,
    teacher: teacher._id,
    records: [{ student: student._id, obtainedMarks: 8 }],
    isDraft: false,
  })

  console.log(
    JSON.stringify({
      database: mongoose.connection.name,
      password,
      users: {
        admin: admin.email,
        hod: hod.email,
        teacher: teacher.email,
        student: student.email,
      },
    })
  )
}

void seed()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDatabase()
  })
