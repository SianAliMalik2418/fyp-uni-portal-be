import { isValidObjectId, type Types } from 'mongoose'
import { BatchModel, type BatchDocument } from '../models/batch.model.js'
import { ProgramModel, type ProgramDocument } from '../models/program.model.js'
import { ApiError } from '../utils/api-error.js'
import type { CreateBatchPayload, UpdateBatchPayload } from '../validators/batch.validator.js'

export interface SerializedBatchProgram {
  id: string
  name: string
  code: string
  isActive: boolean
}

export interface SerializedBatch {
  id: string
  name: string
  program: SerializedBatchProgram
  startingYear: number
  expectedGraduationYear: number
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

function ensureValidObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} ID`)
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isPopulatedProgram(value: Types.ObjectId | ProgramDocument): value is ProgramDocument {
  return typeof value === 'object' && 'name' in value && 'code' in value
}

function serializeProgram(program: ProgramDocument): SerializedBatchProgram {
  return {
    id: program.id,
    name: program.name,
    code: program.code,
    isActive: program.isActive,
  }
}

export function serializeBatch(batch: BatchDocument): SerializedBatch {
  if (!isPopulatedProgram(batch.program)) {
    throw new ApiError(500, 'Batch program was not loaded')
  }

  return {
    id: batch.id,
    name: batch.name,
    program: serializeProgram(batch.program),
    startingYear: batch.startingYear,
    expectedGraduationYear: batch.expectedGraduationYear,
    isActive: batch.isActive,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  }
}

async function resolveProgram(programId: string) {
  ensureValidObjectId(programId, 'program')

  const program = await ProgramModel.findById(programId).exec()

  if (!program) {
    throw new ApiError(400, 'Program not found')
  }

  return program
}

async function assertBatchIsUnique(
  payload: Pick<CreateBatchPayload, 'name' | 'programId' | 'startingYear'>,
  currentBatchId?: string
) {
  const duplicate = await BatchModel.findOne({
    ...(currentBatchId ? { _id: { $ne: currentBatchId } } : {}),
    program: payload.programId,
    $or: [
      { name: new RegExp(`^${escapeRegExp(payload.name.trim())}$`, 'i') },
      { startingYear: payload.startingYear },
    ],
  })
    .select('_id name startingYear')
    .exec()

  if (!duplicate) {
    return
  }

  if (duplicate.startingYear === payload.startingYear) {
    throw new ApiError(409, 'A batch with this starting year already exists for this program')
  }

  throw new ApiError(409, 'A batch with this name already exists for this program')
}

async function findBatchById(batchId: string) {
  ensureValidObjectId(batchId, 'batch')

  const batch = await BatchModel.findById(batchId).exec()

  if (!batch) {
    throw new ApiError(404, 'Batch not found')
  }

  return batch
}

async function populateBatchProgram(batch: BatchDocument) {
  await batch.populate('program')
  return batch
}

export async function listBatches() {
  const batches = await BatchModel.find()
    .sort({ startingYear: -1, name: 1 })
    .populate<{ program: ProgramDocument }>('program')
    .exec()

  return batches.map((batch) => serializeBatch(batch as unknown as BatchDocument))
}

export async function createBatch(payload: CreateBatchPayload) {
  const program = await resolveProgram(payload.programId)
  await assertBatchIsUnique({ ...payload, programId: program.id })

  const batch = await BatchModel.create({
    name: payload.name.trim(),
    program: program._id,
    startingYear: payload.startingYear,
    expectedGraduationYear: payload.expectedGraduationYear,
    isActive: payload.isActive,
  })

  return serializeBatch(await populateBatchProgram(batch))
}

export async function updateBatch(batchId: string, payload: UpdateBatchPayload) {
  const batch = await findBatchById(batchId)
  const program = payload.programId ? await resolveProgram(payload.programId) : null
  const nextProgramId = program?.id ?? batch.program.toString()
  const nextName = payload.name?.trim() ?? batch.name
  const nextStartingYear = payload.startingYear ?? batch.startingYear
  const nextGraduationYear = payload.expectedGraduationYear ?? batch.expectedGraduationYear

  if (nextGraduationYear < nextStartingYear) {
    throw new ApiError(400, 'Expected graduation year must be after starting year')
  }

  if (payload.name || payload.programId || payload.startingYear) {
    await assertBatchIsUnique(
      { name: nextName, programId: nextProgramId, startingYear: nextStartingYear },
      batchId
    )
  }

  batch.name = nextName
  batch.startingYear = nextStartingYear
  batch.expectedGraduationYear = nextGraduationYear

  if (program) {
    batch.program = program._id
  }

  if (payload.isActive !== undefined) {
    batch.isActive = payload.isActive
  }

  await batch.save()

  return serializeBatch(await populateBatchProgram(batch))
}

export async function deleteBatch(batchId: string) {
  ensureValidObjectId(batchId, 'batch')

  const batch = await BatchModel.findByIdAndDelete(batchId).exec()

  if (!batch) {
    throw new ApiError(404, 'Batch not found')
  }
}
