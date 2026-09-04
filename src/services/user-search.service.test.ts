import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as UserModelModule from '../models/user.model.js'

vi.mock('../models/user.model.js', async (importOriginal) => {
  const actual = await importOriginal<typeof UserModelModule>()
  return {
    ...actual,
    UserModel: {
      countDocuments: vi.fn(),
      find: vi.fn(),
    },
  }
})

const userModel = await import('../models/user.model.js')
const { listUsers } = await import('./user.service.js')

function mockUserQuery(users: unknown[]) {
  const exec = vi.fn().mockResolvedValue(users)
  const populate = vi.fn().mockReturnValue({ exec })
  const select = vi.fn().mockReturnValue({ populate })
  const limit = vi.fn().mockReturnValue({ select })
  const skip = vi.fn().mockReturnValue({ limit })
  const sort = vi.fn().mockReturnValue({ skip })
  vi.mocked(userModel.UserModel.find).mockReturnValue({ sort } as never)

  return { limit, skip, select }
}

describe('user search', () => {
  beforeEach(() => vi.clearAllMocks())

  it('searches student identity fields and pages in MongoDB', async () => {
    const query = mockUserQuery([])
    vi.mocked(userModel.UserModel.countDocuments).mockReturnValue({
      exec: vi.fn().mockResolvedValue(0),
    } as never)
    const viewer = { role: 'admin' }

    const result = await listUsers(viewer as never, {
      role: 'student',
      search: 'ayesha',
      programId: '507f1f77bcf86cd799439011',
      isActive: true,
      page: 2,
      limit: 10,
    })

    const expectedFilter = {
      role: 'student',
      program: '507f1f77bcf86cd799439011',
      isActive: true,
      $or: [{ fullName: /ayesha/i }, { email: /ayesha/i }, { registrationNumber: /ayesha/i }],
    }
    expect(userModel.UserModel.find).toHaveBeenCalledWith(expectedFilter)
    expect(userModel.UserModel.countDocuments).toHaveBeenCalledWith(expectedFilter)
    expect(query.skip).toHaveBeenCalledWith(10)
    expect(query.limit).toHaveBeenCalledWith(10)
    expect(query.select).toHaveBeenCalledWith('-passwordHash')
    expect(result).toEqual({ users: [], page: 2, limit: 10, total: 0, totalPages: 0 })
  })

  it('uses teacher identity fields and forces the signed-in HOD department', async () => {
    mockUserQuery([])
    vi.mocked(userModel.UserModel.countDocuments).mockReturnValue({
      exec: vi.fn().mockResolvedValue(0),
    } as never)

    await listUsers({ role: 'hod', department: '507f1f77bcf86cd799439012' } as never, {
      role: 'teacher',
      search: 'emp-7',
      departmentId: '507f1f77bcf86cd799439099',
      designation: 'Lecturer',
      page: 1,
      limit: 20,
    })

    expect(userModel.UserModel.find).toHaveBeenCalledWith({
      role: 'teacher',
      department: '507f1f77bcf86cd799439012',
      designation: /^Lecturer$/i,
      $or: [{ fullName: /emp-7/i }, { email: /emp-7/i }, { employeeId: /emp-7/i }],
    })
  })
})
