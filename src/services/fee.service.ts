import { isValidObjectId } from 'mongoose'
import { FeeModel, type FeeDocument, type FeeStatus } from '../models/fee.model.js'
import { SemesterModel, type SemesterDocument } from '../models/semester.model.js'
import { UserModel, type UserDocument } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'
import type { UpsertFeePayload } from '../validators/fee.validator.js'

export type SerializedFee = {
  id: string
  student: {
    id: string
    fullName: string
    registrationNumber?: string
  }
  semester: {
    id: string
    name: string
    academicYear: string
  }
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  dueDate: string
  paymentDate?: string
  notes?: string
  status: FeeStatus
  updatedAt?: Date
}

function dateKey(value: Date | string) {
  return (value instanceof Date ? value.toISOString() : value).slice(0, 10)
}

export function calculateFeeStatus(
  totalAmount: number,
  paidAmount: number,
  dueDate: Date | string,
  now = new Date()
): FeeStatus {
  const remainingAmount = calculateRemainingAmount(totalAmount, paidAmount)

  if (remainingAmount === 0) {
    return 'paid'
  }

  if (dateKey(dueDate) < dateKey(now)) {
    return 'overdue'
  }

  return paidAmount > 0 ? 'partially_paid' : 'unpaid'
}

export function calculateRemainingAmount(totalAmount: number, paidAmount: number) {
  return Math.max(0, Math.round((totalAmount - paidAmount) * 100) / 100)
}

function serializeFee(
  fee: FeeDocument,
  student: UserDocument,
  semester: SemesterDocument
): SerializedFee {
  return {
    id: fee.id,
    student: {
      id: student.id,
      fullName: student.fullName,
      registrationNumber: student.registrationNumber,
    },
    semester: {
      id: semester.id,
      name: semester.name,
      academicYear: semester.academicYear,
    },
    totalAmount: fee.totalAmount,
    paidAmount: fee.paidAmount,
    remainingAmount: calculateRemainingAmount(fee.totalAmount, fee.paidAmount),
    dueDate: dateKey(fee.dueDate),
    paymentDate: fee.paymentDate ? dateKey(fee.paymentDate) : undefined,
    notes: fee.notes,
    status: calculateFeeStatus(fee.totalAmount, fee.paidAmount, fee.dueDate),
    updatedAt: fee.updatedAt,
  }
}

function ensureValidStudentId(studentId: string) {
  if (!isValidObjectId(studentId)) {
    throw new ApiError(400, 'Invalid student ID')
  }
}

async function getStudentWithCurrentSemester(studentId: string) {
  ensureValidStudentId(studentId)
  const student = await UserModel.findById(studentId)
    .select('fullName registrationNumber role semester')
    .exec()

  if (!student || student.role !== 'student') {
    throw new ApiError(404, 'Student not found')
  }

  if (!student.semester) {
    throw new ApiError(400, 'Student does not have a current semester')
  }

  const semester = await SemesterModel.findById(student.semester).select('name academicYear').exec()

  if (!semester) {
    throw new ApiError(400, 'Student current semester was not found')
  }

  return { student, semester }
}

export async function getCurrentStudentFee(studentId: string) {
  const { student, semester } = await getStudentWithCurrentSemester(studentId)
  const fee = await FeeModel.findOne({ student: student._id, semester: semester._id }).exec()

  if (!fee) {
    return null
  }

  return serializeFee(fee, student, semester)
}

export async function upsertCurrentStudentFee(studentId: string, payload: UpsertFeePayload) {
  const { student, semester } = await getStudentWithCurrentSemester(studentId)
  const paymentDate = payload.paymentDate
    ? new Date(`${payload.paymentDate}T00:00:00.000Z`)
    : undefined
  const notes = payload.notes?.trim() || undefined
  const fee = await FeeModel.findOneAndUpdate(
    { student: student._id, semester: semester._id },
    {
      $set: {
        totalAmount: payload.totalAmount,
        paidAmount: payload.paidAmount,
        dueDate: new Date(`${payload.dueDate}T00:00:00.000Z`),
        ...(paymentDate ? { paymentDate } : {}),
        ...(notes ? { notes } : {}),
      },
      $unset: {
        ...(paymentDate ? {} : { paymentDate: 1 }),
        ...(notes ? {} : { notes: 1 }),
      },
      $setOnInsert: { student: student._id, semester: semester._id },
    },
    { returnDocument: 'after', upsert: true, runValidators: true }
  ).exec()

  return serializeFee(fee, student, semester)
}
