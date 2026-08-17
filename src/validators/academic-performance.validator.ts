import { z } from 'zod'
import { attendanceStatuses } from '../models/attendance-session.model.js'
import { assessmentCategories } from '../models/assessment.model.js'
import { markStatuses } from '../models/mark-sheet.model.js'

export const academicPerformanceOfferingParamsSchema = z.object({
  offeringId: z.string().trim().min(1, 'Course offering ID is required'),
})

export type AcademicPerformanceOfferingParams = z.infer<
  typeof academicPerformanceOfferingParamsSchema
>

export const attendanceSessionParamsSchema = z.object({
  sessionId: z.string().trim().min(1, 'Attendance session ID is required'),
})

export const attendanceSessionsQuerySchema = z.object({
  offeringId: z.string().trim().optional(),
})

export const attendanceRecordSchema = z.object({
  studentId: z.string().trim().min(1, 'Student ID is required'),
  status: z.enum(attendanceStatuses),
})

export const attendanceSessionPayloadSchema = z.object({
  offeringId: z.string().trim().min(1, 'Course offering ID is required'),
  date: z.iso.date('Attendance date must use YYYY-MM-DD format'),
  records: z.array(attendanceRecordSchema).min(1, 'At least one attendance record is required'),
})

export const attendanceConfigurationPayloadSchema = z.object({
  minimumAttendancePercentage: z
    .number()
    .int('Minimum attendance percentage must be a whole number')
    .min(1, 'Minimum attendance percentage must be at least 1')
    .max(100, 'Minimum attendance percentage cannot exceed 100'),
})

export const assessmentsQuerySchema = z.object({
  offeringId: z.string().trim().min(1, 'Course offering ID is required'),
})

export const assessmentParamsSchema = z.object({
  assessmentId: z.string().trim().min(1, 'Assessment ID is required'),
})

export const assessmentPayloadSchema = z.object({
  offeringId: z.string().trim().min(1, 'Course offering ID is required'),
  name: z.string().trim().min(1, 'Assessment name is required').max(100),
  category: z.enum(assessmentCategories),
  maximumMarks: z
    .number()
    .positive('Maximum marks must be greater than zero')
    .max(1000, 'Maximum marks cannot exceed 1000'),
})

const assessmentCategoryWeightSchema = z.object({
  id: z.enum(assessmentCategories),
  weightPercentage: z
    .number()
    .positive('Category weight must be greater than zero')
    .max(100, 'Category weight cannot exceed 100')
    .multipleOf(0.01, 'Category weight can have at most two decimal places'),
})

export const assessmentConfigurationPayloadSchema = z
  .object({
    categories: z
      .array(assessmentCategoryWeightSchema)
      .length(assessmentCategories.length, 'Every assessment category must have a weight'),
  })
  .superRefine((payload, context) => {
    const ids = new Set(payload.categories.map((category) => category.id))

    if (ids.size !== assessmentCategories.length) {
      context.addIssue({
        code: 'custom',
        path: ['categories'],
        message: 'Every assessment category must appear exactly once',
      })
    }

    const total = payload.categories.reduce((sum, category) => sum + category.weightPercentage, 0)

    if (Math.abs(total - 100) > 0.001) {
      context.addIssue({
        code: 'custom',
        path: ['categories'],
        message: 'Assessment category weights must total 100%',
      })
    }
  })

export const markRecordSchema = z
  .object({
    studentId: z.string().trim().min(1, 'Student ID is required'),
    obtainedMarks: z.number().min(0, 'Marks cannot be negative').optional(),
    status: z.enum(markStatuses).optional(),
  })
  .refine((record) => record.obtainedMarks === undefined || record.status === undefined, {
    message: 'A mark record cannot contain both numeric marks and a special status',
  })

export const markSheetPayloadSchema = z.object({
  records: z.array(markRecordSchema),
})

export const resultParamsSchema = z.object({
  resultId: z.string().trim().min(1, 'Result ID is required'),
})

export const semesterResultParamsSchema = z.object({
  semesterId: z.string().trim().min(1, 'Semester ID is required'),
})

export const resultCommentPayloadSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(3, 'A reason of at least 3 characters is required')
    .max(1000, 'The reason cannot exceed 1000 characters'),
})

const gradeRangeSchema = z
  .object({
    minimumPercentage: z.number().min(0).max(100).multipleOf(0.01),
    maximumPercentage: z.number().min(0).max(100).multipleOf(0.01),
    letterGrade: z.string().trim().min(1, 'Letter grade is required').max(10),
    gradePoint: z.number().min(0).max(4).multipleOf(0.01),
  })
  .refine((range) => range.minimumPercentage <= range.maximumPercentage, {
    message: 'Minimum percentage cannot exceed maximum percentage',
    path: ['maximumPercentage'],
  })

export const gradingScalePayloadSchema = z
  .object({
    ranges: z.array(gradeRangeSchema).min(1, 'At least one grade range is required').max(20),
  })
  .superRefine((payload, context) => {
    const ranges = payload.ranges.toSorted(
      (left, right) => left.minimumPercentage - right.minimumPercentage
    )
    const grades = new Set(payload.ranges.map((range) => range.letterGrade.toUpperCase()))

    if (grades.size !== payload.ranges.length) {
      context.addIssue({
        code: 'custom',
        path: ['ranges'],
        message: 'Letter grades must be unique',
      })
    }

    if (ranges[0]?.minimumPercentage !== 0 || ranges.at(-1)?.maximumPercentage !== 100) {
      context.addIssue({
        code: 'custom',
        path: ['ranges'],
        message: 'The grading scale must cover 0 through 100 percent',
      })
    }

    for (let index = 1; index < ranges.length; index += 1) {
      const previousMaximum = Math.round(ranges[index - 1]!.maximumPercentage * 100)
      const currentMinimum = Math.round(ranges[index]!.minimumPercentage * 100)

      if (currentMinimum !== previousMaximum + 1) {
        context.addIssue({
          code: 'custom',
          path: ['ranges'],
          message: 'Grade ranges must not overlap or leave percentage gaps',
        })
        break
      }
    }
  })

export type AttendanceSessionParams = z.infer<typeof attendanceSessionParamsSchema>
export type AttendanceSessionsQuery = z.infer<typeof attendanceSessionsQuerySchema>
export type AttendanceSessionPayload = z.infer<typeof attendanceSessionPayloadSchema>
export type AttendanceConfigurationPayload = z.infer<typeof attendanceConfigurationPayloadSchema>
export type AssessmentPayload = z.infer<typeof assessmentPayloadSchema>
export type AssessmentConfigurationPayload = z.infer<typeof assessmentConfigurationPayloadSchema>
export type MarkSheetPayload = z.infer<typeof markSheetPayloadSchema>
export type ResultCommentPayload = z.infer<typeof resultCommentPayloadSchema>
export type GradingScalePayload = z.infer<typeof gradingScalePayloadSchema>
