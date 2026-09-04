import { describe, expect, it } from 'vitest'
import { aiChatRequestSchema, aiModelOutputSchema } from './ai-assistant.validator.js'

describe('AI assistant validators', () => {
  it('accepts a bounded alternating conversation', () => {
    const result = aiChatRequestSchema.parse({
      message: 'What about my final exam?',
      conversation: [
        { role: 'user', content: 'When is my next exam?' },
        { role: 'assistant', content: 'Your next listed exam is the midterm.' },
      ],
    })

    expect(result.conversation).toHaveLength(2)
  })

  it('rejects arbitrary student IDs and unfinished conversation history', () => {
    expect(() =>
      aiChatRequestSchema.parse({ message: 'Show attendance', studentId: 'student-2' })
    ).toThrow()
    expect(() =>
      aiChatRequestSchema.parse({
        message: 'Continue',
        conversation: [{ role: 'user', content: 'What is my GPA?' }],
      })
    ).toThrow()
  })

  it('rejects oversized conversation context', () => {
    const conversation = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `Message ${index}`,
    }))

    expect(() => aiChatRequestSchema.parse({ message: 'Continue', conversation })).toThrow()
  })

  it('validates the structured Gemini response', () => {
    expect(
      aiModelOutputSchema.parse({
        answer: 'Your CGPA is 3.1.',
        grounded: true,
        knowledgeKeys: [],
        contextSections: ['gpa'],
      })
    ).toEqual({
      answer: 'Your CGPA is 3.1.',
      grounded: true,
      knowledgeKeys: [],
      contextSections: ['gpa'],
    })

    expect(() =>
      aiModelOutputSchema.parse({ answer: 'Unbounded output', grounded: true, rawContext: {} })
    ).toThrow()
  })
})
