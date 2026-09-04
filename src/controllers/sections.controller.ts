import {
  createSection,
  deleteSection,
  listSections,
  updateSection,
} from '../services/section.service.js'
import { recordAuditLog } from '../services/audit-log.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  createSectionSchema,
  sectionParamsSchema,
  updateSectionSchema,
} from '../validators/section.validator.js'

export const listSectionsController = asyncHandler(async (_req, res) => {
  const sections = await listSections()

  res.status(200).json({ sections })
})

export const createSectionController = asyncHandler(async (req, res) => {
  const payload = createSectionSchema.parse(req.body)
  const section = await createSection(payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'created',
    module: 'sections',
    affectedRecord: { id: section.id, label: section.name },
  })

  res.status(201).json({
    message: 'Section created',
    section,
  })
})

export const updateSectionController = asyncHandler(async (req, res) => {
  const { sectionId } = sectionParamsSchema.parse(req.params)
  const payload = updateSectionSchema.parse(req.body)
  const section = await updateSection(sectionId, payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'updated',
    module: 'sections',
    affectedRecord: { id: section.id, label: section.name },
  })

  res.status(200).json({
    message: 'Section updated',
    section,
  })
})

export const deleteSectionController = asyncHandler(async (req, res) => {
  const { sectionId } = sectionParamsSchema.parse(req.params)
  await deleteSection(sectionId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'deleted',
    module: 'sections',
    affectedRecord: { id: sectionId },
  })

  res.status(200).json({ message: 'Section deleted' })
})
