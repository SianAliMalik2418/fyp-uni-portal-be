import { Schema, model, type HydratedDocument } from 'mongoose'

export const knowledgeCategories = [
  'attendance_rules',
  'passing_rules',
  'examination_rules',
  'grading_policy',
  'academic_procedures',
  'fee_faqs',
  'general_university_faqs',
] as const

export type KnowledgeCategory = (typeof knowledgeCategories)[number]

export interface Knowledge {
  knowledgeKey: string
  title: string
  category: KnowledgeCategory
  question?: string
  information: string
  keywords: string[]
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type KnowledgeDocument = HydratedDocument<Knowledge>

const knowledgeSchema = new Schema<Knowledge>(
  {
    knowledgeKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
      unique: true,
      immutable: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, enum: knowledgeCategories, required: true, index: true },
    question: { type: String, trim: true, maxlength: 500 },
    information: { type: String, required: true, trim: true, maxlength: 10_000 },
    keywords: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
)

knowledgeSchema.index(
  { title: 'text', question: 'text', information: 'text', keywords: 'text' },
  { weights: { title: 8, question: 6, keywords: 4, information: 1 } }
)
knowledgeSchema.index({ isActive: 1, category: 1, updatedAt: -1 })

export const KnowledgeModel = model('Knowledge', knowledgeSchema)
