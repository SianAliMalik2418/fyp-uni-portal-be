import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedUser } from '../services/auth.service.js'

process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/fyp_uni_portal_test'
process.env.GEMINI_API_KEY = 'test-gemini-api-key'

vi.mock('../services/auth.service.js', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('../services/timetable.service.js', () => ({
  getAdminSectionTimetableWorkspace: vi.fn(),
  getStudentTimetable: vi.fn(),
  getTeacherTimetables: vi.fn(),
  publishSectionTimetableDraft: vi.fn(),
  saveSectionTimetableDraft: vi.fn(),
}))

type MockUserDocument = {
  id: string
  _id: string
  fullName: string
  email: string
  role: AuthenticatedUser['role']
  isActive: boolean
  mustChangePassword: boolean
}

const authService = await import('../services/auth.service.js')
const timetableService = await import('../services/timetable.service.js')
const { app } = await import('../app.js')

const adminDocument: MockUserDocument = {
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Portal Admin',
  email: 'admin@example.com',
  role: 'admin',
  isActive: true,
  mustChangePassword: false,
}

const section = {
  id: '507f1f77bcf86cd799439012',
  name: 'A',
  program: {
    id: '507f1f77bcf86cd799439013',
    name: 'BS Computer Science',
    code: 'BSCS',
    isActive: true,
  },
  batch: {
    id: '507f1f77bcf86cd799439014',
    name: 'Fall 2023',
    startingYear: 2023,
    expectedGraduationYear: 2027,
    isActive: true,
  },
  semester: {
    id: '507f1f77bcf86cd799439015',
    name: 'Fall Semester',
    academicYear: '2026-2027',
    isActive: true,
    isClosed: false,
  },
  isActive: true,
}

const offering = {
  id: '507f1f77bcf86cd799439016',
  course: {
    id: '507f1f77bcf86cd799439017',
    code: 'CS101',
    title: 'Programming Fundamentals',
    creditHours: 3,
  },
  teacher: {
    id: '507f1f77bcf86cd799439019',
    fullName: 'Hammad Teacher',
    email: 'hammad.teacher@example.com',
    employeeId: 'EMP-042',
  },
  isActive: true,
}

const draftTimetable = {
  id: '507f1f77bcf86cd799439020',
  section,
  status: 'draft',
  version: 2,
  notes: 'Draft before publication',
  publishedAt: null,
  entries: [
    {
      id: '507f1f77bcf86cd799439021',
      dayOfWeek: 'monday',
      startTime: '09:00',
      endTime: '10:30',
      room: 'Lab 1',
      slotType: 'lecture',
      notes: 'Bring lab manuals',
      courseOffering: offering,
    },
  ],
}

const publishedTimetable = {
  ...draftTimetable,
  id: '507f1f77bcf86cd799439022',
  status: 'published',
  version: 1,
  publishedAt: '2026-08-10T09:00:00.000Z',
  notes: 'Current live schedule',
}

function authenticateAs(user: MockUserDocument) {
  vi.mocked(authService.resolveSession).mockResolvedValue({
    session: { id: 'session-id' },
    user,
  } as never)
}

describe('timetable routes', () => {
  beforeEach(() => {
    vi.mocked(authService.resolveSession).mockReset()
    vi.mocked(timetableService.getAdminSectionTimetableWorkspace).mockReset()
    vi.mocked(timetableService.getStudentTimetable).mockReset()
    vi.mocked(timetableService.getTeacherTimetables).mockReset()
    vi.mocked(timetableService.publishSectionTimetableDraft).mockReset()
    vi.mocked(timetableService.saveSectionTimetableDraft).mockReset()
  })

  it('lets admins load a section timetable workspace', async () => {
    authenticateAs(adminDocument)
    vi.mocked(timetableService.getAdminSectionTimetableWorkspace).mockResolvedValue({
      section,
      availableCourseOfferings: [offering],
      draftTimetable,
      publishedTimetable,
    } as never)

    const response = await request(app)
      .get(`/api/timetable/sections/${section.id}`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(timetableService.getAdminSectionTimetableWorkspace).toHaveBeenCalledWith(section.id)
    expect(response.body).toEqual({
      section,
      availableCourseOfferings: [offering],
      draftTimetable,
      publishedTimetable,
    })
  })

  it('lets admins save a timetable draft for a section', async () => {
    authenticateAs(adminDocument)
    vi.mocked(timetableService.saveSectionTimetableDraft).mockResolvedValue(draftTimetable as never)

    const payload = {
      notes: 'Draft before publication',
      entries: [
        {
          courseOfferingId: offering.id,
          dayOfWeek: 'monday',
          startTime: '09:00',
          endTime: '10:30',
          room: 'Lab 1',
          slotType: 'lecture',
          notes: 'Bring lab manuals',
        },
      ],
    }

    const response = await request(app)
      .put(`/api/timetable/sections/${section.id}/draft`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .send(payload)
      .expect(200)

    expect(timetableService.saveSectionTimetableDraft).toHaveBeenCalledWith(section.id, payload, {
      userId: adminDocument.id,
    })
    expect(response.body).toEqual({
      message: 'Timetable draft saved',
      timetable: draftTimetable,
    })
  })

  it('lets admins publish a section draft timetable', async () => {
    authenticateAs(adminDocument)
    vi.mocked(timetableService.publishSectionTimetableDraft).mockResolvedValue(
      publishedTimetable as never
    )

    const response = await request(app)
      .post(`/api/timetable/sections/${section.id}/publish`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(timetableService.publishSectionTimetableDraft).toHaveBeenCalledWith(section.id, {
      userId: adminDocument.id,
    })
    expect(response.body).toEqual({
      message: 'Timetable published',
      timetable: publishedTimetable,
    })
  })

  it('returns the authenticated student timetable', async () => {
    authenticateAs({ ...adminDocument, role: 'student' })
    vi.mocked(timetableService.getStudentTimetable).mockResolvedValue(publishedTimetable as never)

    const response = await request(app)
      .get('/api/timetable/me/student')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(timetableService.getStudentTimetable).toHaveBeenCalledWith(
      expect.objectContaining({ id: adminDocument.id, role: 'student' })
    )
    expect(response.body).toEqual({ timetable: publishedTimetable })
  })

  it('returns only the authenticated teacher timetable entries', async () => {
    authenticateAs({ ...adminDocument, role: 'teacher' })
    vi.mocked(timetableService.getTeacherTimetables).mockResolvedValue([
      publishedTimetable,
    ] as never)

    const response = await request(app)
      .get('/api/timetable/me/teacher')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(200)

    expect(timetableService.getTeacherTimetables).toHaveBeenCalledWith(
      expect.objectContaining({ id: adminDocument.id, role: 'teacher' })
    )
    expect(response.body).toEqual({ timetables: [publishedTimetable] })
  })

  it('blocks non-admin users from timetable administration routes', async () => {
    authenticateAs({ ...adminDocument, role: 'teacher' })

    await request(app)
      .put(`/api/timetable/sections/${section.id}/draft`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        entries: [
          {
            courseOfferingId: offering.id,
            dayOfWeek: 'monday',
            startTime: '09:00',
            endTime: '10:30',
            room: 'Lab 1',
          },
        ],
      })
      .expect(403)

    expect(timetableService.saveSectionTimetableDraft).not.toHaveBeenCalled()
  })

  it('requires authentication for timetable access', async () => {
    vi.mocked(authService.resolveSession).mockResolvedValue(null)

    await request(app).get('/api/timetable/me/student').expect(401)

    expect(timetableService.getStudentTimetable).not.toHaveBeenCalled()
  })

  it('prevents students from reading teacher timetables', async () => {
    authenticateAs({ ...adminDocument, role: 'student' })

    await request(app)
      .get('/api/timetable/me/teacher')
      .set('Cookie', ['portal_session=raw-session-token'])
      .expect(403)

    expect(timetableService.getTeacherTimetables).not.toHaveBeenCalled()
  })

  it('rejects malformed timetable payloads', async () => {
    authenticateAs(adminDocument)

    await request(app)
      .put(`/api/timetable/sections/${section.id}/draft`)
      .set('Cookie', ['portal_session=raw-session-token'])
      .send({
        entries: [
          {
            courseOfferingId: offering.id,
            dayOfWeek: 'monday',
            startTime: '11:00',
            endTime: '10:30',
            room: '',
          },
        ],
      })
      .expect(400)

    expect(timetableService.saveSectionTimetableDraft).not.toHaveBeenCalled()
  })
})
