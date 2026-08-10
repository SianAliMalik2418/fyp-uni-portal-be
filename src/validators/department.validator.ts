import { z } from 'zod'

export const departmentParamsSchema = z.object({
  departmentId: z.string().trim().min(1, 'Department ID is required'),
})

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name is required'),
  code: z
    .string()
    .trim()
    .min(2, 'Department code is required')
    .max(12, 'Department code must be 12 characters or less')
    .regex(/^[A-Za-z0-9-]+$/, 'Department code can only contain letters, numbers, and hyphens'),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').optional(),
  isActive: z.boolean().default(true),
})

export const updateDepartmentSchema = createDepartmentSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one department field is required',
  })

export type CreateDepartmentPayload = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentPayload = z.infer<typeof updateDepartmentSchema>
