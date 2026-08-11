import { Router } from 'express'
import {
  createUserController,
  deleteUserController,
  getOwnUserController,
  getUserController,
  listUsersController,
  resetUserPasswordController,
  updateUserController,
} from '../controllers/users.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const usersRoutes = Router()

usersRoutes.use(requireAuth)
usersRoutes.get('/me', getOwnUserController)

usersRoutes.use(requireRoles('admin'))
usersRoutes.get('/', listUsersController)
usersRoutes.post('/', createUserController)
usersRoutes.get('/:userId', getUserController)
usersRoutes.patch('/:userId', updateUserController)
usersRoutes.delete('/:userId', deleteUserController)
usersRoutes.patch('/:userId/reset-password', resetUserPasswordController)
