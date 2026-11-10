/**
 * Seeds a complete, realistic university: departments, programs, batches, terms, sections,
 * staff, students, courses, teachers, enrollments, timetables, attendance, marks, results,
 * fees, exams, announcements, notifications and an audit trail.
 *
 * Safe by design:
 * - Everything it creates lives in its own ObjectId range, so it never edits or deletes
 *   records that were not created by this script.
 * - It refuses to run if a name, code or email it needs already belongs to someone else.
 * - Run again with --reset to rebuild only its own records.
 *
 * Usage: bun run seed:university [--check] [--reset]
 *   --check  verify there are no conflicts and stop without writing anything
 */
import mongoose, { Types } from 'mongoose'
import { connectDatabase, disconnectDatabase } from '../config/db.js'
import { AnnouncementModel } from '../models/announcement.model.js'
import { AssessmentModel, type AssessmentCategory } from '../models/assessment.model.js'
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
import { MarkSheetModel } from '../models/mark-sheet.model.js'
import { NotificationModel, type NotificationType } from '../models/notification.model.js'
import { ProgramModel } from '../models/program.model.js'
import { ResultModel, type ResultHistoryEntry, type ResultStatus } from '../models/result.model.js'
import { SectionModel } from '../models/section.model.js'
import { SemesterModel } from '../models/semester.model.js'
import { TimetableModel, type TimetableDay } from '../models/timetable.model.js'
import { UserModel } from '../models/user.model.js'
import { hashPassword } from '../services/auth.service.js'
import { defaultGradingScale } from '../services/grading-scale.service.js'

const PASSWORD = 'myteka500'
const STAFF_DOMAIN = 'uni-portal.example'
const STUDENT_DOMAIN = 'student.uni-portal.example'

// ---------------------------------------------------------------------------------------------
// Deterministic ids: 66e2 | namespace (1 byte) | counter. Each collection owns one namespace, so
// the script can find and replace exactly its own records.
// ---------------------------------------------------------------------------------------------
const NS = {
  department: 1,
  program: 2,
  batch: 3,
  semester: 4,
  section: 5,
  user: 6,
  course: 7,
  offering: 8,
  enrollment: 9,
  attendance: 10,
  assessment: 11,
  markSheet: 12,
  result: 13,
  fee: 14,
  timetable: 15,
  exam: 16,
  announcement: 17,
  notification: 18,
  audit: 19,
} as const

function id(namespace: number, counter: number) {
  return new Types.ObjectId(
    `66e2${namespace.toString(16).padStart(2, '0')}${counter.toString(16).padStart(18, '0')}`
  )
}

function counter(namespace: number) {
  let next = 1
  return () => id(namespace, next++)
}

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = mulberry32(20261110)
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

// ---------------------------------------------------------------------------------------------
// Academic structure
// ---------------------------------------------------------------------------------------------
const departmentSeeds = [
  {
    key: 'se',
    name: 'Software Engineering',
    code: 'SE',
    description: 'Design, construction and maintenance of large software systems.',
  },
  {
    key: 'ai',
    name: 'Artificial Intelligence',
    code: 'AI',
    description: 'Machine learning, data science and intelligent systems.',
  },
  {
    key: 'ee',
    name: 'Electrical Engineering',
    code: 'EE',
    description: 'Circuits, power, control and communication systems.',
  },
  {
    key: 'mgt',
    name: 'Management Sciences',
    code: 'MGT',
    description: 'Business, accounting, finance and management studies.',
  },
  {
    key: 'math',
    name: 'Mathematics',
    code: 'MATH',
    description: 'Pure and applied mathematics and statistics.',
  },
  {
    key: 'phy',
    name: 'Physics',
    code: 'PHY',
    description: 'Classical and modern physics with laboratory training.',
  },
] as const

type DepartmentKey = (typeof departmentSeeds)[number]['key']

const programSeeds = [
  {
    key: 'bsse',
    code: 'BSSE',
    name: 'BS Software Engineering',
    dept: 'se',
    semesters: 8,
    years: 4,
    prefix: 'SE',
    fee: 145_000,
  },
  {
    key: 'msse',
    code: 'MSSE',
    name: 'MS Software Engineering',
    dept: 'se',
    semesters: 4,
    years: 2,
    prefix: 'MSE',
    fee: 165_000,
  },
  {
    key: 'bsai',
    code: 'BSAI',
    name: 'BS Artificial Intelligence',
    dept: 'ai',
    semesters: 8,
    years: 4,
    prefix: 'AI',
    fee: 150_000,
  },
  {
    key: 'bsds',
    code: 'BSDS',
    name: 'BS Data Science',
    dept: 'ai',
    semesters: 8,
    years: 4,
    prefix: 'DS',
    fee: 148_000,
  },
  {
    key: 'bsee',
    code: 'BSEE',
    name: 'BS Electrical Engineering',
    dept: 'ee',
    semesters: 8,
    years: 4,
    prefix: 'EE',
    fee: 140_000,
  },
  {
    key: 'bba',
    code: 'BBA',
    name: 'Bachelor of Business Administration',
    dept: 'mgt',
    semesters: 8,
    years: 4,
    prefix: 'BBA',
    fee: 120_000,
  },
  {
    key: 'bsaf',
    code: 'BSAF',
    name: 'BS Accounting and Finance',
    dept: 'mgt',
    semesters: 8,
    years: 4,
    prefix: 'AF',
    fee: 118_000,
  },
  {
    key: 'mba',
    code: 'MBA',
    name: 'Master of Business Administration',
    dept: 'mgt',
    semesters: 4,
    years: 2,
    prefix: 'MBA',
    fee: 170_000,
  },
  {
    key: 'bsmath',
    code: 'BSMATH',
    name: 'BS Mathematics',
    dept: 'math',
    semesters: 8,
    years: 4,
    prefix: 'MTH',
    fee: 90_000,
  },
  {
    key: 'bsphy',
    code: 'BSPHY',
    name: 'BS Physics',
    dept: 'phy',
    semesters: 8,
    years: 4,
    prefix: 'PHY',
    fee: 92_000,
  },
] as const

type ProgramKey = (typeof programSeeds)[number]['key']

// Five courses per program stage (a stage is the program semester number, 1 to 8).
const curriculum: Record<ProgramKey, Partial<Record<number, string[]>>> = {
  bsse: {
    2: [
      'Object-Oriented Programming',
      'Discrete Mathematics',
      'Digital Logic Design',
      'Calculus and Analytic Geometry',
      'Functional English',
    ],
    3: [
      'Data Structures and Algorithms',
      'Database Systems',
      'Software Requirements Engineering',
      'Linear Algebra',
      'Islamic Studies',
    ],
    6: [
      'Software Design and Architecture',
      'Web Engineering',
      'Software Quality Assurance',
      'Computer Networks',
      'Technical and Business Writing',
    ],
    7: [
      'Software Project Management',
      'Mobile Application Development',
      'Information Security',
      'Cloud Computing',
      'Final Year Project I',
    ],
  },
  msse: {
    2: [
      'Advanced Software Engineering',
      'Research Methodology',
      'Software Metrics and Estimation',
      'Formal Methods',
      'Advanced Databases',
    ],
    3: [
      'Software Process Improvement',
      'Distributed Systems',
      'Machine Learning for Software Engineering',
      'DevOps and Continuous Delivery',
      'Thesis Seminar',
    ],
  },
  bsai: {
    2: [
      'Programming Fundamentals II',
      'Discrete Structures',
      'Probability and Statistics',
      'Calculus II',
      'Pakistan Studies',
    ],
    3: [
      'Data Structures',
      'Linear Algebra for AI',
      'Introduction to Artificial Intelligence',
      'Database Systems',
      'Islamic Studies',
    ],
    4: [
      'Algorithm Design and Analysis',
      'Machine Learning Fundamentals',
      'Operating Systems',
      'Numerical Computing',
      'Technical Writing',
    ],
    5: [
      'Deep Learning',
      'Natural Language Processing',
      'Computer Vision',
      'Computer Networks',
      'Knowledge Representation and Reasoning',
    ],
  },
  bsds: {
    4: [
      'Statistical Inference',
      'Data Mining',
      'Data Visualization',
      'Big Data Analytics',
      'Operating Systems',
    ],
    5: [
      'Predictive Modeling',
      'Time Series Analysis',
      'Machine Learning',
      'Cloud Computing for Data Science',
      'Data Ethics and Privacy',
    ],
  },
  bsee: {
    2: [
      'Circuit Analysis',
      'Applied Physics',
      'Calculus II',
      'Programming for Engineers',
      'Engineering Drawing',
    ],
    3: [
      'Electronic Devices and Circuits',
      'Signals and Systems',
      'Linear Algebra',
      'Differential Equations',
      'Electrical Network Analysis Lab',
    ],
    4: [
      'Analog Electronics',
      'Digital Logic Design',
      'Electromagnetic Field Theory',
      'Probability and Random Processes',
      'Communication Skills',
    ],
    5: [
      'Digital Signal Processing',
      'Control Systems',
      'Microprocessor Systems',
      'Power Systems I',
      'Electrical Machines',
    ],
  },
  bba: {
    2: [
      'Principles of Management',
      'Financial Accounting',
      'Microeconomics',
      'Business Mathematics',
      'English Composition',
    ],
    3: [
      'Principles of Marketing',
      'Cost Accounting',
      'Macroeconomics',
      'Business Statistics',
      'Pakistan Studies',
    ],
    4: [
      'Organizational Behavior',
      'Corporate Finance',
      'Business Communication',
      'Marketing Research',
      'Islamic Studies',
    ],
    5: [
      'Human Resource Management',
      'Operations Management',
      'Business Law',
      'Management Information Systems',
      'Entrepreneurship',
    ],
  },
  bsaf: {
    2: [
      'Financial Accounting II',
      'Business Finance',
      'Microeconomics',
      'Business Mathematics',
      'Functional English',
    ],
    3: [
      'Intermediate Accounting',
      'Cost and Management Accounting',
      'Macroeconomics',
      'Business Statistics',
      'Islamic Studies',
    ],
  },
  mba: {
    2: [
      'Managerial Economics',
      'Financial Management',
      'Marketing Management',
      'Operations and Supply Chain',
      'Research Methods',
    ],
    3: [
      'Strategic Management',
      'Business Analytics',
      'International Business',
      'Leadership and Change',
      'MBA Capstone Project',
    ],
  },
  bsmath: {
    4: [
      'Real Analysis I',
      'Abstract Algebra I',
      'Ordinary Differential Equations',
      'Numerical Analysis',
      'Probability Theory',
    ],
    5: [
      'Real Analysis II',
      'Complex Analysis',
      'Partial Differential Equations',
      'Mathematical Statistics',
      'Topology',
    ],
  },
  bsphy: {
    2: [
      'Mechanics',
      'Calculus II',
      'Waves and Oscillations',
      'Physics Lab I',
      'Functional English',
    ],
    3: [
      'Electricity and Magnetism',
      'Mathematical Methods of Physics I',
      'Thermal Physics',
      'Physics Lab II',
      'Islamic Studies',
    ],
  },
}

// One cohort is one batch in one section. `stage` is the program semester it is in during Fall 2026.
const cohortSeeds = [
  { program: 'bsse', year: 2023, stage: 7, size: 12 },
  { program: 'bsse', year: 2025, stage: 3, size: 12 },
  { program: 'msse', year: 2025, stage: 3, size: 10 },
  { program: 'bsai', year: 2024, stage: 5, size: 12 },
  { program: 'bsai', year: 2025, stage: 3, size: 12 },
  { program: 'bsds', year: 2024, stage: 5, size: 12 },
  { program: 'bsee', year: 2024, stage: 5, size: 12 },
  { program: 'bsee', year: 2025, stage: 3, size: 12 },
  { program: 'bba', year: 2024, stage: 5, size: 13 },
  { program: 'bba', year: 2025, stage: 3, size: 13 },
  { program: 'bsaf', year: 2025, stage: 3, size: 12 },
  { program: 'mba', year: 2025, stage: 3, size: 10 },
  { program: 'bsmath', year: 2024, stage: 5, size: 10 },
  { program: 'bsphy', year: 2025, stage: 3, size: 10 },
] as const satisfies ReadonlyArray<{
  program: ProgramKey
  year: number
  stage: number
  size: number
}>

const semesterSeeds = [
  {
    key: 'fall2025',
    name: 'Fall 2025',
    academicYear: '2025-2026',
    startsAt: '2025-09-01',
    endsAt: '2026-01-15',
    isActive: false,
    isClosed: true,
  },
  {
    key: 'spring2026',
    name: 'Spring 2026',
    academicYear: '2025-2026',
    startsAt: '2026-02-01',
    endsAt: '2026-06-15',
    isActive: false,
    isClosed: true,
  },
  {
    key: 'fall2026',
    name: 'Fall 2026',
    academicYear: '2026-2027',
    startsAt: '2026-09-01',
    endsAt: '2027-01-15',
    isActive: true,
    isClosed: false,
  },
  {
    key: 'spring2027',
    name: 'Spring 2027',
    academicYear: '2026-2027',
    startsAt: '2027-02-01',
    endsAt: '2027-06-15',
    isActive: false,
    isClosed: false,
  },
] as const

// ---------------------------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------------------------
const maleNames = [
  'Ali',
  'Ahmed',
  'Hamza',
  'Bilal',
  'Usman',
  'Hassan',
  'Zain',
  'Faisal',
  'Saad',
  'Talha',
  'Omar',
  'Danish',
  'Imran',
  'Kamran',
  'Rayyan',
  'Shahzaib',
  'Waqas',
  'Yasir',
  'Arslan',
  'Junaid',
]
const femaleNames = [
  'Ayesha',
  'Fatima',
  'Areeba',
  'Hira',
  'Laiba',
  'Maham',
  'Noor',
  'Sana',
  'Iqra',
  'Minal',
  'Zainab',
  'Mehwish',
  'Rabia',
  'Sidra',
  'Anum',
  'Komal',
  'Maria',
  'Hafsa',
  'Kiran',
  'Nimra',
]
const lastNames = [
  'Khan',
  'Ahmed',
  'Malik',
  'Hussain',
  'Raza',
  'Sheikh',
  'Qureshi',
  'Siddiqui',
  'Mirza',
  'Butt',
  'Chaudhry',
  'Farooq',
  'Javed',
  'Nadeem',
  'Saeed',
  'Aslam',
  'Tariq',
  'Iqbal',
  'Abbas',
  'Mahmood',
  'Rauf',
  'Anwar',
  'Baig',
  'Gill',
  'Rana',
  'Zafar',
  'Latif',
  'Haider',
  'Akhtar',
  'Bukhari',
]

const staffSeeds: Array<{
  name: string
  dept: DepartmentKey
  role: 'hod' | 'teacher'
  designation: string
}> = [
  { name: 'Dr. Tariq Mehmood', dept: 'se', role: 'hod', designation: 'Professor' },
  { name: 'Dr. Ayesha Siddiqui', dept: 'se', role: 'teacher', designation: 'Associate Professor' },
  { name: 'Usman Ghani', dept: 'se', role: 'teacher', designation: 'Assistant Professor' },
  { name: 'Sadia Parveen', dept: 'se', role: 'teacher', designation: 'Lecturer' },
  { name: 'Hamid Raza', dept: 'se', role: 'teacher', designation: 'Lecturer' },
  { name: 'Dr. Farhan Qadir', dept: 'ai', role: 'hod', designation: 'Professor' },
  { name: 'Dr. Nadia Hussain', dept: 'ai', role: 'teacher', designation: 'Associate Professor' },
  { name: 'Bilal Haider', dept: 'ai', role: 'teacher', designation: 'Assistant Professor' },
  { name: 'Mehwish Anwar', dept: 'ai', role: 'teacher', designation: 'Lecturer' },
  { name: 'Shahid Latif', dept: 'ai', role: 'teacher', designation: 'Lecturer' },
  { name: 'Dr. Imran Zafar', dept: 'ee', role: 'hod', designation: 'Professor' },
  { name: 'Engr. Rubina Kausar', dept: 'ee', role: 'teacher', designation: 'Assistant Professor' },
  { name: 'Engr. Waqar Younas', dept: 'ee', role: 'teacher', designation: 'Lecturer' },
  { name: 'Dr. Salman Abbasi', dept: 'ee', role: 'teacher', designation: 'Associate Professor' },
  { name: 'Dr. Shaista Noreen', dept: 'mgt', role: 'hod', designation: 'Professor' },
  { name: 'Kashif Mahmood', dept: 'mgt', role: 'teacher', designation: 'Assistant Professor' },
  { name: 'Rabia Aslam', dept: 'mgt', role: 'teacher', designation: 'Lecturer' },
  { name: 'Dr. Adnan Baig', dept: 'mgt', role: 'teacher', designation: 'Associate Professor' },
  { name: 'Saima Rauf', dept: 'mgt', role: 'teacher', designation: 'Lecturer' },
  { name: 'Naveed Akhtar', dept: 'mgt', role: 'teacher', designation: 'Lecturer' },
  { name: 'Dr. Rashid Minhas', dept: 'math', role: 'hod', designation: 'Professor' },
  { name: 'Dr. Zubair Anjum', dept: 'math', role: 'teacher', designation: 'Associate Professor' },
  { name: 'Hina Shahid', dept: 'math', role: 'teacher', designation: 'Lecturer' },
  { name: 'Dr. Khalid Pervez', dept: 'phy', role: 'hod', designation: 'Professor' },
  { name: 'Dr. Samina Gul', dept: 'phy', role: 'teacher', designation: 'Assistant Professor' },
  { name: 'Irfan Bukhari', dept: 'phy', role: 'teacher', designation: 'Lecturer' },
]

// ---------------------------------------------------------------------------------------------
// Schedule shape
// ---------------------------------------------------------------------------------------------
const days: TimetableDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const slots = [
  { start: '09:00', end: '10:30', startMinutes: 540, endMinutes: 630 },
  { start: '10:30', end: '12:00', startMinutes: 630, endMinutes: 720 },
  { start: '13:00', end: '14:30', startMinutes: 780, endMinutes: 870 },
  { start: '14:30', end: '16:00', startMinutes: 870, endMinutes: 960 },
]

const assessmentDefinitions = [
  { name: 'Quiz 1', category: 'quiz', maximumMarks: 10, weight: 10 },
  { name: 'Assignment 1', category: 'assignment', maximumMarks: 20, weight: 10 },
  { name: 'Attendance', category: 'attendance', maximumMarks: 10, weight: 10 },
  { name: 'Presentation', category: 'presentation', maximumMarks: 10, weight: 10 },
  { name: 'Midterm', category: 'midterm', maximumMarks: 50, weight: 25 },
  { name: 'Final', category: 'final', maximumMarks: 100, weight: 35 },
] as const satisfies ReadonlyArray<{
  name: string
  category: AssessmentCategory
  maximumMarks: number
  weight: number
}>

const BASE_ASSESSMENTS = [0, 1, 4] // Quiz 1, Assignment 1 and Midterm have happened by 10 Nov 2026.

// ---------------------------------------------------------------------------------------------
// Generated model
// ---------------------------------------------------------------------------------------------
type Staff = { id: Types.ObjectId; name: string; dept: DepartmentKey; role: 'hod' | 'teacher' }
type Student = {
  id: Types.ObjectId
  name: string
  email: string
  registrationNumber: string
  program: ProgramKey
  ability: number
  attendanceRate: number
  cohort: number
  number: number
}
type OfferingSeed = {
  id: Types.ObjectId
  term: 'current' | 'past'
  cohort: number
  courseId: Types.ObjectId
  courseTitle: string
  courseCode: string
  creditHours: number
  teacher: Staff
  section: Types.ObjectId
  program: ProgramKey
  dept: DepartmentKey
  index: number
}

function creditHoursFor(title: string) {
  return /\bLab( I+)?$/.test(title) ? 1 : 3
}

function weekdayOffset(day: TimetableDay) {
  return days.indexOf(day)
}

function isoDate(base: string, offsetDays: number) {
  const date = new Date(`${base}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function gradeFor(finalPercentage: number) {
  const range = defaultGradingScale.find(
    (grade) =>
      finalPercentage >= grade.minimumPercentage && finalPercentage <= grade.maximumPercentage
  )
  return { letterGrade: range?.letterGrade ?? 'F', gradePoint: range?.gradePoint ?? 0 }
}

function scoreFor(maximumMarks: number, ability: number) {
  const percentage = clamp(ability + (random() * 20 - 10), 35, 100)
  return Math.round((maximumMarks * percentage) / 100)
}

function resultHistory(
  status: ResultStatus,
  teacher: Types.ObjectId,
  hod: Types.ObjectId,
  submittedAt: Date,
  decidedAt: Date,
  comment?: string
): ResultHistoryEntry[] {
  if (status === 'draft') return []
  const submitted = { action: 'submitted' as const, actor: teacher, occurredAt: submittedAt }
  if (status === 'pending') return [submitted]
  if (status === 'returned') {
    return [submitted, { action: 'returned', actor: hod, comment, occurredAt: decidedAt }]
  }
  return [submitted, { action: 'approved', actor: hod, occurredAt: decidedAt }]
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------
async function seedUniversity() {
  const reset = process.argv.includes('--reset')
  await connectDatabase()

  type Deletable = { deleteMany(filter: object): { exec(): Promise<{ deletedCount: number }> } }
  const namespaces: Array<[string, Deletable, number]> = [
    ['departments', DepartmentModel, NS.department],
    ['programs', ProgramModel, NS.program],
    ['batches', BatchModel, NS.batch],
    ['semesters', SemesterModel, NS.semester],
    ['sections', SectionModel, NS.section],
    ['users', UserModel, NS.user],
    ['courses', CourseModel, NS.course],
    ['offerings', CourseOfferingModel, NS.offering],
    ['enrollments', EnrollmentModel, NS.enrollment],
    ['attendance sessions', AttendanceSessionModel, NS.attendance],
    ['assessments', AssessmentModel, NS.assessment],
    ['mark sheets', MarkSheetModel, NS.markSheet],
    ['results', ResultModel, NS.result],
    ['fees', FeeModel, NS.fee],
    ['timetables', TimetableModel, NS.timetable],
    ['exams', ExamModel, NS.exam],
    ['announcements', AnnouncementModel, NS.announcement],
    ['notifications', NotificationModel, NS.notification],
    ['audit logs', AuditLogModel, NS.audit],
  ]
  const inRange = (namespace: number) => ({ $gte: id(namespace, 0), $lt: id(namespace + 1, 0) })

  const alreadySeeded = await DepartmentModel.countDocuments({ _id: inRange(NS.department) })
  if (alreadySeeded && !reset) {
    throw new Error('University data is already seeded. Run with --reset to rebuild it.')
  }
  if (reset) {
    // Children first, so nothing is ever left pointing at a deleted parent.
    for (const [label, model, namespace] of [...namespaces].reverse()) {
      const { deletedCount } = await model.deleteMany({ _id: inRange(namespace) }).exec()
      console.log(`reset: removed ${deletedCount} ${label}`)
    }
  }

  // --- build the in-memory model -------------------------------------------------------------
  const departmentId = new Map<DepartmentKey, Types.ObjectId>()
  const nextDepartment = counter(NS.department)
  for (const seed of departmentSeeds) departmentId.set(seed.key, nextDepartment())

  const programId = new Map<ProgramKey, Types.ObjectId>()
  const nextProgram = counter(NS.program)
  for (const seed of programSeeds) programId.set(seed.key, nextProgram())
  const programSeed = new Map(programSeeds.map((seed) => [seed.key, seed]))

  // If the university already runs a "Fall Semester 2026-2027" term (the demo logins use it),
  // attach the new data to that term instead of creating a second one, so every login lands in
  // the one active term the app expects.
  const existingCurrentTerm = await SemesterModel.findOne({
    name: 'Fall Semester',
    academicYear: '2026-2027',
    _id: { $not: inRange(NS.semester) },
  })
    .select('_id name academicYear')
    .lean()
  const semesterId = new Map<string, Types.ObjectId>()
  const nextSemester = counter(NS.semester)
  for (const seed of semesterSeeds) {
    const reusedId = seed.key === 'fall2026' ? existingCurrentTerm?._id : undefined
    semesterId.set(seed.key, reusedId ?? nextSemester())
    if (reusedId) nextSemester()
  }
  const currentTerm = semesterId.get('fall2026')!
  const pastTerm = semesterId.get('spring2026')!

  const nextBatch = counter(NS.batch)
  const batchId = new Map<string, Types.ObjectId>()
  const batchSeeds: Array<{ program: ProgramKey; year: number }> = []
  for (const cohort of cohortSeeds) {
    const key = `${cohort.program}-${cohort.year}`
    if (!batchId.has(key)) {
      batchId.set(key, nextBatch())
      batchSeeds.push({ program: cohort.program, year: cohort.year })
    }
  }

  const nextSection = counter(NS.section)
  const sectionIds = cohortSeeds.map(() => ({ current: nextSection(), past: nextSection() }))

  // staff
  const nextUser = counter(NS.user)
  const adminId = nextUser()
  const staff: Staff[] = staffSeeds.map((seed) => ({
    id: nextUser(),
    name: seed.name,
    dept: seed.dept,
    role: seed.role,
  }))
  const hodOf = new Map<DepartmentKey, Staff>(
    staff.filter((member) => member.role === 'hod').map((member) => [member.dept, member])
  )
  const teachersOf = new Map<DepartmentKey, Staff[]>()
  for (const member of staff.filter((entry) => entry.role === 'teacher')) {
    teachersOf.set(member.dept, [...(teachersOf.get(member.dept) ?? []), member])
  }

  // students
  const students: Student[] = []
  const usedEmails = new Set<string>()
  cohortSeeds.forEach((cohort, cohortIndex) => {
    for (let number = 1; number <= cohort.size; number++) {
      const global = students.length
      const female = global % 2 === 0
      const first = (female ? femaleNames : maleNames)[(global * 3 + cohortIndex) % 20]!
      const last = lastNames[(global * 7 + Math.floor(global / 20) * 5) % lastNames.length]!
      let handle = `${first}.${last}`.toLowerCase()
      let suffix = 1
      while (usedEmails.has(handle)) handle = `${first}.${last}${++suffix}`.toLowerCase()
      usedEmails.add(handle)
      const code = programSeed.get(cohort.program)!.code
      students.push({
        id: nextUser(),
        name: `${first} ${last}`,
        email: `${handle}@${STUDENT_DOMAIN}`,
        registrationNumber: `${String(cohort.year).slice(2)}-${code}-${String(number).padStart(3, '0')}`,
        program: cohort.program,
        ability: clamp(Math.round(54 + random() * 42), 52, 96),
        attendanceRate: clamp(0.62 + random() * 0.37, 0.6, 0.99),
        cohort: cohortIndex,
        number,
      })
    }
  })

  // courses and offerings, both for the current and the previous term
  const nextCourse = counter(NS.course)
  const nextOffering = counter(NS.offering)
  const courses: Array<Record<string, unknown>> = []
  const offerings: OfferingSeed[] = []
  const teacherCursor = new Map<DepartmentKey, number>()
  const usedCodes = new Set<string>()

  cohortSeeds.forEach((cohort, cohortIndex) => {
    const program = programSeed.get(cohort.program)!
    for (const term of ['past', 'current'] as const) {
      const stage = term === 'current' ? cohort.stage : cohort.stage - 1
      const titles = curriculum[cohort.program][stage]
      if (!titles) throw new Error(`Missing curriculum for ${cohort.program} stage ${stage}`)
      titles.forEach((title, index) => {
        let code = `${program.prefix}-${stage}${String(index + 1).padStart(2, '0')}`
        if (usedCodes.has(code)) code = `${code}-${cohort.year}`
        usedCodes.add(code)
        const courseId = nextCourse()
        const credit = creditHoursFor(title)
        courses.push({
          _id: courseId,
          code,
          title,
          creditHours: credit,
          department: departmentId.get(program.dept),
          program: programId.get(cohort.program),
          semester: term === 'current' ? currentTerm : pastTerm,
          description: `${title} for ${program.name}, semester ${stage}.`,
          isActive: true,
        })
        const pool = teachersOf.get(program.dept)!
        const cursor = teacherCursor.get(program.dept) ?? 0
        teacherCursor.set(program.dept, cursor + 1)
        offerings.push({
          id: nextOffering(),
          term,
          cohort: cohortIndex,
          courseId,
          courseTitle: title,
          courseCode: code,
          creditHours: credit,
          teacher: pool[cursor % pool.length]!,
          section:
            term === 'current' ? sectionIds[cohortIndex]!.current : sectionIds[cohortIndex]!.past,
          program: cohort.program,
          dept: program.dept,
          index,
        })
      })
    }
  })

  // --- refuse to run over somebody else's data -------------------------------------------------
  const conflicts: string[] = []
  const mine = (namespace: number) => ({ $not: inRange(namespace) })
  const [deptClash, programClash, courseClash, userClash, semesterClash] = await Promise.all([
    DepartmentModel.find({
      _id: mine(NS.department),
      $or: [
        { name: { $in: departmentSeeds.map((d) => d.name) } },
        { code: { $in: departmentSeeds.map((d) => d.code) } },
      ],
    })
      .select('name code')
      .lean(),
    ProgramModel.find({ _id: mine(NS.program), code: { $in: programSeeds.map((p) => p.code) } })
      .select('code')
      .lean(),
    CourseModel.find({ _id: mine(NS.course), code: { $in: courses.map((c) => c.code as string) } })
      .select('code')
      .lean(),
    UserModel.find({
      _id: mine(NS.user),
      $or: [
        {
          email: {
            $in: [
              ...staffSeeds.map((s) => `${slug(s.name)}@${STAFF_DOMAIN}`),
              ...students.map((s) => s.email),
              `registrar@${STAFF_DOMAIN}`,
            ],
          },
        },
        { registrationNumber: { $in: students.map((s) => s.registrationNumber) } },
      ],
    })
      .select('email')
      .lean(),
    SemesterModel.find({
      _id: mine(NS.semester),
      $or: semesterSeeds.map((s) => ({ name: s.name, academicYear: s.academicYear })),
    })
      .select('name academicYear')
      .lean(),
  ])
  for (const row of deptClash) conflicts.push(`department ${row.code} (${row.name})`)
  for (const row of programClash) conflicts.push(`program ${row.code}`)
  for (const row of courseClash) conflicts.push(`course ${row.code}`)
  for (const row of userClash) conflicts.push(`user ${row.email}`)
  for (const row of semesterClash) conflicts.push(`semester ${row.name} ${row.academicYear}`)
  if (conflicts.length) {
    throw new Error(
      `These already exist and belong to other data, so nothing was written:\n  ${conflicts.join('\n  ')}`
    )
  }

  if (process.argv.includes('--check')) {
    console.log('Check passed: no conflicts with existing data. Nothing was written.')
    return
  }

  // --- write ---------------------------------------------------------------------------------
  const passwordHash = hashPassword(PASSWORD)
  const now = new Date()

  await SemesterModel.insertMany(
    semesterSeeds
      .filter((seed) => !(seed.key === 'fall2026' && existingCurrentTerm))
      .map((seed) => ({
        _id: semesterId.get(seed.key),
        name: seed.name,
        academicYear: seed.academicYear,
        startsAt: new Date(`${seed.startsAt}T00:00:00.000Z`),
        endsAt: new Date(`${seed.endsAt}T00:00:00.000Z`),
        isActive: seed.isActive,
        isClosed: seed.isClosed,
        ...(seed.isClosed ? { closedAt: new Date(`${seed.endsAt}T12:00:00.000Z`) } : {}),
      }))
  )

  // The app expects a single active term. Make the current term the active one, exactly as the
  // "set active" action in the admin UI does, and remember what we switched off.
  const deactivated = await SemesterModel.find({ _id: { $ne: currentTerm }, isActive: true })
    .select('_id name academicYear')
    .lean()
  if (deactivated.length) {
    await SemesterModel.updateMany(
      { _id: { $in: deactivated.map((semester) => semester._id) } },
      { $set: { isActive: false } }
    )
  }
  await SemesterModel.updateOne({ _id: currentTerm }, { $set: { isActive: true, isClosed: false } })

  await DepartmentModel.insertMany(
    departmentSeeds.map((seed) => ({
      _id: departmentId.get(seed.key),
      name: seed.name,
      code: seed.code,
      description: seed.description,
      isActive: true,
    }))
  )
  await ProgramModel.insertMany(
    programSeeds.map((seed) => ({
      _id: programId.get(seed.key),
      name: seed.name,
      code: seed.code,
      department: departmentId.get(seed.dept),
      totalSemesters: seed.semesters,
      duration: seed.years,
      durationUnit: 'years',
      isActive: true,
    }))
  )
  await BatchModel.insertMany(
    batchSeeds.map((seed) => {
      const program = programSeed.get(seed.program)!
      return {
        _id: batchId.get(`${seed.program}-${seed.year}`),
        name: `Batch ${seed.year}`,
        program: programId.get(seed.program),
        startingYear: seed.year,
        expectedGraduationYear: seed.year + program.years,
        isActive: true,
      }
    })
  )
  await SectionModel.insertMany(
    cohortSeeds.flatMap((cohort, index) => {
      const base = {
        name: 'A',
        program: programId.get(cohort.program),
        batch: batchId.get(`${cohort.program}-${cohort.year}`),
        isActive: true,
      }
      return [
        { _id: sectionIds[index]!.past, ...base, semester: pastTerm, isActive: false },
        { _id: sectionIds[index]!.current, ...base, semester: currentTerm },
      ]
    })
  )

  const phone = (index: number) =>
    `+92 3${String(10 + (index % 40))} ${String(1_000_000 + index * 7919).slice(0, 7)}`
  await UserModel.insertMany([
    {
      _id: adminId,
      fullName: 'Registrar Office',
      email: `registrar@${STAFF_DOMAIN}`,
      role: 'admin',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      employeeId: 'A-001',
      designation: 'Registrar',
    },
    ...staff.map((member, index) => ({
      _id: member.id,
      fullName: member.name,
      email: `${slug(member.name)}@${STAFF_DOMAIN}`,
      role: member.role,
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      employeeId: `${member.role === 'hod' ? 'H' : 'T'}-${String(index + 1).padStart(3, '0')}`,
      department: departmentId.get(member.dept),
      designation: staffSeeds[index]!.designation,
      phoneNumber: phone(index),
    })),
    ...students.map((student, index) => {
      const cohort = cohortSeeds[student.cohort]!
      const program = programSeed.get(student.program)!
      return {
        _id: student.id,
        fullName: student.name,
        email: student.email,
        role: 'student',
        passwordHash,
        isActive: true,
        mustChangePassword: false,
        registrationNumber: student.registrationNumber,
        department: departmentId.get(program.dept),
        program: programId.get(student.program),
        batch: batchId.get(`${cohort.program}-${cohort.year}`),
        semester: currentTerm,
        section: sectionIds[student.cohort]!.current,
        academicStatus: 'active',
        phoneNumber: phone(index + 100),
      }
    }),
  ])

  await CourseModel.insertMany(courses)
  await CourseOfferingModel.insertMany(
    offerings.map((offering) => ({
      _id: offering.id,
      course: offering.courseId,
      section: offering.section,
      teacher: offering.teacher.id,
      // A finished term keeps its approved results but is no longer an active assignment.
      isActive: offering.term === 'current',
    }))
  )

  const nextEnrollment = counter(NS.enrollment)
  const enrolledIn = (offering: OfferingSeed) =>
    students.filter((student) => student.cohort === offering.cohort)
  await EnrollmentModel.insertMany(
    offerings.flatMap((offering) =>
      enrolledIn(offering).map((student) => ({
        _id: nextEnrollment(),
        student: student.id,
        courseOffering: offering.id,
        section: offering.section,
        isActive: offering.term === 'current',
      }))
    )
  )

  // --- timetable (current term): greedy, with no teacher, room or section clashes ---------------
  const currentOfferings = offerings.filter((offering) => offering.term === 'current')
  const busy = new Set<string>()
  const timetableEntries = new Map<number, Array<Record<string, unknown>>>()
  const meeting = new Map<Types.ObjectId, TimetableDay>()
  currentOfferings.forEach((offering, position) => {
    const rooms = [1, 2, 3].map(
      (n) => `${departmentSeeds.find((d) => d.key === offering.dept)!.code} Room ${n}`
    )
    const isLab = /\bLab( I+)?$/.test(offering.courseTitle)
    if (isLab) rooms.unshift(`${departmentSeeds.find((d) => d.key === offering.dept)!.code} Lab`)
    for (let attempt = 0; attempt < days.length * slots.length; attempt++) {
      const flat = (attempt + offering.cohort * 3 + position) % (days.length * slots.length)
      const day = days[flat % days.length]!
      const slot = slots[Math.floor(flat / days.length) % slots.length]!
      const room = rooms[(position + attempt) % rooms.length]!
      const keys = [
        `section|${offering.section}|${day}|${slot.start}`,
        `teacher|${offering.teacher.id}|${day}|${slot.start}`,
        `room|${room}|${day}|${slot.start}`,
      ]
      if (keys.some((key) => busy.has(key))) continue
      keys.forEach((key) => busy.add(key))
      meeting.set(offering.id, day)
      timetableEntries.set(offering.cohort, [
        ...(timetableEntries.get(offering.cohort) ?? []),
        {
          courseOffering: offering.id,
          course: offering.courseId,
          teacher: offering.teacher.id,
          dayOfWeek: day,
          startTime: slot.start,
          endTime: slot.end,
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
          room,
          slotType: isLab ? 'lab' : 'lecture',
        },
      ])
      return
    }
    throw new Error(`Could not place ${offering.courseTitle} in the timetable`)
  })
  const nextTimetable = counter(NS.timetable)
  await TimetableModel.insertMany(
    cohortSeeds.map((cohort, index) => ({
      _id: nextTimetable(),
      section: sectionIds[index]!.current,
      program: programId.get(cohort.program),
      semester: currentTerm,
      status: 'published',
      version: 1,
      notes: 'Published weekly timetable for Fall 2026',
      entries: timetableEntries.get(index) ?? [],
      createdBy: adminId,
      updatedBy: adminId,
      publishedBy: adminId,
      publishedAt: new Date('2026-08-28T09:00:00.000Z'),
    }))
  )

  // --- attendance (current term): one class a week from 7 Sep to 6 Nov ---------------------------
  const nextAttendance = counter(NS.attendance)
  const attended = new Map<string, { present: number; total: number }>() // offering|student
  const sessions = currentOfferings.flatMap((offering) => {
    const offset = weekdayOffset(meeting.get(offering.id)!)
    const roster = enrolledIn(offering)
    return Array.from({ length: 9 }, (_, week) => {
      const dateKey = isoDate('2026-09-07', week * 7 + offset)
      return {
        _id: nextAttendance(),
        courseOffering: offering.id,
        section: offering.section,
        teacher: offering.teacher.id,
        date: new Date(`${dateKey}T00:00:00.000Z`),
        dateKey,
        records: roster.map((student) => {
          const draw = random()
          const status: AttendanceStatus =
            draw < student.attendanceRate
              ? 'present'
              : draw < student.attendanceRate + 0.04
                ? 'leave'
                : 'absent'
          const key = `${offering.id}|${student.id}`
          const tally = attended.get(key) ?? { present: 0, total: 0 }
          tally.total += 1
          if (status === 'present') tally.present += 1
          attended.set(key, tally)
          return { student: student.id, status }
        }),
      }
    })
  })
  await AttendanceSessionModel.insertMany(sessions)

  // --- assessments, marks and results --------------------------------------------------------
  const nextAssessment = counter(NS.assessment)
  const nextMarkSheet = counter(NS.markSheet)
  const nextResult = counter(NS.result)
  const assessmentDocs: Array<Record<string, unknown>> = []
  const markSheetDocs: Array<Record<string, unknown>> = []
  const resultDocs: Array<Record<string, unknown>> = []

  function categoriesFor(scores: number[]) {
    return assessmentDefinitions.map((definition, index) => {
      const obtained = scores[index]!
      const percentage = (obtained / definition.maximumMarks) * 100
      return {
        category: definition.category,
        obtainedMarks: obtained,
        maximumMarks: definition.maximumMarks,
        percentage,
        weightedMarks: (percentage * definition.weight) / 100,
      }
    })
  }

  // Which current offerings carry a complete result, and in what state. This gives the HOD real
  // items to approve or return and gives the teacher real items to submit.
  const resultPlan = new Map<Types.ObjectId, ResultStatus>()
  for (const dept of departmentSeeds) {
    const own = currentOfferings.filter((offering) => offering.dept === dept.key)
    if (own[0]) resultPlan.set(own[0].id, 'pending')
    if (own[1])
      resultPlan.set(own[1].id, dept.key === 'ee' || dept.key === 'math' ? 'returned' : 'draft')
    if (own[2] && dept.key === 'mgt') resultPlan.set(own[2].id, 'pending')
  }

  for (const offering of currentOfferings) {
    const roster = enrolledIn(offering)
    const plan = resultPlan.get(offering.id)
    const wanted = plan ? assessmentDefinitions.map((_, index) => index) : BASE_ASSESSMENTS
    const scores = new Map<string, number[]>()
    const assessmentIds = wanted.map(() => nextAssessment())

    for (const student of roster) {
      const tally = attended.get(`${offering.id}|${student.id}`)
      const attendancePercentage = tally ? (tally.present / tally.total) * 100 : 90
      scores.set(
        student.id.toString(),
        assessmentDefinitions.map((definition) =>
          definition.category === 'attendance'
            ? Math.round(attendancePercentage / 10)
            : scoreFor(definition.maximumMarks, student.ability)
        )
      )
    }

    wanted.forEach((definitionIndex, position) => {
      const definition = assessmentDefinitions[definitionIndex]!
      assessmentDocs.push({
        _id: assessmentIds[position],
        courseOffering: offering.id,
        teacher: offering.teacher.id,
        name: definition.name,
        category: definition.category,
        maximumMarks: definition.maximumMarks,
      })
      markSheetDocs.push({
        _id: nextMarkSheet(),
        assessment: assessmentIds[position],
        courseOffering: offering.id,
        teacher: offering.teacher.id,
        records: roster.map((student) => ({
          student: student.id,
          obtainedMarks: scores.get(student.id.toString())![definitionIndex],
        })),
        isDraft: plan === 'draft',
      })
    })

    if (plan) {
      const hod = hodOf.get(offering.dept)!
      const submittedAt = new Date('2026-11-04T09:00:00.000Z')
      const decidedAt = new Date('2026-11-05T09:00:00.000Z')
      const comment = 'Please recheck the assignment marks before approval.'
      resultDocs.push({
        _id: nextResult(),
        courseOffering: offering.id,
        teacher: offering.teacher.id,
        status: plan,
        records: roster.map((student) => {
          const categories = categoriesFor(scores.get(student.id.toString())!)
          const finalPercentage = categories.reduce(
            (sum, category) => sum + category.weightedMarks,
            0
          )
          return { student: student.id, categories, finalPercentage, ...gradeFor(finalPercentage) }
        }),
        ...(plan === 'draft' ? {} : { submittedAt }),
        ...(plan === 'returned' ? { hodComment: comment, returnedAt: decidedAt } : {}),
        history: resultHistory(plan, offering.teacher.id, hod.id, submittedAt, decidedAt, comment),
      })
    }
  }

  // Previous term: every course finished and was approved, so students have a real GPA and CGPA.
  for (const offering of offerings.filter((entry) => entry.term === 'past')) {
    const roster = enrolledIn(offering)
    const hod = hodOf.get(offering.dept)!
    const submittedAt = new Date('2026-06-20T09:00:00.000Z')
    const approvedAt = new Date('2026-06-26T09:00:00.000Z')
    resultDocs.push({
      _id: nextResult(),
      courseOffering: offering.id,
      teacher: offering.teacher.id,
      status: 'approved',
      records: roster.map((student) => {
        const scores = assessmentDefinitions.map((definition) =>
          definition.category === 'attendance'
            ? Math.round(clamp(student.attendanceRate * 100 + (random() * 8 - 4), 60, 100) / 10)
            : scoreFor(definition.maximumMarks, student.ability)
        )
        const categories = categoriesFor(scores)
        const finalPercentage = categories.reduce(
          (sum, category) => sum + category.weightedMarks,
          0
        )
        return { student: student.id, categories, finalPercentage, ...gradeFor(finalPercentage) }
      }),
      submittedAt,
      approvedAt,
      approvedBy: hod.id,
      history: resultHistory('approved', offering.teacher.id, hod.id, submittedAt, approvedAt),
    })
  }
  await AssessmentModel.insertMany(assessmentDocs)
  await MarkSheetModel.insertMany(markSheetDocs)
  await ResultModel.insertMany(resultDocs)

  // --- fees, exams -----------------------------------------------------------------------------
  const nextFee = counter(NS.fee)
  await FeeModel.insertMany(
    students.flatMap((student, index) => {
      const total = programSeed.get(student.program)!.fee
      const bucket = index % 10
      const paid =
        bucket <= 5
          ? total
          : bucket <= 7
            ? Math.round(total / 2)
            : bucket === 8
              ? 0
              : Math.round(total / 4)
      const notes =
        paid === total
          ? 'Paid in full'
          : paid === 0
            ? 'Awaiting first installment'
            : 'Installment plan in progress'
      return [
        {
          _id: nextFee(),
          student: student.id,
          semester: pastTerm,
          totalAmount: total,
          paidAmount: total,
          dueDate: new Date('2026-02-28T00:00:00.000Z'),
          paymentDate: new Date('2026-02-12T00:00:00.000Z'),
          notes: 'Paid in full',
        },
        {
          _id: nextFee(),
          student: student.id,
          semester: currentTerm,
          totalAmount: total,
          paidAmount: paid,
          dueDate: new Date('2026-10-15T00:00:00.000Z'),
          ...(paid > 0 ? { paymentDate: new Date('2026-09-18T00:00:00.000Z') } : {}),
          notes,
        },
      ]
    })
  )

  const nextExam = counter(NS.exam)
  await ExamModel.insertMany(
    currentOfferings.flatMap((offering) => {
      const base = {
        courseOffering: offering.id,
        course: offering.courseId,
        program: programId.get(offering.program),
        semester: currentTerm,
        section: offering.section,
        createdBy: adminId,
        updatedBy: adminId,
      }
      return [
        {
          _id: nextExam(),
          ...base,
          examType: 'Midterm',
          examDate: new Date(`${isoDate('2026-10-26', offering.index)}T00:00:00.000Z`),
          startTime: '09:00',
          endTime: '11:00',
          startMinutes: 540,
          endMinutes: 660,
          room: `${offering.dept.toUpperCase()} Examination Hall`,
          instructions:
            'Bring your university ID card and required stationery. Mobile phones are not allowed.',
        },
        {
          _id: nextExam(),
          ...base,
          examType: 'Final',
          examDate: new Date(`${isoDate('2027-01-04', offering.index)}T00:00:00.000Z`),
          startTime: '09:00',
          endTime: '12:00',
          startMinutes: 540,
          endMinutes: 720,
          room: 'Main Examination Hall',
          instructions:
            'Reporting time is 30 minutes before the paper. Calculators are allowed only where stated.',
        },
      ]
    })
  )

  // --- announcements, notifications, audit ---------------------------------------------------
  const nextAnnouncement = counter(NS.announcement)
  const announcements: Array<[string, string, boolean, string]> = [
    [
      'Welcome to Fall 2026',
      'Classes for Fall 2026 begin on Tuesday 1 September. Check the timetable page for your section schedule.',
      true,
      '2026-08-25',
    ],
    [
      'Fee submission deadline',
      'The first installment of the Fall 2026 fee is due on 15 October. Students with dues will not be allowed to register for final term.',
      true,
      '2026-09-20',
    ],
    [
      'Midterm examinations',
      'Midterm exams run from 26 to 30 October. The date sheet is available on the Exams page for every section.',
      false,
      '2026-10-12',
    ],
    [
      'Attendance policy reminder',
      'A minimum of 75 percent attendance is required to appear in the final examination. Review your attendance page regularly.',
      false,
      '2026-10-05',
    ],
    [
      'Career counselling week',
      'The Career Services Office hosts CV clinics and mock interviews from 16 to 20 November in the Student Centre.',
      false,
      '2026-11-02',
    ],
    [
      'Library extended hours',
      'The central library stays open until 10 pm during the examination period.',
      false,
      '2026-10-20',
    ],
    [
      'Final Year Project showcase',
      'Final-year students will present their projects on 12 December. Supervisors will share the schedule soon.',
      false,
      '2026-11-03',
    ],
    [
      'Scholarship applications open',
      'Merit and need-based scholarship applications for Spring 2027 are open until 30 November.',
      true,
      '2026-11-01',
    ],
    [
      'Winter break notice',
      'The university will be closed from 25 December to 1 January. Final examinations resume on 4 January.',
      false,
      '2026-11-06',
    ],
    [
      'Result approval timeline',
      'Teachers submit results after the final paper and department heads review them within five working days.',
      false,
      '2026-11-04',
    ],
  ]
  await AnnouncementModel.insertMany(
    announcements.map(([title, description, isPinned, date]) => ({
      _id: nextAnnouncement(),
      title,
      description,
      publishDate: new Date(`${date}T09:00:00.000Z`),
      expiryDate: new Date('2027-01-31T23:59:59.000Z'),
      isPinned,
      isActive: true,
      createdBy: adminId,
    }))
  )

  const nextNotification = counter(NS.notification)
  const notify = (
    recipient: Types.ObjectId,
    type: NotificationType,
    key: string,
    title: string,
    message: string,
    resourcePath: string
  ) => ({
    _id: nextNotification(),
    recipient,
    type,
    notificationKey: `uni:${key}`,
    title,
    message,
    resourcePath,
  })
  const notifications = [
    ...students.flatMap((student) => {
      const lowCourses = currentOfferings
        .filter((offering) => offering.cohort === student.cohort)
        .filter((offering) => {
          const tally = attended.get(`${offering.id}|${student.id}`)
          return tally && (tally.present / tally.total) * 100 < 75
        })
      return [
        notify(
          student.id,
          'course_assigned',
          'courses-fall2026',
          'Courses assigned',
          'Your Fall 2026 courses are ready.',
          '/courses'
        ),
        notify(
          student.id,
          'result_published',
          'results-spring2026',
          'Result published',
          'Your Spring 2026 results are available.',
          '/results'
        ),
        ...(lowCourses.length
          ? [
              notify(
                student.id,
                'attendance_updated',
                'attendance-low',
                'Attendance below threshold',
                `Your attendance is below 75 percent in ${lowCourses.length === 1 ? lowCourses[0]!.courseTitle : `${lowCourses.length} courses`}.`,
                '/attendance'
              ),
            ]
          : []),
      ]
    }),
    ...staff
      .filter((member) => member.role === 'teacher')
      .map((member) =>
        notify(
          member.id,
          'course_assigned',
          'teaching-fall2026',
          'Courses assigned',
          'Your Fall 2026 teaching assignments are ready.',
          '/courses'
        )
      ),
  ]
  await NotificationModel.insertMany(notifications)

  const nextAudit = counter(NS.audit)
  const audit: Array<[AuditAction, AuditModule, string, string]> = [
    ...departmentSeeds.map((d): [AuditAction, AuditModule, string, string] => [
      'created',
      'departments',
      departmentId.get(d.key)!.toString(),
      d.name,
    ]),
    ...programSeeds.map((p): [AuditAction, AuditModule, string, string] => [
      'created',
      'programs',
      programId.get(p.key)!.toString(),
      p.name,
    ]),
    ...semesterSeeds.map((s): [AuditAction, AuditModule, string, string] => [
      'created',
      'semesters',
      semesterId.get(s.key)!.toString(),
      `${s.name} (${s.academicYear})`,
    ]),
    ...currentOfferings
      .filter((_, i) => i % 5 === 0)
      .map((o): [AuditAction, AuditModule, string, string] => [
        'assigned',
        'courses',
        o.id.toString(),
        `${o.courseTitle} assigned to ${o.teacher.name}`,
      ]),
    ...cohortSeeds.map((c, i): [AuditAction, AuditModule, string, string] => [
      'published',
      'timetable',
      id(NS.timetable, i + 1).toString(),
      `${programSeed.get(c.program)!.code} ${c.year} timetable`,
    ]),
    ...resultDocs
      .filter((r) => r.status === 'approved')
      .slice(0, 14)
      .map((r): [AuditAction, AuditModule, string, string] => [
        'approved',
        'results',
        (r._id as Types.ObjectId).toString(),
        'Spring 2026 course result',
      ]),
  ]
  await AuditLogModel.insertMany(
    audit.map(([action, module, affectedRecordId, label], index) => ({
      _id: nextAudit(),
      actorId: adminId,
      actorName: 'Registrar Office',
      actorRole: 'admin',
      action,
      module,
      affectedRecordId,
      affectedRecordLabel: label,
      reason: 'University setup',
      createdAt: new Date(now.getTime() - (audit.length - index) * 3_600_000 * 6),
    }))
  )

  console.log(
    JSON.stringify(
      {
        database: mongoose.connection.name,
        password: PASSWORD,
        logins: {
          admin: `registrar@${STAFF_DOMAIN}`,
          hod: `${slug(staffSeeds[0]!.name)}@${STAFF_DOMAIN}`,
          teacher: `${slug(staffSeeds[1]!.name)}@${STAFF_DOMAIN}`,
          student: students[0]!.email,
        },
        created: {
          departments: departmentSeeds.length,
          programs: programSeeds.length,
          batches: batchSeeds.length,
          semesters: semesterSeeds.length,
          sections: cohortSeeds.length * 2,
          staff: staff.length + 1,
          students: students.length,
          courses: courses.length,
          offerings: offerings.length,
          enrollments: offerings.reduce((sum, offering) => sum + enrolledIn(offering).length, 0),
          attendanceSessions: sessions.length,
          assessments: assessmentDocs.length,
          results: resultDocs.length,
          fees: students.length * 2,
          exams: currentOfferings.length * 2,
          announcements: announcements.length,
          notifications: notifications.length,
          auditLogs: audit.length,
        },
        deactivatedSemesters: deactivated.map(
          (semester) => `${semester.name} ${semester.academicYear}`
        ),
      },
      null,
      2
    )
  )
}

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/^(dr|engr)\.?\s+/, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, '.')
}

void seedUniversity()
  .catch((error) => {
    console.error('Failed to seed university data:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDatabase()
  })
