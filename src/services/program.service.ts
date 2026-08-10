import { isValidObjectId, type Types } from 'mongoose'
import { DepartmentModel, type DepartmentDocument } from '../models/department.model.js'
import { ProgramModel, type ProgramDocument } from '../models/program.model.js'
import { ApiError } from '../utils/api-error.js'
import type { CreateProgramPayload, UpdateProgramPayload } from '../validators/program.validator.js'

export interface SerializedProgramDepartment {
  id: string
  name: string
  code: string
  isActive: boolean
}

export interface SerializedProgram {
  id: string
  name: string
  code: string
  department: SerializedProgramDepartment
  totalSemesters: number
  duration: number
  durationUnit: 'years' | 'months'
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function ensureValidObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} ID`)
  }
}

function isPopulatedDepartment(
  value: Types.ObjectId | DepartmentDocument
): value is DepartmentDocument {
  return typeof value === 'object' && 'name' in value && 'code' in value
}

function serializeProgramDepartment(department: DepartmentDocument): SerializedProgramDepartment {
  return {
    id: department.id,
    name: department.name,
    code: department.code,
    isActive: department.isActive,
  }
}

export function serializeProgram(program: ProgramDocument): SerializedProgram {
  if (!isPopulatedDepartment(program.department)) {
    throw new ApiError(500, 'Program department was not loaded')
  }

  return {
    id: program.id,
    name: program.name,
    code: program.code,
    department: serializeProgramDepartment(program.department),
    totalSemesters: program.totalSemesters,
    duration: program.duration,
    durationUnit: program.durationUnit,
    isActive: program.isActive,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
  }
}

async function resolveDepartment(departmentId: string) {
  ensureValidObjectId(departmentId, 'department')

  const department = await DepartmentModel.findById(departmentId).exec()

  if (!department) {
    throw new ApiError(400, 'Department not found')
  }

  return department
}

async function assertProgramIsUnique(
  payload: Pick<CreateProgramPayload, 'name' | 'code' | 'departmentId'>,
  currentProgramId?: string
) {
  const duplicate = await ProgramModel.findOne({
    ...(currentProgramId ? { _id: { $ne: currentProgramId } } : {}),
    $or: [
      { code: normalizeCode(payload.code) },
      {
        department: payload.departmentId,
        name: new RegExp(`^${escapeRegExp(payload.name.trim())}$`, 'i'),
      },
    ],
  })
    .select('_id code name department')
    .exec()

  if (!duplicate) {
    return
  }

  if (duplicate.code === normalizeCode(payload.code)) {
    throw new ApiError(409, 'A program with this code already exists')
  }

  throw new ApiError(409, 'A program with this name already exists in this department')
}

async function findProgramById(programId: string) {
  ensureValidObjectId(programId, 'program')

  const program = await ProgramModel.findById(programId).exec()

  if (!program) {
    throw new ApiError(404, 'Program not found')
  }

  return program
}

async function populateProgramDepartment(program: ProgramDocument) {
  await program.populate('department')
  return program
}

export async function listPrograms() {
  const programs = await ProgramModel.find()
    .sort({ name: 1 })
    .populate<{ department: DepartmentDocument }>('department')
    .exec()

  return programs.map((program) => serializeProgram(program as unknown as ProgramDocument))
}

export async function createProgram(payload: CreateProgramPayload) {
  const department = await resolveDepartment(payload.departmentId)
  await assertProgramIsUnique({ ...payload, departmentId: department.id })

  const program = await ProgramModel.create({
    name: payload.name.trim(),
    code: normalizeCode(payload.code),
    department: department._id,
    totalSemesters: payload.totalSemesters,
    duration: payload.duration,
    durationUnit: payload.durationUnit,
    isActive: payload.isActive,
  })

  return serializeProgram(await populateProgramDepartment(program))
}

export async function updateProgram(programId: string, payload: UpdateProgramPayload) {
  const program = await findProgramById(programId)
  const department = payload.departmentId ? await resolveDepartment(payload.departmentId) : null

  const nextDepartmentId = department?.id ?? program.department.toString()
  const nextName = payload.name?.trim() ?? program.name
  const nextCode = payload.code ? normalizeCode(payload.code) : program.code

  if (payload.name || payload.code || payload.departmentId) {
    await assertProgramIsUnique(
      { name: nextName, code: nextCode, departmentId: nextDepartmentId },
      programId
    )
  }

  program.name = nextName
  program.code = nextCode

  if (department) {
    program.department = department._id
  }

  if (payload.totalSemesters !== undefined) {
    program.totalSemesters = payload.totalSemesters
  }

  if (payload.duration !== undefined) {
    program.duration = payload.duration
  }

  if (payload.durationUnit !== undefined) {
    program.durationUnit = payload.durationUnit
  }

  if (payload.isActive !== undefined) {
    program.isActive = payload.isActive
  }

  await program.save()

  return serializeProgram(await populateProgramDepartment(program))
}

export async function deleteProgram(programId: string) {
  ensureValidObjectId(programId, 'program')

  const program = await ProgramModel.findByIdAndDelete(programId).exec()

  if (!program) {
    throw new ApiError(404, 'Program not found')
  }
}
