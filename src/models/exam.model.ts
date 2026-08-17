import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export interface Exam {
  examType: string
  courseOffering: Types.ObjectId
  course: Types.ObjectId
  program: Types.ObjectId
  semester: Types.ObjectId
  section: Types.ObjectId
  examDate: Date
  startTime: string
  endTime: string
  startMinutes: number
  endMinutes: number
  room: string
  instructions?: string
  createdBy: Types.ObjectId
  updatedBy: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export type ExamDocument = HydratedDocument<Exam>

const examSchema = new Schema<Exam>(
  {
    examType: { type: String, required: true, trim: true },
    courseOffering: {
      type: Schema.Types.ObjectId,
      ref: 'CourseOffering',
      required: true,
      index: true,
    },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    section: { type: Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    examDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    startMinutes: { type: Number, required: true, min: 0, max: 1439 },
    endMinutes: { type: Number, required: true, min: 1, max: 1440 },
    room: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

examSchema.index({ section: 1, examDate: 1, startMinutes: 1 })
examSchema.index({ courseOffering: 1, examDate: 1, startMinutes: 1 })
examSchema.index({ semester: 1, examDate: 1 })

export const ExamModel = model('Exam', examSchema)
