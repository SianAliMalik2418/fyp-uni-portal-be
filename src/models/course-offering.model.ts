import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export interface CourseOffering {
  course: Types.ObjectId
  section: Types.ObjectId
  teacher?: Types.ObjectId
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type CourseOfferingDocument = HydratedDocument<CourseOffering>

const courseOfferingSchema = new Schema<CourseOffering>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    section: { type: Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

courseOfferingSchema.index({ course: 1, section: 1 }, { unique: true })
courseOfferingSchema.index({ teacher: 1, section: 1 })

export const CourseOfferingModel = model('CourseOffering', courseOfferingSchema)
