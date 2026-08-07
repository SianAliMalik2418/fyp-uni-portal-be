import { Schema, model } from 'mongoose'

export const userRoles = ['student', 'teacher', 'hod', 'admin'] as const
export type UserRole = (typeof userRoles)[number]

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    role: { type: String, enum: userRoles, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const UserModel = model('User', userSchema)
