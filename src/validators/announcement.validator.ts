import { z } from 'zod'

const booleanInput = z.preprocess((value) => {
  if (value === 'true') return true
  if (value === 'false') return false
  return value
}, z.boolean())

const optionalDate = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.date().optional()
)

const announcementFields = {
  title: z.string().trim().min(1, 'Title is required').max(160),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  publishDate: z.coerce.date(),
  expiryDate: optionalDate,
  isPinned: booleanInput.default(false),
  isActive: booleanInput.default(true),
}

function validateDateRange(
  value: { publishDate?: Date; expiryDate?: Date },
  context: z.RefinementCtx
) {
  if (value.publishDate && value.expiryDate && value.expiryDate <= value.publishDate) {
    context.addIssue({
      code: 'custom',
      path: ['expiryDate'],
      message: 'Expiry date must be after the publish date',
    })
  }
}

export const createAnnouncementSchema = z
  .object(announcementFields)
  .strict()
  .superRefine(validateDateRange)

export const updateAnnouncementSchema = z
  .object({
    title: announcementFields.title.optional(),
    description: announcementFields.description.optional(),
    publishDate: announcementFields.publishDate.optional(),
    expiryDate: optionalDate,
    isPinned: booleanInput.optional(),
    isActive: booleanInput.optional(),
    removeAttachment: booleanInput.optional(),
    clearExpiry: booleanInput.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required')
  .superRefine(validateDateRange)

export const announcementParamsSchema = z.object({
  announcementId: z.string().trim().min(1, 'Announcement ID is required'),
})

export const announcementQuerySchema = z.object({
  status: z.enum(['active', 'expired', 'scheduled', 'all']).default('active'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

export type CreateAnnouncementPayload = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementPayload = z.infer<typeof updateAnnouncementSchema>
export type AnnouncementQuery = z.infer<typeof announcementQuerySchema>
