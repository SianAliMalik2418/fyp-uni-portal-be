import { Schema, model, type HydratedDocument, type Types } from 'mongoose'
import { userRoles, type UserRole } from './user.model.js'

export const auditModules = [
  'users',
  'departments',
  'programs',
  'batches',
  'semesters',
  'sections',
  'courses',
  'attendance',
  'assessments',
  'marks',
  'results',
  'fees',
  'timetable',
  'exams',
  'announcements',
] as const
export type AuditModule = (typeof auditModules)[number]

export const auditActions = [
  'created',
  'updated',
  'deleted',
  'activated',
  'closed',
  'assigned',
  'reset_password',
  'saved',
  'submitted',
  'approved',
  'returned',
  'reopened',
  'published',
  'promoted',
] as const
export type AuditAction = (typeof auditActions)[number]

export interface AuditLog {
  actorId: Types.ObjectId
  actorName: string
  actorRole: UserRole
  action: AuditAction
  module: AuditModule
  affectedRecordId: string
  affectedRecordLabel?: string
  reason?: string
  createdAt?: Date
}

export type AuditLogDocument = HydratedDocument<AuditLog>

const auditLogSchema = new Schema<AuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorName: { type: String, required: true, trim: true, maxlength: 160 },
    actorRole: { type: String, enum: userRoles, required: true, index: true },
    action: { type: String, enum: auditActions, required: true, index: true },
    module: { type: String, enum: auditModules, required: true, index: true },
    affectedRecordId: { type: String, required: true, trim: true, maxlength: 160 },
    affectedRecordLabel: { type: String, trim: true, maxlength: 240 },
    reason: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ module: 1, action: 1, createdAt: -1 })

export const AuditLogModel = model('AuditLog', auditLogSchema)
