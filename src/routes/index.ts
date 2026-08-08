import { Router } from 'express'
import {
  assessmentsRoutes,
  attendanceRoutes,
  marksRoutes,
  resultsRoutes,
} from './academic-performance.routes.js'
import { authRoutes } from './auth.routes.js'
import { healthRoutes } from './health.routes.js'
import { usersRoutes } from './users.routes.js'

export const apiRoutes = Router()

apiRoutes.use('/auth', authRoutes)
apiRoutes.use('/health', healthRoutes)
apiRoutes.use('/users', usersRoutes)
apiRoutes.use('/attendance', attendanceRoutes)
apiRoutes.use('/assessments', assessmentsRoutes)
apiRoutes.use('/marks', marksRoutes)
apiRoutes.use('/results', resultsRoutes)
