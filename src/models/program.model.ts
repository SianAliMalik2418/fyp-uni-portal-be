import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export interface Program {
  name: string
  code: string
  department: Types.ObjectId
  totalSemesters: number
  duration: number
  durationUnit: 'years' | 'months'
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type ProgramDocument = HydratedDocument<Program>

const programSchema = new Schema<Program>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    totalSemesters: { type: Number, required: true, min: 1, max: 16 },
    duration: { type: Number, required: true, min: 1, max: 120 },
    durationUnit: { type: String, required: true, enum: ['years', 'months'], default: 'years' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

programSchema.index({ department: 1, name: 1 }, { unique: true })

export const ProgramModel = model('Program', programSchema)
