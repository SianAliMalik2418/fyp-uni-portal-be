import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto'
import type { Types } from 'mongoose'
import { env } from '../config/env.js'
import { SessionModel } from '../models/session.model.js'
import { UserModel, type UserDocument, type UserRole } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'

const PASSWORD_KEY_LENGTH = 64

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  role: UserRole
  accountStatus: 'active' | 'inactive'
  isActive: boolean
  passwordChangeRequired: boolean
}

export interface AuthenticatedSession {
  token: string
  expiresAt: Date
  user: AuthenticatedUser
}

function sessionExpiry() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.SESSION_TTL_DAYS)
  return expiresAt
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':')

  if (!salt || !hash) {
    return false
  }

  const passwordHash = Buffer.from(hash, 'hex')
  const suppliedHash = scryptSync(password, salt, PASSWORD_KEY_LENGTH)

  return passwordHash.length === suppliedHash.length && timingSafeEqual(passwordHash, suppliedHash)
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function serializeUser(user: UserDocument): AuthenticatedUser {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    accountStatus: user.isActive ? 'active' : 'inactive',
    isActive: user.isActive,
    passwordChangeRequired: user.mustChangePassword,
  }
}

export async function findUserByEmail(email: string) {
  return UserModel.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash').exec()
}

export async function login(email: string, password: string): Promise<AuthenticatedSession> {
  const user = await findUserByEmail(email)

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new ApiError(401, 'Invalid login credentials')
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is inactive')
  }

  if (
    user.mustChangePassword &&
    user.temporaryPasswordExpiresAt &&
    user.temporaryPasswordExpiresAt < new Date()
  ) {
    throw new ApiError(403, 'Temporary password has expired')
  }

  const token = randomBytes(32).toString('base64url')
  const expiresAt = sessionExpiry()

  await SessionModel.create({
    userId: user._id,
    tokenHash: hashSessionToken(token),
    expiresAt,
    lastUsedAt: new Date(),
  })

  return {
    token,
    expiresAt,
    user: serializeUser(user),
  }
}

export async function resolveSession(token: string) {
  const session = await SessionModel.findOne({
    tokenHash: hashSessionToken(token),
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).exec()

  if (!session) {
    return null
  }

  const user = await UserModel.findById(session.userId).exec()

  if (!user || !user.isActive) {
    return null
  }

  session.lastUsedAt = new Date()
  await session.save()

  return { session, user }
}

export async function logout(token: string) {
  await SessionModel.updateOne(
    { tokenHash: hashSessionToken(token), revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  ).exec()
}

export async function changePassword(
  userId: Types.ObjectId,
  currentPassword: string,
  newPassword: string
) {
  const user = await UserModel.findById(userId).select('+passwordHash').exec()

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new ApiError(401, 'Current password is incorrect')
  }

  if (verifyPassword(newPassword, user.passwordHash)) {
    throw new ApiError(400, 'New password must be different from the current password')
  }

  user.passwordHash = hashPassword(newPassword)
  user.mustChangePassword = false
  user.temporaryPasswordExpiresAt = undefined
  await user.save()

  return serializeUser(user)
}
