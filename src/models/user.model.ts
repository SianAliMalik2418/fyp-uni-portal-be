import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export const userRoles = ['student', 'teacher', 'hod', 'admin'] as const
export type UserRole = (typeof userRoles)[number]
export const studentAcademicStatuses = [
  'active',
  'frozen',
  'repeating',
  'dropped',
  'graduated',
] as const
export type StudentAcademicStatus = (typeof studentAcademicStatuses)[number]

export interface User {
  fullName: string
  email: string
  phoneNumber?: string
  registrationNumber?: string
  employeeId?: string
  department?: Types.ObjectId
  program?: Types.ObjectId
  batch?: Types.ObjectId
  semester?: Types.ObjectId
  section?: Types.ObjectId
  academicStatus?: StudentAcademicStatus
  designation?: string
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
    phoneNumber: { type: String, trim: true },
    registrationNumber: { type: String, trim: true, unique: true, sparse: true },
    employeeId: { type: String, trim: true, unique: true, sparse: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', index: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', index: true },
    semester: { type: Schema.Types.ObjectId, ref: 'Semester', index: true },
    section: { type: Schema.Types.ObjectId, ref: 'Section', index: true },
    academicStatus: { type: String, enum: studentAcademicStatuses },
    designation: { type: String, trim: true },
    role: { type: String, enum: userRoles, required: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
    temporaryPasswordExpiresAt: { type: Date },
  },
  { timestamps: true }
)

export const UserModel = model('User', userSchema)
