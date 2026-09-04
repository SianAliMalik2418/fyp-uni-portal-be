import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({ resolveSession: vi.fn() }))
vi.mock('../services/ai-assistant.service.js', () => ({ askStudentAssistant: vi.fn() }))

const authService = await import('../services/auth.service.js')
const aiAssistantService = await import('../services/ai-assistant.service.js')
const { app } = await import('../app.js')

function authenticateAs(role: AuthenticatedUser['role'], mustChangePassword = false) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user: {
      id: '507f1f77bcf86cd799439011',
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Portal User',
      email: `${role}@example.com`,
      role,
      isActive: true,
      mustChangePassword,
    },
  } as never)
}

describe('AI assistant routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(aiAssistantService.askStudentAssistant).mockReset()
  })

  it('answers a validated question for the authenticated student', async () => {
    authenticateAs('student')
    vi.mocked(aiAssistantService.askStudentAssistant).mockResolvedValue({
      answer: 'Your attendance is 80%.',
      grounded: true,
      knowledgeKeys: ['configured-attendance-requirement'],
      contextSections: ['attendance'],
    })

    const payload = {
      message: 'What is my attendance?',
      conversation: [
        { role: 'user', content: 'Show my academic summary.' },
        { role: 'assistant', content: 'Which part should I explain?' },
      ],
    }
    const response = await request(app)
      .post('/api/ai-assistant/chat')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send(payload)
      .expect(200)

    expect(response.body).toEqual({
      answer: 'Your attendance is 80%.',
      grounded: true,
      knowledgeKeys: ['configured-attendance-requirement'],
      contextSections: ['attendance'],
    })
    expect(aiAssistantService.askStudentAssistant).toHaveBeenCalledWith(
      expect.objectContaining({ id: '507f1f77bcf86cd799439011', role: 'student' }),
      payload
    )
  })

  it('rejects malformed input and arbitrary student lookup fields', async () => {
    authenticateAs('student')

    await request(app)
      .post('/api/ai-assistant/chat')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ message: '', studentId: '507f1f77bcf86cd799439099' })
      .expect(400)

    expect(aiAssistantService.askStudentAssistant).not.toHaveBeenCalled()
  })

  it.each(['teacher', 'hod', 'admin'] as const)('blocks the %s role', async (role) => {
    authenticateAs(role)

    await request(app)
      .post('/api/ai-assistant/chat')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ message: 'Show a student result.' })
      .expect(403)

    expect(aiAssistantService.askStudentAssistant).not.toHaveBeenCalled()
  })

  it('blocks temporary-password students', async () => {
    authenticateAs('student', true)

    await request(app)
      .post('/api/ai-assistant/chat')
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ message: 'What is my GPA?' })
      .expect(403)

    expect(aiAssistantService.askStudentAssistant).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    await request(app)
      .post('/api/ai-assistant/chat')
      .send({ message: 'What is my GPA?' })
      .expect(401)
  })
})
