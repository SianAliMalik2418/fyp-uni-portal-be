import { z } from 'zod'

export const academicPerformanceOfferingParamsSchema = z.object({
  offeringId: z.string().trim().min(1, 'Course offering ID is required'),
})

export type AcademicPerformanceOfferingParams = z.infer<
  typeof academicPerformanceOfferingParamsSchema
>
