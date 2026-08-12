import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export const attendanceStatuses = ['present', 'absent', 'leave'] as const
export type AttendanceStatus = (typeof attendanceStatuses)[number]

export interface AttendanceRecord {
  student: Types.ObjectId
  status: AttendanceStatus
}

export interface AttendanceSession {
  courseOffering: Types.ObjectId
  section: Types.ObjectId
  teacher: Types.ObjectId
  date: Date
  dateKey: string
  records: AttendanceRecord[]
  createdAt?: Date
  updatedAt?: Date
}

export type AttendanceSessionDocument = HydratedDocument<AttendanceSession>

const attendanceRecordSchema = new Schema<AttendanceRecord>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: attendanceStatuses, required: true },
  },
  { _id: false }
)

const attendanceSessionSchema = new Schema<AttendanceSession>(
  {
    courseOffering: {
      type: Schema.Types.ObjectId,
      ref: 'CourseOffering',
      required: true,
      index: true,
    },
    section: { type: Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    dateKey: { type: String, required: true, trim: true },
    records: { type: [attendanceRecordSchema], default: [] },
  },
  { timestamps: true }
)

attendanceSessionSchema.index({ courseOffering: 1, dateKey: 1 }, { unique: true })
attendanceSessionSchema.index({ teacher: 1, dateKey: -1 })
attendanceSessionSchema.index({ section: 1, dateKey: -1 })

export const AttendanceSessionModel = model('AttendanceSession', attendanceSessionSchema)
