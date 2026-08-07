import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import type { SessionDocument } from '../models/session.model.js'
import type { UserDocument, UserRole } from '../models/user.model.js'
import { resolveSession } from '../services/auth.service.js'
import { ApiError } from '../utils/api-error.js'

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      token: string
      user: UserDocument
      session: SessionDocument
    }
  }
}

function getBearerToken(authorization?: string) {
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length).trim()
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies[env.AUTH_COOKIE_NAME] ?? getBearerToken(req.header('authorization'))

  if (!token) {
    next(new ApiError(401, 'Authentication required'))
    return
  }

  const auth = await resolveSession(token)

  if (!auth) {
    next(new ApiError(401, 'Session is invalid or expired'))
    return
  }

  req.auth = {
    token,
    user: auth.user,
    session: auth.session,
  }

  next()
}

export function requirePasswordChanged(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    next(new ApiError(401, 'Authentication required'))
    return
  }

  if (req.auth.user.mustChangePassword) {
    next(new ApiError(403, 'Password change required'))
    return
  }

  next()
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new ApiError(401, 'Authentication required'))
      return
    }

    if (req.auth.user.mustChangePassword) {
      next(new ApiError(403, 'Password change required'))
      return
    }

    if (!roles.includes(req.auth.user.role)) {
      next(new ApiError(403, 'Insufficient role permissions'))
      return
    }

    next()
  }
}
