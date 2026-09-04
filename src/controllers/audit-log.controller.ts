import { listAuditLogs } from '../services/audit-log.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import { auditLogQuerySchema } from '../validators/audit-log.validator.js'

export const listAuditLogsController = asyncHandler(async (req, res) => {
  const query = auditLogQuerySchema.parse(req.query)
  const result = await listAuditLogs(query)

  res.status(200).json(result)
})
