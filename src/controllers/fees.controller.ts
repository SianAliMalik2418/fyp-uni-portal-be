import { getCurrentStudentFee, upsertCurrentStudentFee } from '../services/fee.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import { feeParamsSchema, upsertFeeSchema } from '../validators/fee.validator.js'

export const getOwnFeeController = asyncHandler(async (req, res) => {
  const fee = await getCurrentStudentFee(req.auth!.user.id)

  res.status(200).json({ fee })
})

export const getStudentFeeController = asyncHandler(async (req, res) => {
  const { studentId } = feeParamsSchema.parse(req.params)
  const fee = await getCurrentStudentFee(studentId)

  res.status(200).json({ fee })
})

export const upsertStudentFeeController = asyncHandler(async (req, res) => {
  const { studentId } = feeParamsSchema.parse(req.params)
  const payload = upsertFeeSchema.parse(req.body)
  const fee = await upsertCurrentStudentFee(studentId, payload)

  res.status(200).json({ message: 'Fee information saved', fee })
})
