import { Router } from 'express'
import {
  changePasswordController,
  currentUserController,
  loginController,
  logoutController,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

export const authRoutes = Router()

authRoutes.post('/login', loginController)
authRoutes.post('/logout', requireAuth, logoutController)
authRoutes.get('/me', requireAuth, currentUserController)
authRoutes.post('/change-password', requireAuth, changePasswordController)
