import { createBatch, deleteBatch, listBatches, updateBatch } from '../services/batch.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  batchParamsSchema,
  createBatchSchema,
  updateBatchSchema,
} from '../validators/batch.validator.js'

export const listBatchesController = asyncHandler(async (_req, res) => {
  const batches = await listBatches()

  res.status(200).json({ batches })
})

export const createBatchController = asyncHandler(async (req, res) => {
  const payload = createBatchSchema.parse(req.body)
  const batch = await createBatch(payload)

  res.status(201).json({
    message: 'Batch created',
    batch,
  })
})

export const updateBatchController = asyncHandler(async (req, res) => {
  const { batchId } = batchParamsSchema.parse(req.params)
  const payload = updateBatchSchema.parse(req.body)
  const batch = await updateBatch(batchId, payload)

  res.status(200).json({
    message: 'Batch updated',
    batch,
  })
})

export const deleteBatchController = asyncHandler(async (req, res) => {
  const { batchId } = batchParamsSchema.parse(req.params)
  await deleteBatch(batchId)

  res.status(200).json({ message: 'Batch deleted' })
})
