import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/course-offering.model.js', () => ({
  CourseOfferingModel: { findById: vi.fn() },
}))

vi.mock('../models/notification.model.js', () => ({
  notificationTypes: ['result_published'],
  NotificationModel: { bulkWrite: vi.fn() },
}))

const courseOfferingModel = await import('../models/course-offering.model.js')
const notificationModel = await import('../models/notification.model.js')
const { publishResultNotifications } = await import('./notification.service.js')

describe('result notifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates one idempotent publication notification for each result student', async () => {
    const exec = vi.fn().mockResolvedValue({ course: { title: 'Programming Fundamentals' } })
    vi.mocked(courseOfferingModel.CourseOfferingModel.findById).mockReturnValue({
      populate: vi.fn().mockReturnValue({ exec }),
    } as never)

    await publishResultNotifications({
      _id: 'result-1',
      courseOffering: 'offering-1',
      records: [
        { student: 'student-1', letterGrade: 'A' },
        { student: 'student-2', letterGrade: 'B+' },
      ],
    } as never)

    expect(notificationModel.NotificationModel.bulkWrite).toHaveBeenCalledWith([
      expect.objectContaining({
        updateOne: expect.objectContaining({
          filter: { recipient: 'student-1', type: 'result_published', result: 'result-1' },
          upsert: true,
        }),
      }),
      expect.objectContaining({
        updateOne: expect.objectContaining({
          filter: { recipient: 'student-2', type: 'result_published', result: 'result-1' },
          upsert: true,
        }),
      }),
    ])
  })
})
