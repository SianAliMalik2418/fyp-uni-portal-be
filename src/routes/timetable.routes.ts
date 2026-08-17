import { Router } from 'express'
import {
  getAdminSectionTimetableWorkspaceController,
  getStudentTimetableController,
  getTeacherTimetablesController,
  publishSectionTimetableDraftController,
  saveSectionTimetableDraftController,
} from '../controllers/timetable.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const timetableRoutes = Router()

timetableRoutes.use(requireAuth)
timetableRoutes.get('/me/student', requireRoles('student'), getStudentTimetableController)
timetableRoutes.get('/me/teacher', requireRoles('teacher'), getTeacherTimetablesController)
timetableRoutes.get(
  '/sections/:sectionId',
  requireRoles('admin'),
  getAdminSectionTimetableWorkspaceController
)
timetableRoutes.put(
  '/sections/:sectionId/draft',
  requireRoles('admin'),
  saveSectionTimetableDraftController
)
timetableRoutes.post(
  '/sections/:sectionId/publish',
  requireRoles('admin'),
  publishSectionTimetableDraftController
)
