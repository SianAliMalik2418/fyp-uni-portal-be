import { z } from 'zod'
import { userRoles } from '../models/user.model.js'

export const createUserSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required'),
    email: z.email('Valid email is required').trim().toLowerCase(),
    role: z.enum(userRoles),
    registrationNumber: z.string().trim().min(1).optional(),
    employeeId: z.string().trim().min(1).optional(),
    isActive: z.boolean().default(true),
  })
  .superRefine((value, context) => {
    if (value.role === 'student' && !value.registrationNumber?.trim()) {
      context.addIssue({
        code: 'custom',
        message: 'Registration no. is required',
        path: ['registrationNumber'],
      })
    }

    if ((value.role === 'teacher' || value.role === 'hod') && !value.employeeId?.trim()) {
      context.addIssue({
        code: 'custom',
        message: 'Employee ID is required',
        path: ['employeeId'],
      })
    }
  })

export type CreateUserPayload = z.infer<typeof createUserSchema>
