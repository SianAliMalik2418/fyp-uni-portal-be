import { Router } from 'express'
import { authRoutes } from './auth.routes.js'
import { healthRoutes } from './health.routes.js'
import { usersRoutes } from './users.routes.js'

export const apiRoutes = Router()

apiRoutes.use('/auth', authRoutes)
apiRoutes.use('/health', healthRoutes)
apiRoutes.use('/users', usersRoutes)
