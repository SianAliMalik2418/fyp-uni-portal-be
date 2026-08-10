import { Schema, model, type HydratedDocument } from 'mongoose'

export interface Department {
  name: string
  code: string
  description?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type DepartmentDocument = HydratedDocument<Department>

const departmentSchema = new Schema<Department>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const DepartmentModel = model('Department', departmentSchema)
