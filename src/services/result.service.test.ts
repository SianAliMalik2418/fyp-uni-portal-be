import { describe, expect, it } from 'vitest'
import { calculateCreditWeightedGpa, mapPercentageToGrade } from './result.service.js'

describe('result calculations', () => {
  it('maps boundary percentages to the configured letter grade and grade point', () => {
    expect(mapPercentageToGrade(85)).toEqual({ letterGrade: 'A', gradePoint: 4 })
    expect(mapPercentageToGrade(84.99)).toEqual({ letterGrade: 'A-', gradePoint: 3.7 })
    expect(mapPercentageToGrade(50)).toEqual({ letterGrade: 'D', gradePoint: 1 })
    expect(mapPercentageToGrade(49.99)).toEqual({ letterGrade: 'F', gradePoint: 0 })
  })

  it('calculates GPA and CGPA using course credit hours', () => {
    expect(
      calculateCreditWeightedGpa([
        { creditHours: 3, gradePoint: 4 },
        { creditHours: 2, gradePoint: 3 },
        { creditHours: 1, gradePoint: 2.7 },
      ])
    ).toBe(3.45)
    expect(calculateCreditWeightedGpa([])).toBe(0)
  })
})
