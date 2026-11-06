import { randomUUID } from 'node:crypto'
import mongoose, { Types } from 'mongoose'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MarkSheetModel } from '../models/mark-sheet.model.js'
import { UserModel } from '../models/user.model.js'
import { listCourseOfferings } from './course.service.js'
import {
  getStudentAttendanceSummaries,
  listLowAttendanceStudents,
} from './academic-performance.service.js'
import { listPublishedStudentMarks } from './student-marks.service.js'
import { getPublishedStudentResults } from './result.service.js'
import { getWeightedMarksSummary } from './assessment.service.js'

const dbName = `fyp_uni_portal_perf_${randomUUID().replaceAll('-', '')}`
const department = new Types.ObjectId()
const program = new Types.ObjectId()
const semester = new Types.ObjectId()
const section = new Types.ObjectId()
const batch = new Types.ObjectId()
const students = Array.from({ length: 4 }, () => new Types.ObjectId())
const offerings = Array.from({ length: 3 }, () => new Types.ObjectId())
const admin = new UserModel({ role: 'admin' })
const student = new UserModel({ _id: students[0], role: 'student' })
let reads: string[] = []
let projectedRecords: number[] = []

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017', {
    dbName,
    serverSelectionTimeoutMS: 5000,
    monitorCommands: true,
    autoIndex: false,
  })
  const client = mongoose.connection.getClient()
  client.on('commandStarted', (event) => {
    if (event.databaseName !== dbName) return
    if (['find', 'aggregate', 'count'].includes(event.commandName)) {
      reads.push(`${event.commandName}:${String(event.command[event.commandName])}`)
    }
  })
  client.on('commandSucceeded', (event) => {
    const reply: unknown = event.reply
    if (event.commandName !== 'find' || !reply || typeof reply !== 'object' || !('cursor' in reply))
      return
    const cursor = reply.cursor
    if (
      !cursor ||
      typeof cursor !== 'object' ||
      !('firstBatch' in cursor) ||
      !Array.isArray(cursor.firstBatch)
    )
      return
    for (const row of cursor.firstBatch) {
      if (row && typeof row === 'object' && 'records' in row && Array.isArray(row.records)) {
        projectedRecords.push(row.records.length)
      }
    }
  })
  const db = mongoose.connection.db
  if (!db) throw new Error('Test database did not connect')
  await db
    .collection('departments')
    .insertOne({ _id: department, code: 'CS', name: 'Computing', isActive: true })
  await db.collection('programs').insertOne({
    _id: program,
    code: 'BSCS',
    name: 'Computer Science',
    totalSemesters: 8,
    department,
    isActive: true,
  })
  await db.collection('semesters').insertOne({
    _id: semester,
    name: 'One',
    academicYear: '2026',
    isActive: true,
    isClosed: false,
  })
  await db.collection('batches').insertOne({ _id: batch, name: '2026', program, isActive: true })
  await db
    .collection('sections')
    .insertOne({ _id: section, name: 'A', program, semester, batch, isActive: true })
  await db.collection('users').insertMany(
    students.map((_id, index) => ({
      _id,
      fullName: `Student ${index}`,
      registrationNumber: `ST-${index}`,
      role: 'student',
      department,
      program,
      semester,
      section,
      batch,
      isActive: true,
    }))
  )
  for (const [index, offering] of offerings.entries()) {
    const course = new Types.ObjectId()
    await db.collection('courses').insertOne({
      _id: course,
      code: `CS-${index}`,
      title: `Course ${index}`,
      creditHours: 3,
      department,
      program,
      semester,
      isActive: true,
    })
    await db
      .collection('courseofferings')
      .insertOne({ _id: offering, course, section, isActive: true })
    await db.collection('enrollments').insertMany(
      students.map((id, studentIndex) => ({
        student: id,
        courseOffering: offering,
        section,
        isActive: index < 2 && studentIndex < 3,
      }))
    )
    await db.collection('attendancesessions').insertMany(
      [0, 1].map((day) => ({
        courseOffering: offering,
        section,
        date: new Date(2026, 0, day + 1),
        dateKey: `2026-01-0${day + 1}`,
        records: students.map((id, studentIndex) => ({
          student: id,
          status: studentIndex === 0 ? (day === 0 ? 'present' : 'leave') : 'absent',
        })),
      }))
    )
    await db.collection('results').insertOne({
      courseOffering: offering,
      status: 'approved',
      approvedAt: new Date(2026, 0, 1),
      records: students.map((id) => ({
        student: id,
        finalPercentage: 85,
        letterGrade: 'A',
        gradePoint: 4,
        categories: [],
      })),
    })
  }
  for (const [index, category] of ['quiz', 'assignment', 'midterm'].entries()) {
    const assessment = new Types.ObjectId()
    await db.collection('assessments').insertOne({
      _id: assessment,
      courseOffering: offerings[0],
      category,
      name: category,
      maximumMarks: 20,
    })
    await db.collection('marksheets').insertOne({
      assessment,
      courseOffering: offerings[0],
      isDraft: false,
      records: [
        {
          student: students[0],
          obtainedMarks: index === 0 ? 10 : 0,
          ...(index === 1 ? { status: 'exempted' } : {}),
        },
        { student: students[1], status: index === 2 ? 'result_withheld' : 'absent' },
      ],
    })
  }
}, 15000)

afterAll(async () => {
  if (mongoose.connection.name === dbName) await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

beforeEach(() => {
  reads = []
  projectedRecords = []
})

describe('academic query costs and results', () => {
  it('counts active enrollments for all offerings in one database command', async () => {
    const result = await listCourseOfferings(admin)
    expect(result.map((offering) => offering.studentCount)).toEqual([3, 3, 0])
    expect(reads.filter((read) => read.endsWith(':enrollments'))).toHaveLength(1)
  })

  it('counts enrollment once when several published marks share an offering', async () => {
    const marks = await listPublishedStudentMarks(student)
    expect(marks.summary.publishedAssessments).toBe(3)
    expect(marks.summary.coursesWithMarks).toBe(1)
    expect(marks.recentMarks.map((mark) => mark.offering.studentCount)).toEqual([3, 3, 3])
    expect(reads.filter((read) => read.endsWith(':enrollments'))).toHaveLength(1)
  })

  it('reads only the current student records for attendance and published results', async () => {
    const attendance = await getStudentAttendanceSummaries(student)
    expect(
      attendance.map(({ present, leave, absent, attendancePercentage }) => ({
        present,
        leave,
        absent,
        attendancePercentage,
      }))
    ).toEqual([
      { present: 1, leave: 1, absent: 0, attendancePercentage: 50 },
      { present: 1, leave: 1, absent: 0, attendancePercentage: 50 },
    ])
    const results = await getPublishedStudentResults(student)
    expect(results.cgpa).toBe(4)
    expect(results.semesters[0]?.courses).toHaveLength(3)
    expect(projectedRecords).toHaveLength(7)
    expect(projectedRecords.every((count) => count === 1)).toBe(true)
  })

  it('loads shortage rosters once and preserves ordering, filtering and totals', async () => {
    const result = await listLowAttendanceStudents(admin, { page: 1, limit: 20 })
    expect(result.total).toBe(6)
    expect(result.shortages.map((row) => row.attendancePercentage)).toEqual([0, 0, 0, 0, 50, 50])
    expect(reads.filter((read) => read === 'find:enrollments')).toHaveLength(1)
    expect(reads.filter((read) => read === 'find:courseofferings')).toHaveLength(1)
    const filtered = await listLowAttendanceStudents(admin, {
      page: 2,
      limit: 1,
      studentSearch: 'ST-0',
    })
    expect(filtered.total).toBe(2)
    expect(filtered.shortages).toHaveLength(1)
    expect(filtered.shortages[0]?.student.registrationNumber).toBe('ST-0')
  })

  it('keeps shortage queries within the HOD department and rejects other roles', async () => {
    const hod = new UserModel({ role: 'hod', department })
    expect((await listLowAttendanceStudents(hod)).total).toBe(6)
    const otherHod = new UserModel({ role: 'hod', department: new Types.ObjectId() })
    expect((await listLowAttendanceStudents(otherHod)).total).toBe(0)
    await expect(listLowAttendanceStudents(student)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('indexes each mark record once instead of rescanning for every student', async () => {
    const sheets = await MarkSheetModel.find({ courseOffering: offerings[0] }).exec()
    let studentReads = 0
    for (const sheet of sheets) {
      for (const record of sheet.records) {
        const id = record.student
        Object.defineProperty(record, 'student', {
          get: () => {
            studentReads += 1
            return id
          },
        })
      }
    }
    const query = MarkSheetModel.find({ courseOffering: offerings[0] })
    vi.spyOn(query, 'exec').mockResolvedValue(sheets)
    const find = vi.spyOn(MarkSheetModel, 'find').mockReturnValue(query)
    try {
      const result = await getWeightedMarksSummary(admin, String(offerings[0]))
      expect(result.map((row) => row.weightedTotal)).toEqual([5, 0, 0])
      expect(studentReads).toBeLessThanOrEqual(6)
    } finally {
      find.mockRestore()
    }
  })

  it('keeps the first mark when legacy sheets contain duplicate student records', async () => {
    const sheets = await MarkSheetModel.find({ courseOffering: offerings[0] }).exec()
    const sheet = sheets[0]
    if (!sheet || !students[0]) throw new Error('Missing mark fixture')
    sheet.records.push({ student: students[0], obtainedMarks: 20 })
    const query = MarkSheetModel.find({ courseOffering: offerings[0] })
    vi.spyOn(query, 'exec').mockResolvedValue(sheets)
    const find = vi.spyOn(MarkSheetModel, 'find').mockReturnValue(query)
    try {
      const result = await getWeightedMarksSummary(admin, String(offerings[0]))
      expect(result[0]?.weightedTotal).toBe(5)
    } finally {
      find.mockRestore()
    }
  })

  it('preserves zero, missing, exempted and withheld marks in weighted summaries', async () => {
    const result = await getWeightedMarksSummary(admin, String(offerings[0]))
    expect(
      result.map(({ weightedTotal, missingAssessments }) => ({ weightedTotal, missingAssessments }))
    ).toEqual([
      { weightedTotal: 5, missingAssessments: 0 },
      { weightedTotal: 0, missingAssessments: 0 },
      { weightedTotal: 0, missingAssessments: 3 },
    ])
    expect(
      result[0]?.categories.find((category) => category.category === 'assignment')?.maximumMarks
    ).toBe(0)
    expect(
      result[1]?.categories.find((category) => category.category === 'midterm')?.maximumMarks
    ).toBe(0)
  })
})
