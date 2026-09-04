import type { QueryFilter } from 'mongoose'
import { logger } from '../config/logger.js'
import {
  AuditLogModel,
  type AuditAction,
  type AuditLog,
  type AuditLogDocument,
  type AuditModule,
} from '../models/audit-log.model.js'
import type { UserDocument } from '../models/user.model.js'
import type { AuditLogQuery } from '../validators/audit-log.validator.js'

type AuditActor = Pick<UserDocument, '_id' | 'fullName' | 'role'>

export type AuditEvent = {
  actor: AuditActor
  action: AuditAction
  module: AuditModule
  affectedRecord: { id: string; label?: string }
  reason?: string
}

export async function recordAuditLog(event: AuditEvent) {
  try {
    await AuditLogModel.create({
      actorId: event.actor._id,
      actorName: event.actor.fullName,
      actorRole: event.actor.role,
      action: event.action,
      module: event.module,
      affectedRecordId: event.affectedRecord.id,
      affectedRecordLabel: event.affectedRecord.label,
      reason: event.reason?.trim() || undefined,
    })
    return true
  } catch (error) {
    logger.error(
      {
        err: error,
        actorId: event.actor._id.toString(),
        action: event.action,
        module: event.module,
        affectedRecordId: event.affectedRecord.id,
      },
      'Audit log persistence failed'
    )
    return false
  }
}

function serializeAuditLog(auditLog: AuditLogDocument) {
  return {
    id: auditLog.id,
    actor: {
      id: auditLog.actorId.toString(),
      name: auditLog.actorName,
      role: auditLog.actorRole,
    },
    action: auditLog.action,
    module: auditLog.module,
    affectedRecord: {
      id: auditLog.affectedRecordId,
      label: auditLog.affectedRecordLabel,
    },
    reason: auditLog.reason,
    createdAt: auditLog.createdAt,
  }
}

export async function listAuditLogs(query: AuditLogQuery) {
  const filter: QueryFilter<AuditLog> = {
    ...(query.module ? { module: query.module } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.actorRole ? { actorRole: query.actorRole } : {}),
  }
  const skip = (query.page - 1) * query.limit
  const [auditLogs, total] = await Promise.all([
    AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).exec(),
    AuditLogModel.countDocuments(filter).exec(),
  ])

  return {
    auditLogs: auditLogs.map(serializeAuditLog),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  }
}
