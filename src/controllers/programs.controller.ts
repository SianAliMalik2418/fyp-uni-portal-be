import {
  createProgram,
  deleteProgram,
  listPrograms,
  updateProgram,
} from '../services/program.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  createProgramSchema,
  programParamsSchema,
  updateProgramSchema,
} from '../validators/program.validator.js'

export const listProgramsController = asyncHandler(async (_req, res) => {
  const programs = await listPrograms()

  res.status(200).json({ programs })
})

export const createProgramController = asyncHandler(async (req, res) => {
  const payload = createProgramSchema.parse(req.body)
  const program = await createProgram(payload)

  res.status(201).json({
    message: 'Program created',
    program,
  })
})

export const updateProgramController = asyncHandler(async (req, res) => {
  const { programId } = programParamsSchema.parse(req.params)
  const payload = updateProgramSchema.parse(req.body)
  const program = await updateProgram(programId, payload)

  res.status(200).json({
    message: 'Program updated',
    program,
  })
})

export const deleteProgramController = asyncHandler(async (req, res) => {
  const { programId } = programParamsSchema.parse(req.params)
  await deleteProgram(programId)

  res.status(200).json({ message: 'Program deleted' })
})
