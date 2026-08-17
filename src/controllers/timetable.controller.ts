import type { Request } from 'express'
import {
  getAdminSectionTimetableWorkspace,
  getStudentTimetable,
  getTeacherTimetables,
  publishSectionTimetableDraft,
  saveSectionTimetableDraft,
} from '../services/timetable.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  saveTimetableDraftSchema,
  timetableSectionParamsSchema,
} from '../validators/timetable.validator.js'
import { ApiError } from '../utils/api-error.js'

function getRequestUser(req: Request) {
  if (!req.auth) {
    throw new ApiError(401, 'Authentication required')
  }

  return req.auth.user
}

export const getAdminSectionTimetableWorkspaceController = asyncHandler(async (req, res) => {
  const { sectionId } = timetableSectionParamsSchema.parse(req.params)
  const workspace = await getAdminSectionTimetableWorkspace(sectionId)

  res.status(200).json(workspace)
})

export const saveSectionTimetableDraftController = asyncHandler(async (req, res) => {
  const { sectionId } = timetableSectionParamsSchema.parse(req.params)
  const payload = saveTimetableDraftSchema.parse(req.body)
  const timetable = await saveSectionTimetableDraft(sectionId, payload, {
    userId: getRequestUser(req).id,
  })

  res.status(200).json({
    message: 'Timetable draft saved',
    timetable,
  })
})

export const publishSectionTimetableDraftController = asyncHandler(async (req, res) => {
  const { sectionId } = timetableSectionParamsSchema.parse(req.params)
  const timetable = await publishSectionTimetableDraft(sectionId, {
    userId: getRequestUser(req).id,
  })

  res.status(200).json({
    message: 'Timetable published',
    timetable,
  })
})

export const getStudentTimetableController = asyncHandler(async (req, res) => {
  const timetable = await getStudentTimetable(getRequestUser(req))

  res.status(200).json({ timetable })
})

export const getTeacherTimetablesController = asyncHandler(async (req, res) => {
  const timetables = await getTeacherTimetables(getRequestUser(req))

  res.status(200).json({ timetables })
})
