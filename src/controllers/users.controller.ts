import { createUser, listUsers } from '../services/user.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import { createUserSchema } from '../validators/user.validator.js'

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
