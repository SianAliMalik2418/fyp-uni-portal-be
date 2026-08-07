import { describe, expect, it } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

const { hashPassword, verifyPassword, hashSessionToken } = await import('./auth.service.js')

describe('auth service security helpers', () => {
  it('hashes and verifies passwords without storing the original password', () => {
    const passwordHash = hashPassword('temporary-password')

    expect(passwordHash).not.toBe('temporary-password')
    expect(verifyPassword('temporary-password', passwordHash)).toBe(true)
    expect(verifyPassword('wrong-password', passwordHash)).toBe(false)
  })

  it('uses stable one-way hashes for session token lookup', () => {
    const tokenHash = hashSessionToken('raw-session-token')

    expect(tokenHash).toBe(hashSessionToken('raw-session-token'))
    expect(tokenHash).not.toBe('raw-session-token')
  })
})
