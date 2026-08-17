import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/result.model.js', () => ({
  ResultModel: { find: vi.fn() },
}))

const resultModel = await import('../models/result.model.js')
const { getStudentResultCard } = await import('./result.service.js')

const student = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Ayesha Noor',
  registrationNumber: 'NCBAE-2026-CS-001',
  role: 'student',
}

describe('student result cards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not generate a card when the semester has no approved results', async () => {
    const query = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(resultModel.ResultModel.find).mockReturnValue(query as never)

    await expect(
      getStudentResultCard(student as never, '507f1f77bcf86cd799439012')
    ).rejects.toMatchObject({ statusCode: 404, message: 'Approved semester result not found' })
    expect(resultModel.ResultModel.find).toHaveBeenCalledWith({
      status: 'approved',
      'records.student': student._id,
    })
  })
})
