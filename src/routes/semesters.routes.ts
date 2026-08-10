import { Router } from 'express'
import {
  activateSemesterController,
  closeSemesterController,
  createSemesterController,
  deleteSemesterController,
  listSemestersController,
  updateSemesterController,
} from '../controllers/semesters.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const semestersRoutes = Router()

semestersRoutes.use(requireAuth, requireRoles('admin'))
semestersRoutes.get('/', listSemestersController)
semestersRoutes.post('/', createSemesterController)
semestersRoutes.patch('/:semesterId', updateSemesterController)
semestersRoutes.patch('/:semesterId/activate', activateSemesterController)
semestersRoutes.patch('/:semesterId/close', closeSemesterController)
semestersRoutes.delete('/:semesterId', deleteSemesterController)
