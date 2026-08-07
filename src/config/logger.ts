import pino from 'pino'
import { env } from './env.js'

const isDevelopment = env.NODE_ENV === 'development'

export const logger = pino({
  enabled: env.NODE_ENV !== 'test',
  level: env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers.set-cookie',
      'password',
      '*.password',
      'passwordHash',
      '*.passwordHash',
      'token',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          singleLine: true,
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
})
