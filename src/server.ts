import { env } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './config/db.js'
import { logger } from './config/logger.js'
import { app } from './app.js'

async function bootstrap() {
  await connectDatabase()

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'API server listening')
  })

  const shutdown = async (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'Shutting down API server')

    server.close(async (error) => {
      if (error) {
        logger.error({ err: error }, 'Error while closing HTTP server')
        process.exit(1)
      }

      await disconnectDatabase()
      logger.info('API server stopped')
      process.exit(0)
    })
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

void bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start API server')
  process.exit(1)
})
