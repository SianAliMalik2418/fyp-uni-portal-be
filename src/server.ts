import { env } from './config/env.js'
import { connectDatabase } from './config/db.js'
import { app } from './app.js'

async function bootstrap() {
  await connectDatabase()

  app.listen(env.PORT, () => {
    console.log(`API server listening on http://localhost:${env.PORT}`)
  })
}

void bootstrap().catch((error) => {
  console.error('Failed to start API server', error)
  process.exit(1)
})
