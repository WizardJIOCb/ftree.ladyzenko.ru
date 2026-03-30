import type { FastifyInstance } from 'fastify'

import { pool } from '../db/index.js'

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/api/health', async () => {
    await pool.query('select 1')

    return {
      ok: true,
      service: 'geodom-api',
      database: 'connected',
      checkedAt: new Date().toISOString(),
    }
  })
}
