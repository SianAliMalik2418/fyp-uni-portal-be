import type { Request } from 'express'
import {
  createExam,
  deleteExam,
  listAdminSectionExams,
  listStudentExams,
  listTeacherExams,
  updateExam,
} from '../services/exam.service.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  adminExamQuerySchema,
  examParamsSchema,
  saveExamSchema,
} from '../validators/exam.validator.js'

function getRequestUser(req: Request) {
  if (!req.auth) {
    throw new ApiError(401, 'Authentication required')
  }

  return req.auth.user
}

export const createExamController = asyncHandler(async (req, res) => {
  const payload = saveExamSchema.parse(req.body)
  const exam = await createExam(payload, getRequestUser(req).id)

  res.status(201).json({ message: 'Exam entry created', exam })
})

export const updateExamController = asyncHandler(async (req, res) => {
  const { examId } = examParamsSchema.parse(req.params)
  const payload = saveExamSchema.parse(req.body)
  const exam = await updateExam(examId, payload, getRequestUser(req).id)

  res.status(200).json({ message: 'Exam entry updated', exam })
})

export const deleteExamController = asyncHandler(async (req, res) => {
  const { examId } = examParamsSchema.parse(req.params)
  await deleteExam(examId)

  res.status(200).json({ message: 'Exam entry deleted' })
})

export const listAdminSectionExamsController = asyncHandler(async (req, res) => {
  const { sectionId } = adminExamQuerySchema.parse(req.query)
  const exams = await listAdminSectionExams(sectionId)

  res.status(200).json({ exams })
})

export const listStudentExamsController = asyncHandler(async (req, res) => {
  const exams = await listStudentExams(getRequestUser(req))

  res.status(200).json({ exams })
})

export const listTeacherExamsController = asyncHandler(async (req, res) => {
  const exams = await listTeacherExams(getRequestUser(req))

  res.status(200).json({ exams })
})
