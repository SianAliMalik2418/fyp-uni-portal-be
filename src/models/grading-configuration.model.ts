import { Schema, model, type HydratedDocument } from 'mongoose'

export const GRADING_CONFIGURATION_KEY = 'university-grading-scale'

export interface GradeRange {
  minimumPercentage: number
  maximumPercentage: number
  letterGrade: string
  gradePoint: number
}

export interface GradingConfiguration {
  key: typeof GRADING_CONFIGURATION_KEY
  ranges: GradeRange[]
  createdAt?: Date
  updatedAt?: Date
}

export type GradingConfigurationDocument = HydratedDocument<GradingConfiguration>

const gradeRangeSchema = new Schema<GradeRange>(
  {
    minimumPercentage: { type: Number, required: true, min: 0, max: 100 },
    maximumPercentage: { type: Number, required: true, min: 0, max: 100 },
    letterGrade: { type: String, required: true, trim: true, maxlength: 10 },
    gradePoint: { type: Number, required: true, min: 0, max: 4 },
  },
  { _id: false }
)

const gradingConfigurationSchema = new Schema<GradingConfiguration>(
  {
    key: {
      type: String,
      enum: [GRADING_CONFIGURATION_KEY],
      default: GRADING_CONFIGURATION_KEY,
      unique: true,
    },
    ranges: { type: [gradeRangeSchema], required: true },
  },
  { timestamps: true }
)

export const GradingConfigurationModel = model('GradingConfiguration', gradingConfigurationSchema)
