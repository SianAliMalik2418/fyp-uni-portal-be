import {
  activateSemester,
  closeSemester,
  createSemester,
  deleteSemester,
  listSemestersPage,
  updateSemester,
} from '../services/semester.service.js'
import { recordAuditLog } from '../services/audit-log.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  createSemesterSchema,
  semesterListQuerySchema,
  semesterParamsSchema,
  updateSemesterSchema,
} from '../validators/semester.validator.js'

export const listSemestersController = asyncHandler(async (req, res) => {
  const query = semesterListQuerySchema.parse(req.query)
  const result = await listSemestersPage(query)

  res.status(200).json(result)
})

export const createSemesterController = asyncHandler(async (req, res) => {
  const payload = createSemesterSchema.parse(req.body)
  const semester = await createSemester(payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'created',
    module: 'semesters',
    affectedRecord: { id: semester.id, label: semester.name },
  })

  res.status(201).json({
    message: 'Semester created',
    semester,
  })
})

export const updateSemesterController = asyncHandler(async (req, res) => {
  const { semesterId } = semesterParamsSchema.parse(req.params)
  const payload = updateSemesterSchema.parse(req.body)
  const semester = await updateSemester(semesterId, payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'updated',
    module: 'semesters',
    affectedRecord: { id: semester.id, label: semester.name },
  })

  res.status(200).json({
    message: 'Semester updated',
    semester,
  })
})

export const activateSemesterController = asyncHandler(async (req, res) => {
  const { semesterId } = semesterParamsSchema.parse(req.params)
  const semester = await activateSemester(semesterId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'activated',
    module: 'semesters',
    affectedRecord: { id: semester.id, label: semester.name },
  })

  res.status(200).json({
    message: 'Semester activated',
    semester,
  })
})

export const closeSemesterController = asyncHandler(async (req, res) => {
  const { semesterId } = semesterParamsSchema.parse(req.params)
  const semester = await closeSemester(semesterId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'closed',
    module: 'semesters',
    affectedRecord: { id: semester.id, label: semester.name },
  })

  res.status(200).json({
    message: 'Semester closed',
    semester,
  })
})

export const deleteSemesterController = asyncHandler(async (req, res) => {
  const { semesterId } = semesterParamsSchema.parse(req.params)
  await deleteSemester(semesterId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'deleted',
    module: 'semesters',
    affectedRecord: { id: semesterId },
  })

  res.status(200).json({ message: 'Semester deleted' })
})
