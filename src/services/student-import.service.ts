import { parse } from 'csv-parse/sync'
import { BatchModel } from '../models/batch.model.js'
import { DepartmentModel } from '../models/department.model.js'
import { ProgramModel } from '../models/program.model.js'
import { SectionModel } from '../models/section.model.js'
import { SemesterModel } from '../models/semester.model.js'
import { ApiError } from '../utils/api-error.js'
import { createUser } from './user.service.js'

const requiredColumns = [
  'fullName',
  'email',
  'registrationNumber',
  'departmentCode',
  'programCode',
  'batchName',
  'semesterName',
  'academicYear',
  'sectionName',
] as const

type StudentImportRow = Record<(typeof requiredColumns)[number], string>
type AcademicReferences = {
  departmentId: string
  programId: string
  batchId: string
  semesterId: string
  sectionId: string
}

type StudentImportDependencies = {
  resolveAcademicReferences(row: StudentImportRow): Promise<AcademicReferences>
  createStudent(payload: StudentImportRow & AcademicReferences): Promise<unknown>
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to import row'
}

export function createStudentImportService(dependencies: StudentImportDependencies) {
  return {
    async importCsv(buffer: Buffer) {
      let records: Record<string, string>[]
      try {
        records = parse(buffer, {
          columns: true,
          bom: true,
          skip_empty_lines: true,
          trim: true,
        })
      } catch {
        throw new ApiError(400, 'CSV could not be parsed')
      }

      const headers = records[0] ? Object.keys(records[0]) : []
      if (!requiredColumns.every((column) => headers.includes(column))) {
        throw new ApiError(400, `CSV must include required columns: ${requiredColumns.join(', ')}`)
      }
      if (records.length > 500) throw new ApiError(400, 'CSV cannot contain more than 500 students')

      const seenEmails = new Set<string>()
      const seenRegistrations = new Set<string>()
      const rows = []

      for (const [index, rawRecord] of records.entries()) {
        const rowNumber = index + 2
        const row = Object.fromEntries(
          requiredColumns.map((column) => [column, rawRecord[column]?.trim() ?? ''])
        ) as StudentImportRow
        const email = row.email.toLowerCase()
        const registration = row.registrationNumber.toUpperCase()

        try {
          const missing = requiredColumns.find((column) => !row[column])
          if (missing) throw new Error(`${missing} is required`)
          if (seenEmails.has(email)) throw new Error('Duplicate email in file')
          if (seenRegistrations.has(registration)) {
            throw new Error('Duplicate registration number in file')
          }
          seenEmails.add(email)
          seenRegistrations.add(registration)

          const references = await dependencies.resolveAcademicReferences(row)
          await dependencies.createStudent({ ...row, email, ...references })
          rows.push({ row: rowNumber, email, registrationNumber: registration, status: 'imported' })
        } catch (error) {
          rows.push({
            row: rowNumber,
            email,
            registrationNumber: registration,
            status: 'failed',
            error: errorMessage(error),
          })
        }
      }

      const imported = rows.filter((row) => row.status === 'imported').length
      return { rows, summary: { total: rows.length, imported, failed: rows.length - imported } }
    },
  }
}

const studentImportDependencies: StudentImportDependencies = {
  async resolveAcademicReferences(row) {
    const department = await DepartmentModel.findOne({
      code: row.departmentCode.toUpperCase(),
      isActive: true,
    }).exec()
    if (!department) throw new ApiError(400, 'Department not found or inactive')

    const program = await ProgramModel.findOne({
      code: row.programCode.toUpperCase(),
      department: department._id,
      isActive: true,
    }).exec()
    if (!program) throw new ApiError(400, 'Program not found in department or inactive')

    const batch = await BatchModel.findOne({
      name: row.batchName,
      program: program._id,
      isActive: true,
    }).exec()
    if (!batch) throw new ApiError(400, 'Batch not found in program or inactive')

    const semester = await SemesterModel.findOne({
      name: row.semesterName,
      academicYear: row.academicYear,
      isClosed: false,
    }).exec()
    if (!semester) throw new ApiError(400, 'Semester not found or closed')

    const section = await SectionModel.findOne({
      name: row.sectionName,
      program: program._id,
      batch: batch._id,
      semester: semester._id,
      isActive: true,
    }).exec()
    if (!section) throw new ApiError(400, 'Section not found for the selected academic references')

    return {
      departmentId: department.id,
      programId: program.id,
      batchId: batch.id,
      semesterId: semester.id,
      sectionId: section.id,
    }
  },
  createStudent(payload) {
    return createUser({
      fullName: payload.fullName,
      email: payload.email,
      role: 'student',
      registrationNumber: payload.registrationNumber,
      departmentId: payload.departmentId,
      programId: payload.programId,
      batchId: payload.batchId,
      semesterId: payload.semesterId,
      sectionId: payload.sectionId,
      academicStatus: 'active',
      isActive: true,
    })
  },
}

export const studentImportService = createStudentImportService(studentImportDependencies)
