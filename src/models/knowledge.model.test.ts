import { describe, expect, it } from 'vitest'
import { KnowledgeModel } from './knowledge.model.js'

describe('knowledge model', () => {
  it('accepts a complete developer-managed knowledge record', async () => {
    const record = new KnowledgeModel({
      knowledgeKey: 'attendance-contact',
      title: 'Attendance contact',
      category: 'attendance_rules',
      question: 'Who should I contact about attendance?',
      information: 'Contact the academic office listed by the university.',
      keywords: ['attendance', 'contact'],
      isActive: true,
    })

    await expect(record.validate()).resolves.toBeUndefined()
    expect(record.isActive).toBe(true)
  })

  it('rejects unsupported categories and empty information', async () => {
    const record = new KnowledgeModel({
      knowledgeKey: 'bad-record',
      title: 'Bad record',
      category: 'course_materials',
      information: '',
      keywords: [],
    })

    await expect(record.validate()).rejects.toEqual(
      expect.objectContaining({
        errors: expect.objectContaining({
          category: expect.anything(),
          information: expect.anything(),
        }),
      })
    )
  })
})
