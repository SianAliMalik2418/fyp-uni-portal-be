import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export interface Section {
  name: string
  program: Types.ObjectId
  batch: Types.ObjectId
  semester: Types.ObjectId
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type SectionDocument = HydratedDocument<Section>

const sectionSchema = new Schema<Section>(
  {
    name: { type: String, required: true, trim: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

sectionSchema.index({ program: 1, batch: 1, semester: 1, name: 1 }, { unique: true })

export const SectionModel = model('Section', sectionSchema)
