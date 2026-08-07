import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Valid email is required').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
