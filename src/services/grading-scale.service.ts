import {
  GRADING_CONFIGURATION_KEY,
  GradingConfigurationModel,
  type GradeRange,
} from '../models/grading-configuration.model.js'
import { ApiError } from '../utils/api-error.js'
import type { GradingScalePayload } from '../validators/academic-performance.validator.js'

export const defaultGradingScale: GradeRange[] = [
  { minimumPercentage: 85, maximumPercentage: 100, letterGrade: 'A', gradePoint: 4 },
  { minimumPercentage: 80, maximumPercentage: 84.99, letterGrade: 'A-', gradePoint: 3.7 },
  { minimumPercentage: 75, maximumPercentage: 79.99, letterGrade: 'B+', gradePoint: 3.3 },
  { minimumPercentage: 70, maximumPercentage: 74.99, letterGrade: 'B', gradePoint: 3 },
  { minimumPercentage: 65, maximumPercentage: 69.99, letterGrade: 'B-', gradePoint: 2.7 },
  { minimumPercentage: 61, maximumPercentage: 64.99, letterGrade: 'C+', gradePoint: 2.3 },
  { minimumPercentage: 58, maximumPercentage: 60.99, letterGrade: 'C', gradePoint: 2 },
  { minimumPercentage: 55, maximumPercentage: 57.99, letterGrade: 'C-', gradePoint: 1.7 },
  { minimumPercentage: 50, maximumPercentage: 54.99, letterGrade: 'D', gradePoint: 1 },
  { minimumPercentage: 0, maximumPercentage: 49.99, letterGrade: 'F', gradePoint: 0 },
]

export type GradingScale = {
  ranges: GradeRange[]
  updatedAt?: Date
}

export async function getGradingScale(): Promise<GradingScale> {
  const configuration = await GradingConfigurationModel.findOne({
    key: GRADING_CONFIGURATION_KEY,
  }).exec()

  return {
    ranges: configuration?.ranges ?? defaultGradingScale,
    updatedAt: configuration?.updatedAt,
  }
}

export async function updateGradingScale(payload: GradingScalePayload): Promise<GradingScale> {
  const configuration = await GradingConfigurationModel.findOneAndUpdate(
    { key: GRADING_CONFIGURATION_KEY },
    {
      $set: { ranges: payload.ranges },
      $setOnInsert: { key: GRADING_CONFIGURATION_KEY },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).exec()

  return { ranges: configuration!.ranges, updatedAt: configuration!.updatedAt }
}

export function mapPercentageToGrade(
  percentage: number,
  gradingScale: GradeRange[] = defaultGradingScale
) {
  const grade = gradingScale.find(
    (range) => percentage >= range.minimumPercentage && percentage <= range.maximumPercentage
  )

  if (!grade) {
    throw new ApiError(500, 'The grading scale does not cover this result percentage')
  }

  return { letterGrade: grade.letterGrade, gradePoint: grade.gradePoint }
}
