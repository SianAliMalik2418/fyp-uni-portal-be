import type { RequestHandler } from 'express'
import {
  getStudentServiceContext,
  getStudentServicePlaceholder,
  type StudentServiceModule,
} from '../services/student-services.service.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'

function createStudentServiceController(module: StudentServiceModule): RequestHandler {
  return (_req, res) => {
    res.json(getStudentServicePlaceholder(module))
  }
}

export const getFeesPlaceholder = createStudentServiceController('fees')
export const getTimetablePlaceholder = createStudentServiceController('timetable')
export const getExamsPlaceholder = createStudentServiceController('exams')
export const getMaterialsPlaceholder = createStudentServiceController('materials')
export const getAnnouncementsPlaceholder = createStudentServiceController('announcements')
export const getNotificationsPlaceholder = createStudentServiceController('notifications')
export const getAiAssistantPlaceholder = createStudentServiceController('ai-assistant')

export const getStudentServiceContextController = asyncHandler(async (req, res) => {
  const auth = req.auth

  if (!auth) {
    throw new ApiError(401, 'Authentication required')
  }

  const context = await getStudentServiceContext(auth.user.id, auth.user.role)

  res.status(200).json(context)
})
