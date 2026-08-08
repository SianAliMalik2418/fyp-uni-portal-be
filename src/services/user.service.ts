import { UserModel, type UserDocument, type UserRole } from '../models/user.model.js'
import { hashPassword } from './auth.service.js'
import { ApiError } from '../utils/api-error.js'
import type { CreateUserPayload } from '../validators/user.validator.js'

export const DEFAULT_TEMPORARY_PASSWORD = '@Abc1234'

export interface ProvisionedUserAccount {
  id: string
  fullName: string
  email: string
  role: UserRole
  registrationNumber?: string
  employeeId?: string
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

export function serializeUserAccount(user: UserDocument): ProvisionedUserAccount {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    registrationNumber: user.registrationNumber,
    employeeId: user.employeeId,
    accountStatus: user.isActive ? 'active' : 'inactive',
    isActive: user.isActive,
    passwordChangeRequired: user.mustChangePassword,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export async function listUsers() {
  const users = await UserModel.find().sort({ role: 1, fullName: 1 }).select('-passwordHash').exec()

  return users.map(serializeUserAccount)
}

export async function createUser(payload: CreateUserPayload): Promise<CreatedUserAccount> {
  const email = payload.email.trim().toLowerCase()
  const existingUser = await UserModel.exists({ email }).exec()

  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists')
  }

  const temporaryPassword = DEFAULT_TEMPORARY_PASSWORD
  const user = await UserModel.create({
    fullName: payload.fullName.trim(),
    email,
    role: payload.role,
    registrationNumber: optionalString(payload.registrationNumber),
    employeeId: optionalString(payload.employeeId),
    passwordHash: hashPassword(temporaryPassword),
    isActive: payload.isActive,
    mustChangePassword: true,
  })

  return {
    user: serializeUserAccount(user),
    temporaryPassword,
  }
}
