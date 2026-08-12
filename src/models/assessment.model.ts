import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export const assessmentCategories = [
  'quiz',
  'assignment',
  'attendance',
  'presentation',
  'midterm',
  'final',
] as const
export type AssessmentCategory = (typeof assessmentCategories)[number]

export interface Assessment {
  courseOffering: Types.ObjectId
  teacher: Types.ObjectId
  name: string
  category: AssessmentCategory
  maximumMarks: number
  createdAt?: Date
  updatedAt?: Date
}

export type AssessmentDocument = HydratedDocument<Assessment>

const assessmentSchema = new Schema<Assessment>(
  {
    courseOffering: {
      type: Schema.Types.ObjectId,
      ref: 'CourseOffering',
      required: true,
      index: true,
    },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, enum: assessmentCategories, required: true, index: true },
    maximumMarks: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
)

assessmentSchema.index({ courseOffering: 1, name: 1 }, { unique: true })
assessmentSchema.index({ courseOffering: 1, category: 1, createdAt: 1 })

export const AssessmentModel = model('Assessment', assessmentSchema)
