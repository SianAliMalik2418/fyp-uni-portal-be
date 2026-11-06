import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai'
import { logger } from '../config/logger.js'
import { env } from '../config/env.js'
import { aiContextSections } from '../validators/ai-assistant.validator.js'
import type { GeminiAssistantRequest } from './ai-assistant.service.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
export const GEMINI_ASSISTANT_MODEL = 'gemini-3.6-flash'
// Free-tier quotas are tracked per model, so fall through these when one is rate-limited or overloaded.
export const GEMINI_FALLBACK_MODELS = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite'] as const
const FALLBACK_STATUSES = new Set([404, 429, 500, 502, 503, 504])

function isFallbackWorthy(error: unknown) {
  const status = (error as { status?: unknown } | null)?.status
  return typeof status === 'number' && FALLBACK_STATUSES.has(status)
}

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
  const models = [GEMINI_ASSISTANT_MODEL, ...GEMINI_FALLBACK_MODELS]

  for (const [index, modelName] of models.entries()) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: request.systemInstruction,
      generationConfig: {
        candidateCount: 1,
        maxOutputTokens: 2048,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: assistantResponseSchema,
      },
    })
    try {
      const result = await model.generateContent({ contents })
      return result.response.text()
    } catch (error) {
      const next = models[index + 1]
      if (!next || !isFallbackWorthy(error)) throw error
      logger.warn(
        { err: error, model: modelName, fallbackTo: next },
        'Gemini model failed, falling back'
      )
    }
  }
  throw new Error('No Gemini model available')
}
