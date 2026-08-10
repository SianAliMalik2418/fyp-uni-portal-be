import { Router } from 'express'
import {
  createDepartmentController,
  deleteDepartmentController,
  listDepartmentsController,
  updateDepartmentController,
} from '../controllers/departments.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const departmentsRoutes = Router()

departmentsRoutes.use(requireAuth, requireRoles('admin'))
departmentsRoutes.get('/', listDepartmentsController)
departmentsRoutes.post('/', createDepartmentController)
departmentsRoutes.patch('/:departmentId', updateDepartmentController)
departmentsRoutes.delete('/:departmentId', deleteDepartmentController)
