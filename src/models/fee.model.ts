import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export const feeStatuses = ['paid', 'partially_paid', 'unpaid', 'overdue'] as const
export type FeeStatus = (typeof feeStatuses)[number]

export interface Fee {
  student: Types.ObjectId
  semester: Types.ObjectId
  totalAmount: number
  paidAmount: number
  dueDate: Date
  paymentDate?: Date
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export type FeeDocument = HydratedDocument<Fee>

const feeSchema = new Schema<Fee>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    paymentDate: { type: Date },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
)

feeSchema.index({ student: 1, semester: 1 }, { unique: true })

export const FeeModel = model('Fee', feeSchema)
