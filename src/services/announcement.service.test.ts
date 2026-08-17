import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/announcement.model.js', () => ({
  AnnouncementModel: {
    countDocuments: vi.fn(),
    find: vi.fn(),
  },
}))

const announcementModel = await import('../models/announcement.model.js')
const { listAnnouncements } = await import('./announcement.service.js')

describe('announcement service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('limits non-admin users to currently active announcements and orders pinned first', async () => {
    const now = new Date('2026-08-17T12:00:00.000Z')
    vi.setSystemTime(now)
    const exec = vi.fn().mockResolvedValue([])
    const limit = vi.fn().mockReturnValue({ exec })
    const skip = vi.fn().mockReturnValue({ limit })
    const sort = vi.fn().mockReturnValue({ skip })
    vi.mocked(announcementModel.AnnouncementModel.find).mockReturnValue({ sort } as never)
    vi.mocked(announcementModel.AnnouncementModel.countDocuments).mockReturnValue({
      exec: vi.fn().mockResolvedValue(0),
    } as never)

    await listAnnouncements({ role: 'student' } as never, { status: 'all', page: 1, limit: 20 })

    const activeFilter = {
      isActive: true,
      publishDate: { $lte: now },
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }],
    }
    expect(announcementModel.AnnouncementModel.find).toHaveBeenCalledWith(activeFilter)
    expect(announcementModel.AnnouncementModel.countDocuments).toHaveBeenCalledWith(activeFilter)
    expect(sort).toHaveBeenCalledWith({ isPinned: -1, publishDate: -1, createdAt: -1 })
    expect(limit).toHaveBeenCalledWith(20)
  })
})
