import { spawnSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import type { Server } from 'node:http'
import { app } from '../app.js'
import { connectDatabase, disconnectDatabase } from '../config/db.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

function runSeed(args: string[] = []) {
  const result = spawnSync('bunx', ['tsx', 'src/scripts/seed-e2e.ts', ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`E2E seed exited with status ${result.status ?? 'unknown'}`)
  }
}

function closeServer(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function cleanup() {
  await disconnectDatabase()
  runSeed(['--cleanup'])
  await rm(env.UPLOAD_DIR, { recursive: true, force: true })
}

async function bootstrap() {
  if (env.NODE_ENV !== 'test') {
    throw new Error('The e2e server runner only runs with NODE_ENV=test')
  }

  runSeed()
  await connectDatabase()

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'E2E API server listening')
  })

  let isShuttingDown = false
  const shutdown = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) return
    isShuttingDown = true
    logger.info({ signal }, 'Stopping E2E API server')

    try {
      await closeServer(server)
      await cleanup()
      process.exit(0)
    } catch (error) {
      logger.error({ err: error }, 'E2E API server cleanup failed')
      process.exit(1)
    }
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

void bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start E2E API server')
  process.exit(1)
})
