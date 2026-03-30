import Fastify from 'fastify'
import cors from '@fastify/cors'

import { bootstrapDatabase } from './db/bootstrap.js'
import { pool } from './db/index.js'
import { env } from './env.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerTreeRoutes } from './routes/trees.js'

const app = Fastify({
  logger: true,
})

await app.register(cors, {
  origin: true,
})

await registerHealthRoutes(app)
await registerTreeRoutes(app)

app.get('/api', async () => ({
  ok: true,
  service: 'geodom-api',
}))

async function close() {
  await app.close()
  await pool.end()
}

process.on('SIGINT', () => {
  void close()
})

process.on('SIGTERM', () => {
  void close()
})

try {
  await bootstrapDatabase()
  await app.listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
} catch (error) {
  app.log.error(error)
  await close()
  process.exit(1)
}
