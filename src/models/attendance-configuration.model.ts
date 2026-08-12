import { Schema, model, type HydratedDocument } from 'mongoose'

export const ATTENDANCE_CONFIGURATION_KEY = 'attendance'

export interface AttendanceConfiguration {
  key: typeof ATTENDANCE_CONFIGURATION_KEY
  minimumAttendancePercentage: number
  createdAt?: Date
  updatedAt?: Date
}

export type AttendanceConfigurationDocument = HydratedDocument<AttendanceConfiguration>

const attendanceConfigurationSchema = new Schema<AttendanceConfiguration>(
  {
    key: {
      type: String,
      enum: [ATTENDANCE_CONFIGURATION_KEY],
      default: ATTENDANCE_CONFIGURATION_KEY,
      required: true,
      unique: true,
      immutable: true,
    },
    minimumAttendancePercentage: {
      type: Number,
      min: 1,
      max: 100,
      default: 75,
      required: true,
    },
  },
  { timestamps: true }
)

export const AttendanceConfigurationModel = model(
  'AttendanceConfiguration',
  attendanceConfigurationSchema
)
