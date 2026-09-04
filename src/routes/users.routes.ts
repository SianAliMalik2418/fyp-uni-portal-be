import { Router } from 'express'
import {
  createUserController,
  deleteUserController,
  getOwnUserController,
  getUserController,
  listUsersController,
  getPromotionCandidatesController,
  promoteStudentsController,
  importStudentsController,
  resetUserPasswordController,
  updateUserController,
} from '../controllers/users.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'
import { studentImportUpload } from '../middlewares/student-import.middleware.js'

export const usersRoutes = Router()

usersRoutes.use(requireAuth)
usersRoutes.get('/me', getOwnUserController)
usersRoutes.get('/', requireRoles('admin', 'hod'), listUsersController)

usersRoutes.use(requireRoles('admin'))
usersRoutes.get('/promotions/candidates', getPromotionCandidatesController)
usersRoutes.post('/promotions', promoteStudentsController)
usersRoutes.post('/import', studentImportUpload, importStudentsController)
usersRoutes.post('/', createUserController)
usersRoutes.get('/:userId', getUserController)
usersRoutes.patch('/:userId', updateUserController)
usersRoutes.delete('/:userId', deleteUserController)
usersRoutes.patch('/:userId/reset-password', resetUserPasswordController)
