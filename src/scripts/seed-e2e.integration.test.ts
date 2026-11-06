import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import mongoose from 'mongoose'
import { MongoClient } from 'mongodb'
import { afterAll, describe, expect, it } from 'vitest'
import { AnnouncementModel } from '../models/announcement.model.js'
import { AssessmentConfigurationModel } from '../models/assessment-configuration.model.js'
import { AssessmentModel } from '../models/assessment.model.js'
import { AttendanceConfigurationModel } from '../models/attendance-configuration.model.js'
import { AttendanceSessionModel } from '../models/attendance-session.model.js'
import { BatchModel } from '../models/batch.model.js'
import { CourseOfferingModel } from '../models/course-offering.model.js'
import { CourseModel } from '../models/course.model.js'
import { DepartmentModel } from '../models/department.model.js'
import { EnrollmentModel } from '../models/enrollment.model.js'
import { ExamModel } from '../models/exam.model.js'
import { FeeModel } from '../models/fee.model.js'
import { GradingConfigurationModel } from '../models/grading-configuration.model.js'
import { KnowledgeModel } from '../models/knowledge.model.js'
import { MarkSheetModel } from '../models/mark-sheet.model.js'
import { NotificationModel } from '../models/notification.model.js'
import { ProgramModel } from '../models/program.model.js'
import { ResultModel } from '../models/result.model.js'
import { SectionModel } from '../models/section.model.js'
import { SemesterModel } from '../models/semester.model.js'
import { TimetableModel } from '../models/timetable.model.js'
import { UserModel } from '../models/user.model.js'
import { searchTrustedKnowledge } from '../services/knowledge-base.service.js'
import { listPublishedStudentMarks } from '../services/student-marks.service.js'

const disposableDatabaseUri = `mongodb://127.0.0.1:27017/fyp_uni_portal_e2e_${randomUUID().replaceAll('-', '')}`

afterAll(async () => {
  await mongoose.disconnect()
  runSeed(disposableDatabaseUri, ['--cleanup'])
})

describe('e2e demo seed', () => {
  it.each(['university_portal', 'fyp_uni_portal_e2e_production', 'fyp_uni_portal_e2e_abc'])(
    'refuses unsafe database %s',
    (database) => {
      const result = runSeed(`mongodb://127.0.0.1:1/${database}`)

      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('Refusing to seed non-e2e database')
    }
  )

  it('creates the complete deterministic Phase 21 demonstration state', async () => {
    const result = runSeed(disposableDatabaseUri)
    expect(result.status).toBe(0)

    await mongoose.connect(disposableDatabaseUri)

    await expectCoreAcademicStructure()
    await expectAcademicPerformanceExamples()
    await expectStudentServiceExamples()
    await expectConfigurationKnowledge()

    await mongoose.disconnect()
    const cleanup = runSeed(disposableDatabaseUri, ['--cleanup'])
    expect(cleanup.status).toBe(0)
    await expectDatabaseDropped(disposableDatabaseUri)
  }, 30_000)
})

function runSeed(databaseUri: string, args: string[] = []) {
  return spawnSync('bunx', ['tsx', 'src/scripts/seed-e2e.ts', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MONGODB_URI: databaseUri,
      GEMINI_API_KEY: 'e2e-test-key',
      LOG_LEVEL: 'silent',
    },
  })
}

async function expectDatabaseDropped(databaseUri: string) {
  const client = new MongoClient(databaseUri)
  await client.connect()
  const collections = await client.db().listCollections().toArray()
  await client.close()

  expect(collections).toEqual([])
}

async function expectCoreAcademicStructure() {
  expect(await DepartmentModel.countDocuments()).toBe(1)
  expect(await ProgramModel.countDocuments()).toBe(1)
  expect(await BatchModel.countDocuments()).toBe(1)
  expect(await SemesterModel.countDocuments()).toBe(2)
  expect(await SectionModel.countDocuments()).toBe(2)
  expect(await CourseModel.countDocuments()).toBe(5)
  expect(await CourseOfferingModel.countDocuments()).toBe(5)
  expect(await EnrollmentModel.countDocuments()).toBe(4)

  const roles = await UserModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])
  expect(roles).toEqual([
    { _id: 'admin', count: 1 },
    { _id: 'hod', count: 1 },
    { _id: 'student', count: 1 },
    { _id: 'teacher', count: 1 },
  ])
}

async function expectAcademicPerformanceExamples() {
  expect(await AttendanceSessionModel.countDocuments()).toBe(4)
  const assessmentCategories = await AssessmentModel.distinct('category')
  expect(assessmentCategories).toEqual(
    expect.arrayContaining(['quiz', 'assignment', 'midterm', 'final'])
  )
  expect(await MarkSheetModel.countDocuments()).toBeGreaterThanOrEqual(4)

  const statuses = await ResultModel.distinct('status')
  expect(statuses.sort()).toEqual(['approved', 'draft', 'pending', 'returned'])
  const approvedResult = await ResultModel.findOne({ status: 'approved' }).orFail().exec()
  expect(approvedResult.records[0]).toMatchObject({ letterGrade: 'A', gradePoint: 4 })

  const student = await UserModel.findOne({ role: 'student' }).orFail().exec()
  const marks = await listPublishedStudentMarks(student)
  expect(marks.recentMarks[0]).toMatchObject({
    assessment: { name: 'Quiz 1', maximumMarks: 10 },
    offering: { course: { code: 'PF', title: 'Programming Fundamentals' } },
    obtainedMarks: 8,
    publishedAt: new Date('2026-08-25T08:00:00.000Z'),
  })
}

async function expectStudentServiceExamples() {
  expect(await FeeModel.countDocuments()).toBe(1)
  expect(await TimetableModel.countDocuments({ status: 'published' })).toBe(1)
  expect(await ExamModel.countDocuments()).toBeGreaterThanOrEqual(1)
  expect(await AnnouncementModel.countDocuments({ isActive: true })).toBeGreaterThanOrEqual(1)
  expect(await NotificationModel.countDocuments()).toBeGreaterThanOrEqual(3)
}

async function expectConfigurationKnowledge() {
  expect(await AttendanceConfigurationModel.countDocuments()).toBe(1)
  expect(await AssessmentConfigurationModel.countDocuments()).toBe(1)
  expect(await GradingConfigurationModel.countDocuments()).toBe(1)

  await KnowledgeModel.createIndexes()
  const knowledge = await searchTrustedKnowledge('attendance assessment grading passing', {
    limit: 10,
  })
  expect(knowledge.map((entry) => entry.key)).toEqual(
    expect.arrayContaining([
      'configured-attendance-requirement',
      'configured-assessment-structure',
      'configured-grading-scale',
      'configured-passing-threshold',
    ])
  )
  expect(knowledge.every((entry) => entry.source === 'configuration' && entry.question)).toBe(true)
}
