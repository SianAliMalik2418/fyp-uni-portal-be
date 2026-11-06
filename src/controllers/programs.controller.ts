import {
  createProgram,
  deleteProgram,
  listPrograms,
  updateProgram,
} from '../services/program.service.js'
import { recordAuditLog } from '../services/audit-log.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  createProgramSchema,
  programListQuerySchema,
  programParamsSchema,
  updateProgramSchema,
} from '../validators/program.validator.js'

export const listProgramsController = asyncHandler(async (req, res) => {
  const query = programListQuerySchema.parse(req.query)
  const result = await listPrograms(query)

  res.status(200).json(result)
})

export const createProgramController = asyncHandler(async (req, res) => {
  const payload = createProgramSchema.parse(req.body)
  const program = await createProgram(payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'created',
    module: 'programs',
    affectedRecord: { id: program.id, label: program.name },
  })

  res.status(201).json({
    message: 'Program created',
    program,
  })
})

export const updateProgramController = asyncHandler(async (req, res) => {
  const { programId } = programParamsSchema.parse(req.params)
  const payload = updateProgramSchema.parse(req.body)
  const program = await updateProgram(programId, payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'updated',
    module: 'programs',
    affectedRecord: { id: program.id, label: program.name },
  })

  res.status(200).json({
    message: 'Program updated',
    program,
  })
})

export const deleteProgramController = asyncHandler(async (req, res) => {
  const { programId } = programParamsSchema.parse(req.params)
  await deleteProgram(programId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'deleted',
    module: 'programs',
    affectedRecord: { id: programId },
  })

  res.status(200).json({ message: 'Program deleted' })
})
