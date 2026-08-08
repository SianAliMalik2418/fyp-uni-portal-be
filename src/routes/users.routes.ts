import { Router } from 'express'
import { createUserController, listUsersController } from '../controllers/users.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const usersRoutes = Router()

usersRoutes.use(requireAuth, requireRoles('admin'))
usersRoutes.get('/', listUsersController)
usersRoutes.post('/', createUserController)
