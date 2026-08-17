import { Router } from 'express'
import {
  createExamController,
  deleteExamController,
  listAdminSectionExamsController,
  listStudentExamsController,
  listTeacherExamsController,
  updateExamController,
} from '../controllers/exam.controller.js'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js'

export const examRoutes = Router()

examRoutes.use(requireAuth)
examRoutes.get('/admin', requireRoles('admin'), listAdminSectionExamsController)
examRoutes.get('/me/student', requireRoles('student'), listStudentExamsController)
examRoutes.get('/me/teacher', requireRoles('teacher'), listTeacherExamsController)
examRoutes.post('/', requireRoles('admin'), createExamController)
examRoutes.put('/:examId', requireRoles('admin'), updateExamController)
examRoutes.delete('/:examId', requireRoles('admin'), deleteExamController)
