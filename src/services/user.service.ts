import { isValidObjectId, type Types } from 'mongoose'
import { BatchModel, type BatchDocument } from '../models/batch.model.js'
import { DepartmentModel, type DepartmentDocument } from '../models/department.model.js'
import { ProgramModel, type ProgramDocument } from '../models/program.model.js'
import { SectionModel, type SectionDocument } from '../models/section.model.js'
import { SemesterModel, type SemesterDocument } from '../models/semester.model.js'
import {
  UserModel,
  type StudentAcademicStatus,
  type UserDocument,
  type UserRole,
} from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'
import type { CreateUserPayload, UpdateUserPayload } from '../validators/user.validator.js'
import { hashPassword } from './auth.service.js'
import { syncStudentEnrollments } from './course.service.js'

export const DEFAULT_TEMPORARY_PASSWORD = '@Abc1234'

type UserProfilePayload = CreateUserPayload | UpdateUserPayload

export interface ProvisionedUserAccount {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  role: UserRole
  registrationNumber?: string
  employeeId?: string
  department?: { id: string; name: string; code: string; isActive: boolean }
  program?: { id: string; name: string; code: string; isActive: boolean }
  batch?: {
    id: string
    name: string
    startingYear: number
    expectedGraduationYear: number
    isActive: boolean
  }
  semester?: {
    id: string
    name: string
    academicYear: string
    isActive: boolean
    isClosed: boolean
  }
  section?: { id: string; name: string; isActive: boolean }
  academicStatus?: StudentAcademicStatus
  designation?: string
  accountStatus: 'active' | 'inactive'
  isActive: boolean
  passwordChangeRequired: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface CreatedUserAccount {
  user: ProvisionedUserAccount
  temporaryPassword: string
}

function optionalString(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined
}

function ensureValidObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} ID`)
  }
}

function isPopulatedDepartment(
  value: Types.ObjectId | DepartmentDocument | undefined
): value is DepartmentDocument {
  return Boolean(value && typeof value === 'object' && 'code' in value && 'name' in value)
}

function isPopulatedProgram(
  value: Types.ObjectId | ProgramDocument | undefined
): value is ProgramDocument {
  return Boolean(value && typeof value === 'object' && 'code' in value && 'totalSemesters' in value)
}

function isPopulatedBatch(
  value: Types.ObjectId | BatchDocument | undefined
): value is BatchDocument {
  return Boolean(value && typeof value === 'object' && 'startingYear' in value)
}

function isPopulatedSemester(
  value: Types.ObjectId | SemesterDocument | undefined
): value is SemesterDocument {
  return Boolean(value && typeof value === 'object' && 'academicYear' in value)
}

function isPopulatedSection(
  value: Types.ObjectId | SectionDocument | undefined
): value is SectionDocument {
  return Boolean(value && typeof value === 'object' && 'program' in value && 'batch' in value)
}

function serializeDepartment(department: DepartmentDocument) {
  return {
    id: department.id,
    name: department.name,
    code: department.code,
    isActive: department.isActive,
  }
}

function serializeProgram(program: ProgramDocument) {
  return {
    id: program.id,
    name: program.name,
    code: program.code,
    isActive: program.isActive,
  }
}

function serializeBatch(batch: BatchDocument) {
  return {
    id: batch.id,
    name: batch.name,
    startingYear: batch.startingYear,
    expectedGraduationYear: batch.expectedGraduationYear,
    isActive: batch.isActive,
  }
}

function serializeSemester(semester: SemesterDocument) {
  return {
    id: semester.id,
    name: semester.name,
    academicYear: semester.academicYear,
    isActive: semester.isActive,
    isClosed: semester.isClosed,
  }
}

function serializeSection(section: SectionDocument) {
  return {
    id: section.id,
    name: section.name,
    isActive: section.isActive,
  }
}

export function serializeUserAccount(user: UserDocument): ProvisionedUserAccount {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    registrationNumber: user.registrationNumber,
    employeeId: user.employeeId,
    department: isPopulatedDepartment(user.department)
      ? serializeDepartment(user.department)
      : undefined,
    program: isPopulatedProgram(user.program) ? serializeProgram(user.program) : undefined,
    batch: isPopulatedBatch(user.batch) ? serializeBatch(user.batch) : undefined,
    semester: isPopulatedSemester(user.semester) ? serializeSemester(user.semester) : undefined,
    section: isPopulatedSection(user.section) ? serializeSection(user.section) : undefined,
    academicStatus: user.academicStatus,
    designation: user.designation,
    accountStatus: user.isActive ? 'active' : 'inactive',
    isActive: user.isActive,
    passwordChangeRequired: user.mustChangePassword,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

async function populateUserProfile(user: UserDocument) {
  await user.populate(['department', 'program', 'batch', 'semester', 'section'])
  return user
}

async function findUserById(userId: string) {
  ensureValidObjectId(userId, 'user')

  const user = await UserModel.findById(userId).select('-passwordHash').exec()

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  return user
}

async function resolveDepartment(departmentId: string) {
  ensureValidObjectId(departmentId, 'department')
  const department = await DepartmentModel.findById(departmentId).exec()

  if (!department) {
    throw new ApiError(400, 'Department not found')
  }

  return department
}

async function resolveProgram(programId: string, departmentId: string) {
  ensureValidObjectId(programId, 'program')
  const program = await ProgramModel.findById(programId).exec()

  if (!program) {
    throw new ApiError(400, 'Program not found')
  }

  if (program.department.toString() !== departmentId) {
    throw new ApiError(400, 'Program does not belong to the selected department')
  }

  return program
}

async function resolveBatch(batchId: string, programId: string) {
  ensureValidObjectId(batchId, 'batch')
  const batch = await BatchModel.findById(batchId).exec()

  if (!batch) {
    throw new ApiError(400, 'Batch not found')
  }

  if (batch.program.toString() !== programId) {
    throw new ApiError(400, 'Batch does not belong to the selected program')
  }

  return batch
}

async function resolveSemester(semesterId: string) {
  ensureValidObjectId(semesterId, 'semester')
  const semester = await SemesterModel.findById(semesterId).exec()

  if (!semester) {
    throw new ApiError(400, 'Semester not found')
  }

  return semester
}

async function resolveSection(
  sectionId: string,
  programId: string,
  batchId: string,
  semesterId: string
) {
  ensureValidObjectId(sectionId, 'section')
  const section = await SectionModel.findById(sectionId).exec()

  if (!section) {
    throw new ApiError(400, 'Section not found')
  }

  if (
    section.program.toString() !== programId ||
    section.batch.toString() !== batchId ||
    section.semester.toString() !== semesterId
  ) {
    throw new ApiError(400, 'Section does not match the selected program, batch, and semester')
  }

  return section
}

async function assertUserIdentifiersAreUnique(payload: UserProfilePayload, currentUserId?: string) {
  const email = payload.email.trim().toLowerCase()
  const registrationNumber = optionalString(payload.registrationNumber)
  const employeeId = optionalString(payload.employeeId)
  const duplicate = await UserModel.findOne({
    ...(currentUserId ? { _id: { $ne: currentUserId } } : {}),
    $or: [
      { email },
      ...(registrationNumber ? [{ registrationNumber }] : []),
      ...(employeeId ? [{ employeeId }] : []),
    ],
  })
    .select('email registrationNumber employeeId')
    .exec()

  if (!duplicate) {
    return
  }

  if (duplicate.email === email) {
    throw new ApiError(409, 'A user with this email already exists')
  }

  if (registrationNumber && duplicate.registrationNumber === registrationNumber) {
    throw new ApiError(409, 'A student with this registration number already exists')
  }

  throw new ApiError(409, 'A teacher or HOD with this employee ID already exists')
}

async function resolveProfileReferences(payload: UserProfilePayload) {
  if (payload.role === 'admin') {
    return {}
  }

  const department = payload.departmentId ? await resolveDepartment(payload.departmentId) : null

  if (payload.role === 'teacher' || payload.role === 'hod') {
    return { department }
  }

  if (!department) {
    throw new ApiError(400, 'Department is required')
  }

  if (!payload.programId || !payload.batchId || !payload.semesterId || !payload.sectionId) {
    throw new ApiError(400, 'Student academic structure is required')
  }

  const program = await resolveProgram(payload.programId, department.id)
  const batch = await resolveBatch(payload.batchId, program.id)
  const semester = await resolveSemester(payload.semesterId)
  const section = await resolveSection(payload.sectionId, program.id, batch.id, semester.id)

  return { department, program, batch, semester, section }
}

function assignUserProfile(
  user: UserDocument,
  payload: UserProfilePayload,
  references: Awaited<ReturnType<typeof resolveProfileReferences>>
) {
  user.fullName = payload.fullName.trim()
  user.email = payload.email.trim().toLowerCase()
  user.phoneNumber = optionalString(payload.phoneNumber)
  user.role = payload.role
  user.isActive = payload.isActive

  user.registrationNumber =
    payload.role === 'student' ? optionalString(payload.registrationNumber) : undefined
  user.employeeId =
    payload.role === 'teacher' || payload.role === 'hod'
      ? optionalString(payload.employeeId)
      : undefined
  user.department = references.department?._id
  user.program = references.program?._id
  user.batch = references.batch?._id
  user.semester = references.semester?._id
  user.section = references.section?._id
  user.academicStatus = payload.role === 'student' ? payload.academicStatus : undefined
  user.designation = payload.role === 'teacher' ? optionalString(payload.designation) : undefined
}

export async function listUsers() {
  const users = await UserModel.find()
    .sort({ role: 1, fullName: 1 })
    .select('-passwordHash')
    .populate(['department', 'program', 'batch', 'semester', 'section'])
    .exec()

  return users.map((user) => serializeUserAccount(user as unknown as UserDocument))
}

export async function getUser(userId: string) {
  const user = await findUserById(userId)
  return serializeUserAccount(await populateUserProfile(user))
}

export async function createUser(payload: CreateUserPayload): Promise<CreatedUserAccount> {
  await assertUserIdentifiersAreUnique(payload)
  const references = await resolveProfileReferences(payload)
  const temporaryPassword = DEFAULT_TEMPORARY_PASSWORD
  const user = new UserModel({
    passwordHash: hashPassword(temporaryPassword),
    mustChangePassword: true,
  })

  assignUserProfile(user, payload, references)
  await user.save()
  await syncStudentEnrollments(user.id)

  return {
    user: serializeUserAccount(await populateUserProfile(user)),
    temporaryPassword,
  }
}

export async function updateUser(userId: string, payload: UpdateUserPayload) {
  const user = await findUserById(userId)

  await assertUserIdentifiersAreUnique(payload, user.id)
  const references = await resolveProfileReferences(payload)
  assignUserProfile(user, payload, references)
  await user.save()
  await syncStudentEnrollments(user.id)

  return serializeUserAccount(await populateUserProfile(user))
}

export async function deleteUser(userId: string) {
  ensureValidObjectId(userId, 'user')
  const deletedUser = await UserModel.findByIdAndDelete(userId).exec()

  if (!deletedUser) {
    throw new ApiError(404, 'User not found')
  }
}

export async function resetUserPassword(userId: string): Promise<CreatedUserAccount> {
  const user = await findUserById(userId)
  const temporaryPassword = DEFAULT_TEMPORARY_PASSWORD

  user.passwordHash = hashPassword(temporaryPassword)
  user.mustChangePassword = true
  user.temporaryPasswordExpiresAt = undefined
  await user.save()

  return {
    user: serializeUserAccount(await populateUserProfile(user)),
    temporaryPassword,
  }
}
