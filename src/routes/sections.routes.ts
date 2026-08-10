import { Router } from 'express'
import {
  createSectionController,
  deleteSectionController,
  listSectionsController,
  updateSectionController,
} from '../controllers/sections.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const sectionsRoutes = Router()

sectionsRoutes.use(requireAuth, requireRoles('admin'))
sectionsRoutes.get('/', listSectionsController)
sectionsRoutes.post('/', createSectionController)
sectionsRoutes.patch('/:sectionId', updateSectionController)
sectionsRoutes.delete('/:sectionId', deleteSectionController)
