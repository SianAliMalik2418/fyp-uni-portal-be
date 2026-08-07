import type { CookieOptions } from 'express'
import { env } from '../config/env.js'
import { changePassword, login, logout, serializeUser } from '../services/auth.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import { changePasswordSchema, loginSchema } from '../validators/auth.validator.js'

const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
}

export const loginController = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body)
  const session = await login(payload.email, payload.password)

  res.cookie(env.AUTH_COOKIE_NAME, session.token, {
    ...sessionCookieOptions,
    expires: session.expiresAt,
  })

  res.status(200).json({
    message: 'Login successful',
    user: session.user,
    expiresAt: session.expiresAt.toISOString(),
  })
})

export const logoutController = asyncHandler(async (req, res) => {
  if (req.auth) {
    await logout(req.auth.token)
  }

  res.clearCookie(env.AUTH_COOKIE_NAME, sessionCookieOptions)
  res.status(200).json({ message: 'Logout successful' })
})

export const currentUserController = asyncHandler(async (req, res) => {
  res.status(200).json({
    user: serializeUser(req.auth!.user),
  })
})

export const changePasswordController = asyncHandler(async (req, res) => {
  const payload = changePasswordSchema.parse(req.body)
  const user = await changePassword(
    req.auth!.user._id,
    payload.currentPassword,
    payload.newPassword
  )

  res.status(200).json({
    message: 'Password changed successfully',
    user,
  })
})
