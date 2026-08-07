import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { randomUUID } from 'node:crypto'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { errorMiddleware } from './middlewares/error.middleware.js'
import { notFoundMiddleware } from './middlewares/not-found.middleware.js'
import { apiRoutes } from './routes/index.js'

export const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
)
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const requestId = req.headers['x-request-id']
      const id = Array.isArray(requestId) ? requestId[0] : requestId

      if (id) {
        res.setHeader('x-request-id', id)
        return id
      }

      const generatedId = randomUUID()
      res.setHeader('x-request-id', generatedId)
      return generatedId
    },
    customLogLevel: (_req, res, error) => {
      if (error || res.statusCode >= 500) {
        return 'error'
      }

      if (res.statusCode >= 400) {
        return 'warn'
      }

      return 'info'
    },
  })
)
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api', apiRoutes)
app.use(notFoundMiddleware)
app.use(errorMiddleware)
