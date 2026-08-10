import {
  activateSemester,
  closeSemester,
  createSemester,
  deleteSemester,
  listSemesters,
  updateSemester,
} from '../services/semester.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  createSemesterSchema,
  semesterParamsSchema,
  updateSemesterSchema,
} from '../validators/semester.validator.js'

export const listSemestersController = asyncHandler(async (_req, res) => {
  const semesters = await listSemesters()

  res.status(200).json({ semesters })
})

export const createSemesterController = asyncHandler(async (req, res) => {
  const payload = createSemesterSchema.parse(req.body)
  const semester = await createSemester(payload)

  res.status(201).json({
    message: 'Semester created',
    semester,
  })
})

export const updateSemesterController = asyncHandler(async (req, res) => {
  const { semesterId } = semesterParamsSchema.parse(req.params)
  const payload = updateSemesterSchema.parse(req.body)
  const semester = await updateSemester(semesterId, payload)

  res.status(200).json({
    message: 'Semester updated',
    semester,
  })
})

export const activateSemesterController = asyncHandler(async (req, res) => {
  const { semesterId } = semesterParamsSchema.parse(req.params)
  const semester = await activateSemester(semesterId)

  res.status(200).json({
    message: 'Semester activated',
    semester,
  })
})

export const closeSemesterController = asyncHandler(async (req, res) => {
  const { semesterId } = semesterParamsSchema.parse(req.params)
  const semester = await closeSemester(semesterId)

  res.status(200).json({
    message: 'Semester closed',
    semester,
  })
})

export const deleteSemesterController = asyncHandler(async (req, res) => {
  const { semesterId } = semesterParamsSchema.parse(req.params)
  await deleteSemester(semesterId)

  res.status(200).json({ message: 'Semester deleted' })
})
