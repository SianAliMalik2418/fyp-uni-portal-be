import { describe, expect, it } from 'vitest'
import { knowledgeCategories } from '../models/knowledge.model.js'
import { developerKnowledgeRecords } from './developer-knowledge.records.js'

describe('developer knowledge records', () => {
  it('has unique, lowercase, short keys', () => {
    const keys = developerKnowledgeRecords.map((record) => record.knowledgeKey)

    expect(new Set(keys).size).toBe(keys.length)
    for (const key of keys) {
      expect(key).toBe(key.toLowerCase())
      expect(key.length).toBeLessThanOrEqual(120)
    }
  })

  it('stays within the model limits and covers every category', () => {
    for (const record of developerKnowledgeRecords) {
      expect(record.title.length).toBeLessThanOrEqual(200)
      expect(record.question?.length ?? 0).toBeLessThanOrEqual(500)
      expect(record.information.length).toBeLessThanOrEqual(10_000)
      expect(record.keywords.length).toBeGreaterThan(0)
    }

    const covered = new Set(developerKnowledgeRecords.map((record) => record.category))
    expect([...covered].sort()).toEqual([...knowledgeCategories].sort())
  })

  it('is active and answers a question, so the assistant can match it', () => {
    for (const record of developerKnowledgeRecords) {
      expect(record.isActive).toBe(true)
      expect(record.question).toBeTruthy()
    }
  })

  it('does not copy settings an administrator can change', () => {
    const text = developerKnowledgeRecords.map((record) => record.information).join(' ')

    expect(text).not.toMatch(/\b75 percent\b|\b75%/)
    expect(text).not.toMatch(/\b(A-|B\+|C\+)\b.*\b3\.7\b/)
  })
})
