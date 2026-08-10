import { Router } from 'express'
import {
  createProgramController,
  deleteProgramController,
  listProgramsController,
  updateProgramController,
} from '../controllers/programs.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const programsRoutes = Router()

programsRoutes.use(requireAuth, requireRoles('admin'))
programsRoutes.get('/', listProgramsController)
programsRoutes.post('/', createProgramController)
programsRoutes.patch('/:programId', updateProgramController)
programsRoutes.delete('/:programId', deleteProgramController)
