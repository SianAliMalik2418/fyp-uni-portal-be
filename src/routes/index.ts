import { Router } from 'express'
import {
  academicPerformanceRoutes,
  assessmentsRoutes,
  attendanceRoutes,
  marksRoutes,
  resultsRoutes,
} from './academic-performance.routes.js'
import { authRoutes } from './auth.routes.js'
import { batchesRoutes } from './batches.routes.js'
import { coursesRoutes } from './courses.routes.js'
import { departmentsRoutes } from './departments.routes.js'
import { examRoutes } from './exam.routes.js'
import { healthRoutes } from './health.routes.js'
import { feesRoutes } from './fees.routes.js'
import { programsRoutes } from './programs.routes.js'
import { sectionsRoutes } from './sections.routes.js'
import { semestersRoutes } from './semesters.routes.js'
import { timetableRoutes } from './timetable.routes.js'
import {
  aiAssistantRoutes,
  announcementsRoutes,
  materialsRoutes,
  notificationsRoutes,
  studentServicesRoutes,
} from './student-services.routes.js'
import { usersRoutes } from './users.routes.js'
import { studentDashboardRoutes } from './student-dashboard.routes.js'

export const apiRoutes = Router()

apiRoutes.use('/auth', authRoutes)
apiRoutes.use('/batches', batchesRoutes)
apiRoutes.use('/courses', coursesRoutes)
apiRoutes.use('/departments', departmentsRoutes)
apiRoutes.use('/health', healthRoutes)
apiRoutes.use('/programs', programsRoutes)
apiRoutes.use('/sections', sectionsRoutes)
apiRoutes.use('/semesters', semestersRoutes)
apiRoutes.use('/users', usersRoutes)
apiRoutes.use('/academic-performance', academicPerformanceRoutes)
apiRoutes.use('/attendance', attendanceRoutes)
apiRoutes.use('/assessments', assessmentsRoutes)
apiRoutes.use('/marks', marksRoutes)
apiRoutes.use('/results', resultsRoutes)
apiRoutes.use('/fees', feesRoutes)
apiRoutes.use('/timetable', timetableRoutes)
apiRoutes.use('/exams', examRoutes)
apiRoutes.use('/materials', materialsRoutes)
apiRoutes.use('/student-services', studentServicesRoutes)
apiRoutes.use('/student-dashboard', studentDashboardRoutes)
apiRoutes.use('/announcements', announcementsRoutes)
apiRoutes.use('/notifications', notificationsRoutes)
apiRoutes.use('/ai-assistant', aiAssistantRoutes)
