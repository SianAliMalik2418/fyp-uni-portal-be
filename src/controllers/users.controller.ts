import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  resetUserPassword,
  updateUser,
} from '../services/user.service.js'
import { recordAuditLog } from '../services/audit-log.service.js'
import { semesterPromotionService } from '../services/semester-promotion.service.js'
import { studentImportService } from '../services/student-import.service.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  createUserSchema,
  updateUserSchema,
  userListQuerySchema,
  userParamsSchema,
  promotionRequestSchema,
  promotionSelectionSchema,
} from '../validators/user.validator.js'

export const listUsersController = asyncHandler(async (req, res) => {
  const query = userListQuerySchema.parse(req.query)
  const result = await listUsers(req.auth!.user, query)

  res.status(200).json(result)
})

export const createUserController = asyncHandler(async (req, res) => {
  const payload = createUserSchema.parse(req.body)
  const createdUser = await createUser(payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'created',
    module: 'users',
    affectedRecord: { id: createdUser.user.id, label: createdUser.user.fullName },
  })

  res.status(201).json({
    message: 'User account created',
    ...createdUser,
  })
})

export const getPromotionCandidatesController = asyncHandler(async (req, res) => {
  const selection = promotionSelectionSchema.parse(req.query)
  const result = await semesterPromotionService.getCandidates(selection)

  res.status(200).json(result)
})

export const promoteStudentsController = asyncHandler(async (req, res) => {
  const payload = promotionRequestSchema.parse(req.body)
  const result = await semesterPromotionService.promote(payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'promoted',
    module: 'users',
    affectedRecord: {
      id: result.target.id,
      label: `${result.summary.promoted} ${result.summary.promoted === 1 ? 'student' : 'students'} to ${result.target.semester.name} · ${result.target.name}`,
    },
  })

  res.status(200).json({ message: 'Semester promotion completed', ...result })
})

export const importStudentsController = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'CSV file is required')
  const result = await studentImportService.importCsv(req.file.buffer)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'created',
    module: 'users',
    affectedRecord: {
      id: 'student-csv-import',
      label: req.file.originalname,
    },
    reason: `${result.summary.imported} imported; ${result.summary.failed} failed`,
  })

  res.status(200).json({ message: 'Student import processed', ...result })
})

export const getOwnUserController = asyncHandler(async (req, res) => {
  const user = await getUser(req.auth!.user.id)

  res.status(200).json({ user })
})

export const getUserController = asyncHandler(async (req, res) => {
  const { userId } = userParamsSchema.parse(req.params)
  const user = await getUser(userId)

  res.status(200).json({ user })
})

export const updateUserController = asyncHandler(async (req, res) => {
  const { userId } = userParamsSchema.parse(req.params)
  const payload = updateUserSchema.parse(req.body)
  const user = await updateUser(userId, payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'updated',
    module: 'users',
    affectedRecord: { id: user.id, label: user.fullName },
  })

  res.status(200).json({
    message: 'User account updated',
    user,
  })
})

export const deleteUserController = asyncHandler(async (req, res) => {
  const { userId } = userParamsSchema.parse(req.params)
  await deleteUser(userId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'deleted',
    module: 'users',
    affectedRecord: { id: userId },
  })

  res.status(200).json({ message: 'User account deleted' })
})

export const resetUserPasswordController = asyncHandler(async (req, res) => {
  const { userId } = userParamsSchema.parse(req.params)
  const resetAccount = await resetUserPassword(userId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'reset_password',
    module: 'users',
    affectedRecord: { id: resetAccount.user.id, label: resetAccount.user.fullName },
  })

  res.status(200).json({
    message: 'Temporary password issued',
    ...resetAccount,
  })
})
