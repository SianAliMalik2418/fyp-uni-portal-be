import { Router } from 'express'
import {
  assessmentsRoutes,
  attendanceRoutes,
  marksRoutes,
  resultsRoutes,
} from './academic-performance.routes.js'
import { authRoutes } from './auth.routes.js'
import { departmentsRoutes } from './departments.routes.js'
import { healthRoutes } from './health.routes.js'
import {
  aiAssistantRoutes,
  announcementsRoutes,
  examsRoutes,
  feesRoutes,
  materialsRoutes,
  notificationsRoutes,
  timetableRoutes,
} from './student-services.routes.js'
import { usersRoutes } from './users.routes.js'

export const apiRoutes = Router()

apiRoutes.use('/auth', authRoutes)
apiRoutes.use('/departments', departmentsRoutes)
apiRoutes.use('/health', healthRoutes)
apiRoutes.use('/users', usersRoutes)
apiRoutes.use('/attendance', attendanceRoutes)
apiRoutes.use('/assessments', assessmentsRoutes)
apiRoutes.use('/marks', marksRoutes)
apiRoutes.use('/results', resultsRoutes)
apiRoutes.use('/fees', feesRoutes)
apiRoutes.use('/timetable', timetableRoutes)
apiRoutes.use('/exams', examsRoutes)
apiRoutes.use('/materials', materialsRoutes)
apiRoutes.use('/announcements', announcementsRoutes)
apiRoutes.use('/notifications', notificationsRoutes)
apiRoutes.use('/ai-assistant', aiAssistantRoutes)
