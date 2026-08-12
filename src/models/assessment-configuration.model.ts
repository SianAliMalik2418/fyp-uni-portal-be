import { Schema, model, type HydratedDocument } from 'mongoose'
import { assessmentCategories, type AssessmentCategory } from './assessment.model.js'

export const ASSESSMENT_CONFIGURATION_KEY = 'assessment-structure'

export interface AssessmentCategoryWeight {
  id: AssessmentCategory
  weightPercentage: number
}

export interface AssessmentConfiguration {
  key: typeof ASSESSMENT_CONFIGURATION_KEY
  categories: AssessmentCategoryWeight[]
  createdAt?: Date
  updatedAt?: Date
}

export type AssessmentConfigurationDocument = HydratedDocument<AssessmentConfiguration>

const assessmentCategoryWeightSchema = new Schema<AssessmentCategoryWeight>(
  {
    id: { type: String, enum: assessmentCategories, required: true },
    weightPercentage: { type: Number, min: 0.01, max: 100, required: true },
  },
  { _id: false }
)

const assessmentConfigurationSchema = new Schema<AssessmentConfiguration>(
  {
    key: {
      type: String,
      enum: [ASSESSMENT_CONFIGURATION_KEY],
      default: ASSESSMENT_CONFIGURATION_KEY,
      required: true,
      unique: true,
      immutable: true,
    },
    categories: { type: [assessmentCategoryWeightSchema], required: true },
  },
  { timestamps: true }
)

export const AssessmentConfigurationModel = model(
  'AssessmentConfiguration',
  assessmentConfigurationSchema
)
