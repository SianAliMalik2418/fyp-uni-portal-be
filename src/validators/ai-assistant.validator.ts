import { z } from 'zod'

export const aiContextSections = [
  'identity',
  'academic_structure',
  'courses',
  'attendance',
  'marks',
  'grades',
  'gpa',
  'results',
  'fee',
  'timetable',
  'exams',
  'announcements',
] as const

const conversationMessageSchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(2_000),
  })
  .strict()

export const aiChatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(1_000),
    conversation: z.array(conversationMessageSchema).max(8).default([]),
  })
  .strict()
  .superRefine(({ conversation }, context) => {
    const hasInvalidOrder = conversation.some(
      (message, index) => message.role !== (index % 2 === 0 ? 'user' : 'assistant')
    )

    if (hasInvalidOrder || (conversation.length > 0 && conversation.at(-1)?.role !== 'assistant')) {
      context.addIssue({
        code: 'custom',
        path: ['conversation'],
        message: 'Conversation must contain complete alternating user and assistant turns.',
      })
    }

    const totalCharacters = conversation.reduce(
      (total, message) => total + message.content.length,
      0
    )
    if (totalCharacters > 8_000) {
      context.addIssue({
        code: 'custom',
        path: ['conversation'],
        message: 'Conversation context is too large.',
      })
    }
  })

export const aiModelOutputSchema = z
  .object({
    answer: z.string().trim().min(1).max(2_000),
    grounded: z.boolean(),
    knowledgeKeys: z.array(z.string().trim().min(1).max(120)).max(5),
    contextSections: z.array(z.enum(aiContextSections)).max(6),
  })
  .strict()
  .superRefine((output, context) => {
    if (output.grounded && !output.knowledgeKeys.length && !output.contextSections.length) {
      context.addIssue({
        code: 'custom',
        message: 'Grounded responses must identify their evidence.',
      })
    }
  })

export type AiChatRequest = z.infer<typeof aiChatRequestSchema>
export type AiModelOutput = z.infer<typeof aiModelOutputSchema>
export type AiContextSection = (typeof aiContextSections)[number]
