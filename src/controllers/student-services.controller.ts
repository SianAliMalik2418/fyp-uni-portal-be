import type { RequestHandler } from 'express'
import {
  getStudentServicePlaceholder,
  type StudentServiceModule,
} from '../services/student-services.service.js'

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
