import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from './logger.js'

const databaseState = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
} as const

mongoose.connection.on('disconnected', () => {
  logger.warn('Database disconnected')
})

mongoose.connection.on('reconnected', () => {
  logger.info('Database reconnected')
})

mongoose.connection.on('error', (error) => {
  logger.error({ err: error }, 'Database connection error')
})

export async function connectDatabase() {
  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: env.DB_CONNECTION_TIMEOUT_MS,
    })

    logger.info(
      {
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        readyState: getDatabaseStatus(),
      },
      'Database connected'
    )
  } catch (error) {
    logger.fatal({ err: error }, 'Database connection failed')
    throw error
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}

export function getDatabaseStatus() {
  return databaseState[mongoose.connection.readyState as keyof typeof databaseState] ?? 'unknown'
}
