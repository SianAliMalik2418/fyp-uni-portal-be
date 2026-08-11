import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  resetUserPassword,
  updateUser,
} from '../services/user.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  createUserSchema,
  updateUserSchema,
  userParamsSchema,
} from '../validators/user.validator.js'

export const listUsersController = asyncHandler(async (_req, res) => {
  const users = await listUsers()

  res.status(200).json({ users })
})

export const createUserController = asyncHandler(async (req, res) => {
  const payload = createUserSchema.parse(req.body)
  const createdUser = await createUser(payload)

  res.status(201).json({
    message: 'User account created',
    ...createdUser,
  })
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

  res.status(200).json({
    message: 'User account updated',
    user,
  })
})

export const deleteUserController = asyncHandler(async (req, res) => {
  const { userId } = userParamsSchema.parse(req.params)
  await deleteUser(userId)

  res.status(200).json({ message: 'User account deleted' })
})

export const resetUserPasswordController = asyncHandler(async (req, res) => {
  const { userId } = userParamsSchema.parse(req.params)
  const resetAccount = await resetUserPassword(userId)

  res.status(200).json({
    message: 'Temporary password issued',
    ...resetAccount,
  })
})
