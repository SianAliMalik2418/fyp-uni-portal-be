import { describe, expect, it } from 'vitest'
import { activeAssessmentCategories } from './assessment.service.js'

describe('active assessment categories', () => {
  it('uses the approved university weights totaling 100 percent', () => {
    expect(activeAssessmentCategories).toEqual([
      { id: 'quiz', label: 'Quizzes', weightPercentage: 10 },
      { id: 'assignment', label: 'Assignments', weightPercentage: 10 },
      { id: 'attendance', label: 'Attendance', weightPercentage: 10 },
      { id: 'presentation', label: 'Presentation', weightPercentage: 10 },
      { id: 'midterm', label: 'Midterm', weightPercentage: 25 },
      { id: 'final', label: 'Final', weightPercentage: 35 },
    ])
    expect(
      activeAssessmentCategories.reduce((total, category) => total + category.weightPercentage, 0)
    ).toBe(100)
  })
})
