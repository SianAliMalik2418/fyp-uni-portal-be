import { Schema, model, type HydratedDocument } from 'mongoose'

export interface Semester {
  name: string
  academicYear: string
  startsAt?: Date
  endsAt?: Date
  isActive: boolean
  isClosed: boolean
  closedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export type SemesterDocument = HydratedDocument<Semester>

const semesterSchema = new Schema<Semester>(
  {
    name: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    isActive: { type: Boolean, default: false },
    isClosed: { type: Boolean, default: false },
    closedAt: { type: Date },
  },
  { timestamps: true }
)

semesterSchema.index({ name: 1, academicYear: 1 }, { unique: true })
semesterSchema.index({ isActive: 1 })

export const SemesterModel = model('Semester', semesterSchema)
