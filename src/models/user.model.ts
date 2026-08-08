import { Schema, model, type HydratedDocument } from 'mongoose'

export const userRoles = ['student', 'teacher', 'hod', 'admin'] as const
export type UserRole = (typeof userRoles)[number]

export interface User {
  fullName: string
  email: string
  registrationNumber?: string
  employeeId?: string
  role: UserRole
  passwordHash: string
  isActive: boolean
  mustChangePassword: boolean
  temporaryPasswordExpiresAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export type UserDocument = HydratedDocument<User>

const userSchema = new Schema<User>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    registrationNumber: { type: String, trim: true, unique: true, sparse: true },
    employeeId: { type: String, trim: true, unique: true, sparse: true },
    role: { type: String, enum: userRoles, required: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
    temporaryPasswordExpiresAt: { type: Date },
  },
  { timestamps: true }
)

export const UserModel = model('User', userSchema)
