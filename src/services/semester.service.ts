import { isValidObjectId } from 'mongoose'
import { SemesterModel, type SemesterDocument } from '../models/semester.model.js'
import { ApiError } from '../utils/api-error.js'
import type {
  CreateSemesterPayload,
  UpdateSemesterPayload,
} from '../validators/semester.validator.js'

export interface SerializedSemester {
  id: string
  name: string
  academicYear: string
  startsAt?: Date
  endsAt?: Date
  isActive: boolean
  isClosed: boolean
  closedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

function ensureValidSemesterId(semesterId: string) {
  if (!isValidObjectId(semesterId)) {
    throw new ApiError(400, 'Invalid semester ID')
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function serializeSemester(semester: SemesterDocument): SerializedSemester {
  return {
    id: semester.id,
    name: semester.name,
    academicYear: semester.academicYear,
    startsAt: semester.startsAt,
    endsAt: semester.endsAt,
    isActive: semester.isActive,
    isClosed: semester.isClosed,
    closedAt: semester.closedAt,
    createdAt: semester.createdAt,
    updatedAt: semester.updatedAt,
  }
}

async function assertSemesterIsUnique(
  payload: Pick<CreateSemesterPayload, 'name' | 'academicYear'>,
  currentSemesterId?: string
) {
  const duplicate = await SemesterModel.findOne({
    ...(currentSemesterId ? { _id: { $ne: currentSemesterId } } : {}),
    name: new RegExp(`^${escapeRegExp(payload.name.trim())}$`, 'i'),
    academicYear: new RegExp(`^${escapeRegExp(payload.academicYear.trim())}$`, 'i'),
  })
    .select('_id')
    .exec()

  if (duplicate) {
    throw new ApiError(409, 'A semester with this name already exists for this academic year')
  }
}

async function deactivateOtherSemesters(activeSemesterId: string) {
  await SemesterModel.updateMany(
    { _id: { $ne: activeSemesterId }, isActive: true },
    { $set: { isActive: false } }
  ).exec()
}

async function findSemesterById(semesterId: string) {
  ensureValidSemesterId(semesterId)

  const semester = await SemesterModel.findById(semesterId).exec()

  if (!semester) {
    throw new ApiError(404, 'Semester not found')
  }

  return semester
}

export async function listSemesters() {
  const semesters = await SemesterModel.find().sort({ academicYear: -1, name: 1 }).exec()

  return semesters.map(serializeSemester)
}

export async function createSemester(payload: CreateSemesterPayload) {
  await assertSemesterIsUnique(payload)

  const shouldActivate = payload.isActive && !payload.isClosed
  const semester = await SemesterModel.create({
    name: payload.name.trim(),
    academicYear: payload.academicYear.trim(),
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    isActive: shouldActivate,
    isClosed: payload.isClosed,
    closedAt: payload.isClosed ? new Date() : undefined,
  })

  if (shouldActivate) {
    await deactivateOtherSemesters(semester.id)
  }

  return serializeSemester(semester)
}

export async function updateSemester(semesterId: string, payload: UpdateSemesterPayload) {
  const semester = await findSemesterById(semesterId)
  const nextName = payload.name?.trim() ?? semester.name
  const nextAcademicYear = payload.academicYear?.trim() ?? semester.academicYear
  const nextStartsAt = payload.startsAt === undefined ? semester.startsAt : payload.startsAt
  const nextEndsAt = payload.endsAt === undefined ? semester.endsAt : payload.endsAt
  const nextIsClosed = payload.isClosed ?? semester.isClosed
  const nextIsActive = nextIsClosed ? false : (payload.isActive ?? semester.isActive)

  if (nextStartsAt && nextEndsAt && nextEndsAt < nextStartsAt) {
    throw new ApiError(400, 'End date must be after start date')
  }

  if (payload.name || payload.academicYear) {
    await assertSemesterIsUnique({ name: nextName, academicYear: nextAcademicYear }, semesterId)
  }

  semester.name = nextName
  semester.academicYear = nextAcademicYear
  semester.startsAt = nextStartsAt
  semester.endsAt = nextEndsAt
  semester.isClosed = nextIsClosed
  semester.isActive = nextIsActive
  semester.closedAt = nextIsClosed ? (semester.closedAt ?? new Date()) : undefined

  await semester.save()

  if (semester.isActive) {
    await deactivateOtherSemesters(semester.id)
  }

  return serializeSemester(semester)
}

export async function activateSemester(semesterId: string) {
  const semester = await findSemesterById(semesterId)

  if (semester.isClosed) {
    throw new ApiError(400, 'Closed semesters cannot be activated')
  }

  semester.isActive = true
  await semester.save()
  await deactivateOtherSemesters(semester.id)

  return serializeSemester(semester)
}

export async function closeSemester(semesterId: string) {
  const semester = await findSemesterById(semesterId)

  semester.isActive = false
  semester.isClosed = true
  semester.closedAt = semester.closedAt ?? new Date()
  await semester.save()

  return serializeSemester(semester)
}

export async function deleteSemester(semesterId: string) {
  ensureValidSemesterId(semesterId)

  const semester = await SemesterModel.findByIdAndDelete(semesterId).exec()

  if (!semester) {
    throw new ApiError(404, 'Semester not found')
  }
}
