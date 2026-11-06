import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai'
import { env } from '../config/env.js'
import { aiContextSections } from '../validators/ai-assistant.validator.js'
import type { GeminiAssistantRequest } from './ai-assistant.service.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
export const GEMINI_ASSISTANT_MODEL = 'gemini-3.6-flash'

const assistantResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    answer: { type: SchemaType.STRING },
    grounded: { type: SchemaType.BOOLEAN },
    knowledgeKeys: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      maxItems: 5,
    },
    contextSections: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, format: 'enum', enum: [...aiContextSections] },
      maxItems: 6,
    },
  },
  required: ['answer', 'grounded', 'knowledgeKeys', 'contextSections'],
}

export async function generateGeminiAssistantResponse(request: GeminiAssistantRequest) {
  const model = genAI.getGenerativeModel({
    model: GEMINI_ASSISTANT_MODEL,
    systemInstruction: request.systemInstruction,
    generationConfig: {
      candidateCount: 1,
      maxOutputTokens: 2048,
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: assistantResponseSchema,
    },
  })
  const contents = request.messages.map((message, index) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [
      {
        text:
          index === request.messages.length - 1
            ? `TRUSTED_GROUNDING:\n${JSON.stringify(request.grounding)}\n\nQUESTION:\n${message.content}`
            : message.content,
      },
    ],
  }))
  const result = await model.generateContent({ contents })
  return result.response.text()
}
