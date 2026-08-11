import { Router } from 'express'
import {
  assignCoursesToSectionController,
  assignTeacherToOfferingController,
  createCourseController,
  deleteCourseController,
  getSectionCourseOfferingsController,
  listAssignableTeachersController,
  listCourseOfferingsController,
  listCoursesController,
  listStudentCoursesController,
  listTeacherCourseOfferingsController,
  updateCourseController,
} from '../controllers/courses.controller.js'
import {
  requireAuth,
  requirePasswordChanged,
  requireRoles,
} from '../middlewares/auth.middleware.js'

export const coursesRoutes = Router()

coursesRoutes.use(requireAuth, requirePasswordChanged)
coursesRoutes.get('/', requireRoles('admin', 'hod'), listCoursesController)
coursesRoutes.get('/teachers', requireRoles('admin', 'hod'), listAssignableTeachersController)
coursesRoutes.get('/offerings', requireRoles('admin', 'hod'), listCourseOfferingsController)
coursesRoutes.get('/me/student', requireRoles('student'), listStudentCoursesController)
coursesRoutes.get('/me/teacher', requireRoles('teacher'), listTeacherCourseOfferingsController)
coursesRoutes.get(
  '/sections/:sectionId/offerings',
  requireRoles('admin', 'hod'),
  getSectionCourseOfferingsController
)
coursesRoutes.put(
  '/sections/:sectionId/offerings',
  requireRoles('admin'),
  assignCoursesToSectionController
)
coursesRoutes.patch(
  '/offerings/:offeringId/teacher',
  requireRoles('admin', 'hod'),
  assignTeacherToOfferingController
)
coursesRoutes.post('/', requireRoles('admin'), createCourseController)
coursesRoutes.patch('/:courseId', requireRoles('admin'), updateCourseController)
coursesRoutes.delete('/:courseId', requireRoles('admin'), deleteCourseController)
