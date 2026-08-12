import { Schema, model, type HydratedDocument, type Types } from 'mongoose'
import type { AssessmentCategory } from './assessment.model.js'

export const resultStatuses = ['draft', 'pending', 'returned', 'approved'] as const
export type ResultStatus = (typeof resultStatuses)[number]

export interface ResultCategoryTotal {
  category: AssessmentCategory
  obtainedMarks: number
  maximumMarks: number
  percentage: number
  weightedMarks: number
}

export interface ResultRecord {
  student: Types.ObjectId
  categories: ResultCategoryTotal[]
  finalPercentage: number
  letterGrade: string
  gradePoint: number
}

export interface ResultHistoryEntry {
  action: 'submitted' | 'returned' | 'approved' | 'reopened'
  actor: Types.ObjectId
  comment?: string
  occurredAt: Date
}

export interface Result {
  courseOffering: Types.ObjectId
  teacher: Types.ObjectId
  status: ResultStatus
  records: ResultRecord[]
  hodComment?: string
  reopenReason?: string
  submittedAt?: Date
  approvedAt?: Date
  approvedBy?: Types.ObjectId
  returnedAt?: Date
  reopenedAt?: Date
  history: ResultHistoryEntry[]
  createdAt?: Date
  updatedAt?: Date
}

export type ResultDocument = HydratedDocument<Result>

const categoryTotalSchema = new Schema<ResultCategoryTotal>(
  {
    category: { type: String, required: true },
    obtainedMarks: { type: Number, required: true, min: 0 },
    maximumMarks: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    weightedMarks: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
)

const resultRecordSchema = new Schema<ResultRecord>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categories: { type: [categoryTotalSchema], required: true },
    finalPercentage: { type: Number, required: true, min: 0, max: 100 },
    letterGrade: { type: String, required: true, trim: true },
    gradePoint: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const resultHistorySchema = new Schema<ResultHistoryEntry>(
  {
    action: {
      type: String,
      enum: ['submitted', 'returned', 'approved', 'reopened'],
      required: true,
    },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, trim: true, maxlength: 1000 },
    occurredAt: { type: Date, required: true },
  },
  { _id: false }
)

const resultSchema = new Schema<Result>(
  {
    courseOffering: {
      type: Schema.Types.ObjectId,
      ref: 'CourseOffering',
      required: true,
      unique: true,
      index: true,
    },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: resultStatuses, default: 'draft', index: true },
    records: { type: [resultRecordSchema], default: [] },
    hodComment: { type: String, trim: true, maxlength: 1000 },
    reopenReason: { type: String, trim: true, maxlength: 1000 },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    returnedAt: { type: Date },
    reopenedAt: { type: Date },
    history: { type: [resultHistorySchema], default: [] },
  },
  { timestamps: true }
)

resultSchema.index({ teacher: 1, status: 1 })

export const ResultModel = model('Result', resultSchema)
