import { z } from 'zod'

const amountSchema = z.number().finite().min(0).max(1_000_000_000).multipleOf(0.01)

export const feeParamsSchema = z.object({
  studentId: z.string().trim().min(1, 'Student ID is required'),
})

export const upsertFeeSchema = z
  .object({
    totalAmount: amountSchema.positive('Total amount must be greater than zero'),
    paidAmount: amountSchema,
    dueDate: z.iso.date('Valid due date is required'),
    paymentDate: z.iso.date('Valid payment date is required').optional(),
    notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  })
  .refine((value) => value.paidAmount <= value.totalAmount, {
    message: 'Paid amount cannot exceed total amount',
    path: ['paidAmount'],
  })

export type UpsertFeePayload = z.infer<typeof upsertFeeSchema>
