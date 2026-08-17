import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export const timetableStatuses = ['draft', 'published'] as const
export type TimetableStatus = (typeof timetableStatuses)[number]

export const timetableDays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const
export type TimetableDay = (typeof timetableDays)[number]

export const timetableSlotTypes = ['lecture', 'lab', 'tutorial', 'seminar'] as const
export type TimetableSlotType = (typeof timetableSlotTypes)[number]

export interface TimetableEntry {
  _id?: Types.ObjectId
  courseOffering: Types.ObjectId
  course: Types.ObjectId
  teacher?: Types.ObjectId
  dayOfWeek: TimetableDay
  startTime: string
  endTime: string
  startMinutes: number
  endMinutes: number
  room: string
  slotType: TimetableSlotType
  notes?: string
}

export interface Timetable {
  section: Types.ObjectId
  program: Types.ObjectId
  semester: Types.ObjectId
  status: TimetableStatus
  version: number
  notes?: string
  entries: TimetableEntry[]
  createdBy: Types.ObjectId
  updatedBy: Types.ObjectId
  publishedBy?: Types.ObjectId
  publishedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export type TimetableDocument = HydratedDocument<Timetable>

const timetableEntrySchema = new Schema<TimetableEntry>(
  {
    courseOffering: {
      type: Schema.Types.ObjectId,
      ref: 'CourseOffering',
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    dayOfWeek: { type: String, enum: timetableDays, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    startMinutes: { type: Number, required: true, min: 0, max: 1439 },
    endMinutes: { type: Number, required: true, min: 1, max: 1440 },
    room: { type: String, required: true, trim: true },
    slotType: { type: String, enum: timetableSlotTypes, required: true, default: 'lecture' },
    notes: { type: String, trim: true },
  },
  { _id: true, id: true }
)

const timetableSchema = new Schema<Timetable>(
  {
    section: { type: Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    status: { type: String, enum: timetableStatuses, required: true, index: true },
    version: { type: Number, required: true, min: 1 },
    notes: { type: String, trim: true },
    entries: { type: [timetableEntrySchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
  },
  { timestamps: true }
)

timetableSchema.index({ section: 1, status: 1 }, { unique: true })
timetableSchema.index({ semester: 1, status: 1, updatedAt: -1 })
timetableSchema.index({ 'entries.teacher': 1, status: 1 })
timetableSchema.index({ 'entries.courseOffering': 1, status: 1 })

export const TimetableModel = model('Timetable', timetableSchema)
