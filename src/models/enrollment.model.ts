import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export interface Enrollment {
  student: Types.ObjectId
  courseOffering: Types.ObjectId
  section: Types.ObjectId
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type EnrollmentDocument = HydratedDocument<Enrollment>

const enrollmentSchema = new Schema<Enrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseOffering: {
      type: Schema.Types.ObjectId,
      ref: 'CourseOffering',
      required: true,
      index: true,
    },
    section: { type: Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

enrollmentSchema.index({ student: 1, courseOffering: 1 }, { unique: true })

export const EnrollmentModel = model('Enrollment', enrollmentSchema)
