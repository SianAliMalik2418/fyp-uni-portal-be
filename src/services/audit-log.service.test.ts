import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/audit-log.model.js', () => ({
  AuditLogModel: {
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}))

vi.mock('../config/logger.js', () => ({
  logger: { error: vi.fn() },
}))

const auditLogModel = await import('../models/audit-log.model.js')
const loggerModule = await import('../config/logger.js')
const { listAuditLogs, recordAuditLog } = await import('./audit-log.service.js')

const actor = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Portal Admin',
  role: 'admin' as const,
}

describe('audit log service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('records only the allowlisted audit event fields', async () => {
    vi.mocked(auditLogModel.AuditLogModel.create).mockResolvedValue({} as never)

    await recordAuditLog({
      actor: actor as never,
      action: 'updated',
      module: 'fees',
      affectedRecord: { id: 'fee-1', label: 'Student fee' },
      reason: 'Correction approved',
    })

    expect(auditLogModel.AuditLogModel.create).toHaveBeenCalledWith({
      actorId: actor._id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'updated',
      module: 'fees',
      affectedRecordId: 'fee-1',
      affectedRecordLabel: 'Student fee',
      reason: 'Correction approved',
    })
  })

  it('reports an audit persistence failure without failing the completed action', async () => {
    vi.mocked(auditLogModel.AuditLogModel.create).mockRejectedValue(new Error('database offline'))

    await expect(
      recordAuditLog({
        actor: actor as never,
        action: 'updated',
        module: 'fees',
        affectedRecord: { id: 'fee-1' },
      })
    ).resolves.toBe(false)

    expect(loggerModule.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'updated', module: 'fees', affectedRecordId: 'fee-1' }),
      'Audit log persistence failed'
    )
  })

  it('uses bounded filters and returns pagination metadata', async () => {
    const exec = vi.fn().mockResolvedValue([
      {
        id: 'audit-1',
        actorId: actor._id,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'updated',
        module: 'fees',
        affectedRecordId: 'fee-1',
        affectedRecordLabel: 'Student fee',
        createdAt: new Date('2026-08-24T10:00:00.000Z'),
      },
    ])
    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec,
    }
    vi.mocked(auditLogModel.AuditLogModel.find).mockReturnValue(query as never)
    vi.mocked(auditLogModel.AuditLogModel.countDocuments).mockReturnValue({
      exec: vi.fn().mockResolvedValue(21),
    } as never)

    const result = await listAuditLogs({
      module: 'fees',
      actorRole: 'admin',
      page: 2,
      limit: 20,
    })

    expect(auditLogModel.AuditLogModel.find).toHaveBeenCalledWith({
      module: 'fees',
      actorRole: 'admin',
    })
    expect(query.skip).toHaveBeenCalledWith(20)
    expect(query.limit).toHaveBeenCalledWith(20)
    expect(result).toMatchObject({ page: 2, limit: 20, total: 21, totalPages: 2 })
    expect(result.auditLogs[0]).toMatchObject({
      id: 'audit-1',
      module: 'fees',
      actor: { id: actor._id, name: actor.fullName, role: 'admin' },
    })
  })
})
