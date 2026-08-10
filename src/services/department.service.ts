import { isValidObjectId } from 'mongoose'
import { DepartmentModel, type DepartmentDocument } from '../models/department.model.js'
import { ApiError } from '../utils/api-error.js'
import type {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '../validators/department.validator.js'

export interface SerializedDepartment {
  id: string
  name: string
  code: string
  description?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

function optionalString(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function ensureValidDepartmentId(departmentId: string) {
  if (!isValidObjectId(departmentId)) {
    throw new ApiError(400, 'Invalid department ID')
  }
}

export function serializeDepartment(department: DepartmentDocument): SerializedDepartment {
  return {
    id: department.id,
    name: department.name,
    code: department.code,
    description: department.description,
    isActive: department.isActive,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  }
}

async function assertDepartmentIsUnique(
  payload: Pick<CreateDepartmentPayload, 'name' | 'code'>,
  currentDepartmentId?: string
) {
  const duplicate = await DepartmentModel.findOne({
    ...(currentDepartmentId ? { _id: { $ne: currentDepartmentId } } : {}),
    $or: [
      { code: normalizeCode(payload.code) },
      { name: new RegExp(`^${escapeRegExp(payload.name.trim())}$`, 'i') },
    ],
  })
    .select('_id code name')
    .exec()

  if (!duplicate) {
    return
  }

  if (duplicate.code === normalizeCode(payload.code)) {
    throw new ApiError(409, 'A department with this code already exists')
  }

  throw new ApiError(409, 'A department with this name already exists')
}

export async function listDepartments() {
  const departments = await DepartmentModel.find().sort({ name: 1 }).exec()

  return departments.map(serializeDepartment)
}

export async function createDepartment(payload: CreateDepartmentPayload) {
  await assertDepartmentIsUnique(payload)

  const department = await DepartmentModel.create({
    name: payload.name.trim(),
    code: normalizeCode(payload.code),
    description: optionalString(payload.description),
    isActive: payload.isActive,
  })

  return serializeDepartment(department)
}

export async function updateDepartment(departmentId: string, payload: UpdateDepartmentPayload) {
  ensureValidDepartmentId(departmentId)

  const department = await DepartmentModel.findById(departmentId).exec()

  if (!department) {
    throw new ApiError(404, 'Department not found')
  }

  const nextName = payload.name?.trim() ?? department.name
  const nextCode = payload.code ? normalizeCode(payload.code) : department.code

  if (payload.name || payload.code) {
    await assertDepartmentIsUnique({ name: nextName, code: nextCode }, departmentId)
  }

  department.name = nextName
  department.code = nextCode
  department.description =
    payload.description === undefined ? department.description : optionalString(payload.description)

  if (payload.isActive !== undefined) {
    department.isActive = payload.isActive
  }

  await department.save()

  return serializeDepartment(department)
}

export async function deleteDepartment(departmentId: string) {
  ensureValidDepartmentId(departmentId)

  const department = await DepartmentModel.findByIdAndDelete(departmentId).exec()

  if (!department) {
    throw new ApiError(404, 'Department not found')
  }
}
