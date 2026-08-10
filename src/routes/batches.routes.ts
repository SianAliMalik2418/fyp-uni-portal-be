import { Router } from 'express'
import {
  createBatchController,
  deleteBatchController,
  listBatchesController,
  updateBatchController,
} from '../controllers/batches.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const batchesRoutes = Router()

batchesRoutes.use(requireAuth, requireRoles('admin'))
batchesRoutes.get('/', listBatchesController)
batchesRoutes.post('/', createBatchController)
batchesRoutes.patch('/:batchId', updateBatchController)
batchesRoutes.delete('/:batchId', deleteBatchController)
