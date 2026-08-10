import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export interface Batch {
  name: string
  program: Types.ObjectId
  startingYear: number
  expectedGraduationYear: number
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type BatchDocument = HydratedDocument<Batch>

const batchSchema = new Schema<Batch>(
  {
    name: { type: String, required: true, trim: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    startingYear: { type: Number, required: true, min: 2000, max: 2100 },
    expectedGraduationYear: { type: Number, required: true, min: 2000, max: 2100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

batchSchema.index({ program: 1, name: 1 }, { unique: true })
batchSchema.index({ program: 1, startingYear: 1 }, { unique: true })

export const BatchModel = model('Batch', batchSchema)
