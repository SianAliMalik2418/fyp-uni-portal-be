import { z } from 'zod'
import { studentAcademicStatuses, userRoles } from '../models/user.model.js'

const userPayloadBaseSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.email('Valid email is required').trim().toLowerCase(),
  role: z.enum(userRoles),
  phoneNumber: z.string().trim().optional(),
  registrationNumber: z.string().trim().min(1).optional(),
  employeeId: z.string().trim().min(1).optional(),
  departmentId: z.string().trim().min(1).optional(),
  programId: z.string().trim().min(1).optional(),
  batchId: z.string().trim().min(1).optional(),
  semesterId: z.string().trim().min(1).optional(),
  sectionId: z.string().trim().min(1).optional(),
  academicStatus: z.enum(studentAcademicStatuses).optional(),
  designation: z.string().trim().optional(),
  isActive: z.boolean().default(true),
})

function refineRoleProfile(value: z.infer<typeof userPayloadBaseSchema>, context: z.RefinementCtx) {
  if (value.role === 'student') {
    const requiredStudentFields = [
      ['registrationNumber', 'Registration no. is required'],
      ['departmentId', 'Department is required'],
      ['programId', 'Program is required'],
      ['batchId', 'Batch is required'],
      ['semesterId', 'Semester is required'],
      ['sectionId', 'Section is required'],
      ['academicStatus', 'Academic status is required'],
    ] as const

    requiredStudentFields.forEach(([path, message]) => {
      if (!value[path]?.trim()) {
        context.addIssue({ code: 'custom', message, path: [path] })
      }
    })
  }

  if (value.role === 'teacher' || value.role === 'hod') {
    if (!value.employeeId?.trim()) {
      context.addIssue({
        code: 'custom',
        message: 'Employee ID is required',
        path: ['employeeId'],
      })
    }

    if (!value.departmentId?.trim()) {
      context.addIssue({
        code: 'custom',
        message: 'Department is required',
        path: ['departmentId'],
      })
    }
  }

  if (value.role === 'teacher' && !value.designation?.trim()) {
    context.addIssue({
      code: 'custom',
      message: 'Designation is required',
      path: ['designation'],
    })
  }
}

export const createUserSchema = userPayloadBaseSchema.superRefine(refineRoleProfile)

export const updateUserSchema = userPayloadBaseSchema.superRefine(refineRoleProfile)

export const userParamsSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
})

export type CreateUserPayload = z.infer<typeof createUserSchema>
export type UpdateUserPayload = z.infer<typeof updateUserSchema>
