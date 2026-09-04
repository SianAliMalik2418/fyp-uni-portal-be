import { describe, expect, it, vi } from 'vitest'
import { createStudentImportService } from './student-import.service.js'

const header =
  'fullName,email,registrationNumber,departmentCode,programCode,batchName,semesterName,academicYear,sectionName'

describe('student CSV import service', () => {
  it('imports valid rows and reports duplicates and invalid references by row', async () => {
    const resolveAcademicReferences = vi.fn(async (row: { programCode: string }) => {
      if (row.programCode === 'BAD') throw new Error('Program not found')
      return {
        departmentId: 'department-1',
        programId: 'program-1',
        batchId: 'batch-1',
        semesterId: 'semester-1',
        sectionId: 'section-1',
      }
    })
    const createStudent = vi.fn(async () => undefined)
    const csv = [
      header,
      'Ayesha Noor,ayesha@example.com,REG-001,CS,BSCS,2026,Fall,2026-2027,A',
      'Duplicate Email,ayesha@example.com,REG-002,CS,BSCS,2026,Fall,2026-2027,A',
      'Bad Program,bad@example.com,REG-003,CS,BAD,2026,Fall,2026-2027,A',
    ].join('\n')

    const result = await createStudentImportService({
      resolveAcademicReferences,
      createStudent,
    }).importCsv(Buffer.from(csv))

    expect(createStudent).toHaveBeenCalledOnce()
    expect(result.summary).toEqual({ total: 3, imported: 1, failed: 2 })
    expect(result.rows).toEqual([
      expect.objectContaining({ row: 2, status: 'imported', email: 'ayesha@example.com' }),
      expect.objectContaining({ row: 3, status: 'failed', error: 'Duplicate email in file' }),
      expect.objectContaining({ row: 4, status: 'failed', error: 'Program not found' }),
    ])
  })

  it('rejects a file without the exact required headers', async () => {
    const service = createStudentImportService({
      resolveAcademicReferences: vi.fn(),
      createStudent: vi.fn(),
    })

    await expect(
      service.importCsv(Buffer.from('fullName,email\nAyesha,a@example.com'))
    ).rejects.toThrow('CSV must include required columns')
  })
})
