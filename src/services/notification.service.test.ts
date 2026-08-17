import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/course-offering.model.js', () => ({
  CourseOfferingModel: { findById: vi.fn() },
}))

vi.mock('../models/notification.model.js', () => ({
  notificationTypes: [
    'account_created',
    'course_assigned',
    'attendance_updated',
    'result_returned',
    'result_approved',
    'result_published',
  ],
  NotificationModel: { bulkWrite: vi.fn(), updateMany: vi.fn() },
}))

const courseOfferingModel = await import('../models/course-offering.model.js')
const notificationModel = await import('../models/notification.model.js')
const {
  markAllNotificationsRead,
  notifyAttendanceUpdated,
  notifyResultApproved,
  notifyResultReturned,
  publishResultNotifications,
} = await import('./notification.service.js')

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
          filter: {
            recipient: 'student-1',
            notificationKey: 'result_published:result-1:student-1',
          },
          upsert: true,
        }),
      }),
      expect.objectContaining({
        updateOne: expect.objectContaining({
          filter: {
            recipient: 'student-2',
            notificationKey: 'result_published:result-1:student-2',
          },
          upsert: true,
        }),
      }),
    ])
  })

  it('notifies each attendance student using the session and student as the idempotency scope', async () => {
    await notifyAttendanceUpdated({
      _id: 'session-1',
      courseOffering: 'offering-1',
      dateKey: '2026-08-17',
      records: [{ student: 'student-1' }, { student: 'student-2' }],
    } as never)

    expect(notificationModel.NotificationModel.bulkWrite).toHaveBeenCalledWith([
      expect.objectContaining({
        updateOne: expect.objectContaining({
          filter: {
            recipient: 'student-1',
            notificationKey: 'attendance_updated:session-1:student-1',
          },
          upsert: true,
        }),
      }),
      expect.objectContaining({
        updateOne: expect.objectContaining({
          filter: {
            recipient: 'student-2',
            notificationKey: 'attendance_updated:session-1:student-2',
          },
          upsert: true,
        }),
      }),
    ])
  })

  it('notifies the submitting teacher when a result is returned and approved', async () => {
    const result = {
      _id: 'result-1',
      teacher: 'teacher-1',
      courseOffering: 'offering-1',
      records: [],
    }

    await notifyResultReturned(result as never, 'Please verify the marks.')
    await notifyResultApproved(result as never)

    expect(notificationModel.NotificationModel.bulkWrite).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: {
              recipient: 'teacher-1',
              notificationKey: 'result_returned:result-1',
            },
          }),
        }),
      ])
    )
    expect(notificationModel.NotificationModel.bulkWrite).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: {
              recipient: 'teacher-1',
              notificationKey: 'result_approved:result-1',
            },
          }),
        }),
      ])
    )
  })

  it('marks only the current user unread notifications as read', async () => {
    const exec = vi.fn().mockResolvedValue({ modifiedCount: 4 })
    vi.mocked(notificationModel.NotificationModel.updateMany).mockReturnValue({ exec } as never)

    const updatedCount = await markAllNotificationsRead({ _id: 'user-1' } as never)

    expect(updatedCount).toBe(4)
    expect(notificationModel.NotificationModel.updateMany).toHaveBeenCalledWith(
      { recipient: 'user-1', readAt: { $exists: false } },
      { $set: { readAt: expect.any(Date) } }
    )
  })
})
