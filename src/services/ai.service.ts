import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/env.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
}
