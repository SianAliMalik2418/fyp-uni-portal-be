import { z } from 'zod'
import { auditActions, auditModules } from '../models/audit-log.model.js'
import { userRoles } from '../models/user.model.js'

export const auditLogQuerySchema = z.object({
  module: z.enum(auditModules).optional(),
  action: z.enum(auditActions).optional(),
  actorRole: z.enum(userRoles).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>
