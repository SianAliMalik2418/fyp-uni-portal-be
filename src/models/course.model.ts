import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export interface Course {
  code: string
  title: string
  creditHours: number
  department: Types.ObjectId
  program: Types.ObjectId
  semester: Types.ObjectId
  description?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type CourseDocument = HydratedDocument<Course>

const courseSchema = new Schema<Course>(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    title: { type: String, required: true, trim: true },
    creditHours: { type: Number, required: true, min: 1, max: 6 },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

courseSchema.index({ program: 1, semester: 1, title: 1 }, { unique: true })

export const CourseModel = model('Course', courseSchema)
