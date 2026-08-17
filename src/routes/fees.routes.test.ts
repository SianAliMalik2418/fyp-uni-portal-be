import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('../services/fee.service.js', () => ({
  getCurrentStudentFee: vi.fn(),
  upsertCurrentStudentFee: vi.fn(),
}))

const authService = await import('../services/auth.service.js')
const feeService = await import('../services/fee.service.js')
const { app } = await import('../app.js')

const admin = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Portal Admin',
  email: 'admin@example.com',
  role: 'admin' as const,
  isActive: true,
  mustChangePassword: false,
}

const student = {
  ...admin,
  id: '507f1f77bcf86cd799439012',
  _id: '507f1f77bcf86cd799439012',
  fullName: 'Hammad Student',
  email: 'student@example.com',
  role: 'student' as const,
}

const fee = {
  id: '507f1f77bcf86cd799439013',
  student: {
    id: student.id,
    fullName: student.fullName,
    registrationNumber: 'NCBAE-2026-CS-001',
  },
  semester: {
    id: '507f1f77bcf86cd799439014',
    name: 'Fall Semester',
    academicYear: '2026-2027',
  },
  totalAmount: 100_000,
  paidAmount: 40_000,
  remainingAmount: 60_000,
  dueDate: '2026-09-15',
  paymentDate: '2026-08-10',
  notes: 'First installment received',
  status: 'partially_paid' as const,
}

function authenticateAs(user: typeof admin | typeof student) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user,
  } as never)
}

describe('fees routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(feeService.getCurrentStudentFee).mockReset()
    vi.mocked(feeService.upsertCurrentStudentFee).mockReset()
  })

  it('lets a student retrieve only their current fee record', async () => {
    authenticateAs(student)
    vi.mocked(feeService.getCurrentStudentFee).mockResolvedValue(fee)

    const response = await request(app)
      .get('/api/fees/me')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(feeService.getCurrentStudentFee).toHaveBeenCalledWith(student.id)
    expect(response.body).toEqual({ fee })
  })

  it('requires authentication for fee information', async () => {
    vi.mocked(authService.resolveSession).mockResolvedValue(null)

    await request(app).get('/api/fees/me').expect(401)

    expect(feeService.getCurrentStudentFee).not.toHaveBeenCalled()
  })

  it('blocks admins from the student self-service endpoint', async () => {
    authenticateAs(admin)

    await request(app)
      .get('/api/fees/me')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)

    expect(feeService.getCurrentStudentFee).not.toHaveBeenCalled()
  })

  it('lets an admin retrieve a selected student fee record', async () => {
    authenticateAs(admin)
    vi.mocked(feeService.getCurrentStudentFee).mockResolvedValue(fee)

    await request(app)
      .get(`/api/fees/students/${student.id}`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200, { fee })

    expect(feeService.getCurrentStudentFee).toHaveBeenCalledWith(student.id)
  })

  it('lets an admin create or update a selected student fee record', async () => {
    authenticateAs(admin)
    vi.mocked(feeService.upsertCurrentStudentFee).mockResolvedValue(fee)

    const payload = {
      totalAmount: 100_000,
      paidAmount: 40_000,
      dueDate: '2026-09-15',
      paymentDate: '2026-08-10',
      notes: 'First installment received',
    }
    const response = await request(app)
      .put(`/api/fees/students/${student.id}`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .send(payload)
      .expect(200)

    expect(feeService.upsertCurrentStudentFee).toHaveBeenCalledWith(student.id, payload)
    expect(response.body).toEqual({ message: 'Fee information saved', fee })
  })

  it('rejects a paid amount greater than the total amount', async () => {
    authenticateAs(admin)

    await request(app)
      .put(`/api/fees/students/${student.id}`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        totalAmount: 25_000,
        paidAmount: 30_000,
        dueDate: '2026-09-15',
      })
      .expect(400)

    expect(feeService.upsertCurrentStudentFee).not.toHaveBeenCalled()
  })

  it('blocks students from retrieving another student fee record', async () => {
    authenticateAs(student)

    await request(app)
      .get('/api/fees/students/507f1f77bcf86cd799439099')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)

    expect(feeService.getCurrentStudentFee).not.toHaveBeenCalled()
  })

  it('blocks non-admin users from modifying fee records', async () => {
    authenticateAs(student)

    await request(app)
      .put(`/api/fees/students/${student.id}`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({ totalAmount: 100_000, paidAmount: 0, dueDate: '2026-09-15' })
      .expect(403)

    expect(feeService.upsertCurrentStudentFee).not.toHaveBeenCalled()
  })
})
