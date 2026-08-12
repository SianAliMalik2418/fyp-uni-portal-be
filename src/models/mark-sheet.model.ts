import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export const markStatuses = ['absent', 'exempted', 'result_withheld'] as const
export type MarkStatus = (typeof markStatuses)[number]

export interface MarkRecord {
  student: Types.ObjectId
  obtainedMarks?: number
  status?: MarkStatus
}

export interface MarkSheet {
  assessment: Types.ObjectId
  courseOffering: Types.ObjectId
  teacher: Types.ObjectId
  records: MarkRecord[]
  isDraft: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type MarkSheetDocument = HydratedDocument<MarkSheet>

const markRecordSchema = new Schema<MarkRecord>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    obtainedMarks: { type: Number, min: 0 },
    status: { type: String, enum: markStatuses },
  },
  { _id: false }
)

const markSheetSchema = new Schema<MarkSheet>(
  {
    assessment: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      unique: true,
      index: true,
    },
    courseOffering: {
      type: Schema.Types.ObjectId,
      ref: 'CourseOffering',
      required: true,
      index: true,
    },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    records: { type: [markRecordSchema], default: [] },
    isDraft: { type: Boolean, default: true },
  },
  { timestamps: true }
)

markSheetSchema.index({ courseOffering: 1, teacher: 1 })

export const MarkSheetModel = model('MarkSheet', markSheetSchema)
