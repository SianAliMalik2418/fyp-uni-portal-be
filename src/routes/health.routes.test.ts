import request from 'supertest'
import { describe, expect, it } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

describe('GET /api/health', () => {
  it('returns service health metadata', async () => {
    const { app } = await import('../app.js')

    const response = await request(app).get('/api/health').expect(200)

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'fyp-uni-portal-be',
    })
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date)
  })
})
