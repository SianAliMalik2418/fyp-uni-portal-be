import { isValidObjectId, type Types } from 'mongoose'
import { BatchModel, type BatchDocument } from '../models/batch.model.js'
import { ProgramModel, type ProgramDocument } from '../models/program.model.js'
import { SectionModel, type SectionDocument } from '../models/section.model.js'
import { SemesterModel, type SemesterDocument } from '../models/semester.model.js'
import { ApiError } from '../utils/api-error.js'
import type { CreateSectionPayload, UpdateSectionPayload } from '../validators/section.validator.js'

export interface SerializedSection {
  id: string
  name: string
  program: { id: string; name: string; code: string; isActive: boolean }
  batch: {
    id: string
    name: string
    startingYear: number
    expectedGraduationYear: number
    isActive: boolean
  }
  semester: { id: string; name: string; academicYear: string; isActive: boolean; isClosed: boolean }
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

function ensureValidObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} ID`)
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isPopulatedProgram(value: Types.ObjectId | ProgramDocument): value is ProgramDocument {
  return typeof value === 'object' && 'name' in value && 'code' in value
}

function isPopulatedBatch(value: Types.ObjectId | BatchDocument): value is BatchDocument {
  return typeof value === 'object' && 'startingYear' in value
}

function isPopulatedSemester(value: Types.ObjectId | SemesterDocument): value is SemesterDocument {
  return typeof value === 'object' && 'academicYear' in value
}

export function serializeSection(section: SectionDocument): SerializedSection {
  if (
    !isPopulatedProgram(section.program) ||
    !isPopulatedBatch(section.batch) ||
    !isPopulatedSemester(section.semester)
  ) {
    throw new ApiError(500, 'Section relationships were not loaded')
  }

  return {
    id: section.id,
    name: section.name,
    program: {
      id: section.program.id,
      name: section.program.name,
      code: section.program.code,
      isActive: section.program.isActive,
    },
    batch: {
      id: section.batch.id,
      name: section.batch.name,
      startingYear: section.batch.startingYear,
      expectedGraduationYear: section.batch.expectedGraduationYear,
      isActive: section.batch.isActive,
    },
    semester: {
      id: section.semester.id,
      name: section.semester.name,
      academicYear: section.semester.academicYear,
      isActive: section.semester.isActive,
      isClosed: section.semester.isClosed,
    },
    isActive: section.isActive,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
  }
}

async function resolveProgram(programId: string) {
  ensureValidObjectId(programId, 'program')
  const program = await ProgramModel.findById(programId).exec()

  if (!program) {
    throw new ApiError(400, 'Program not found')
  }

  return program
}

async function resolveBatch(batchId: string, programId: string) {
  ensureValidObjectId(batchId, 'batch')
  const batch = await BatchModel.findById(batchId).exec()

  if (!batch) {
    throw new ApiError(400, 'Batch not found')
  }

  if (batch.program.toString() !== programId) {
    throw new ApiError(400, 'Batch does not belong to the selected program')
  }

  return batch
}

async function resolveSemester(semesterId: string) {
  ensureValidObjectId(semesterId, 'semester')
  const semester = await SemesterModel.findById(semesterId).exec()

  if (!semester) {
    throw new ApiError(400, 'Semester not found')
  }

  return semester
}

async function assertSectionIsUnique(
  payload: Pick<CreateSectionPayload, 'name' | 'programId' | 'batchId' | 'semesterId'>,
  currentSectionId?: string
) {
  const duplicate = await SectionModel.findOne({
    ...(currentSectionId ? { _id: { $ne: currentSectionId } } : {}),
    name: new RegExp(`^${escapeRegExp(payload.name.trim())}$`, 'i'),
    program: payload.programId,
    batch: payload.batchId,
    semester: payload.semesterId,
  })
    .select('_id')
    .exec()

  if (duplicate) {
    throw new ApiError(
      409,
      'A section with this name already exists for this program, batch, and semester'
    )
  }
}

async function findSectionById(sectionId: string) {
  ensureValidObjectId(sectionId, 'section')
  const section = await SectionModel.findById(sectionId).exec()

  if (!section) {
    throw new ApiError(404, 'Section not found')
  }

  return section
}

async function populateSection(section: SectionDocument) {
  await section.populate(['program', 'batch', 'semester'])
  return section
}

export async function listSections() {
  const sections = await SectionModel.find()
    .sort({ name: 1 })
    .populate<{ program: ProgramDocument }>('program')
    .populate<{ batch: BatchDocument }>('batch')
    .populate<{ semester: SemesterDocument }>('semester')
    .exec()

  return sections.map((section) => serializeSection(section as unknown as SectionDocument))
}

export async function createSection(payload: CreateSectionPayload) {
  const program = await resolveProgram(payload.programId)
  const batch = await resolveBatch(payload.batchId, program.id)
  const semester = await resolveSemester(payload.semesterId)
  await assertSectionIsUnique({
    ...payload,
    programId: program.id,
    batchId: batch.id,
    semesterId: semester.id,
  })

  const section = await SectionModel.create({
    name: payload.name.trim().toUpperCase(),
    program: program._id,
    batch: batch._id,
    semester: semester._id,
    isActive: payload.isActive,
  })

  return serializeSection(await populateSection(section))
}

export async function updateSection(sectionId: string, payload: UpdateSectionPayload) {
  const section = await findSectionById(sectionId)
  const program = payload.programId ? await resolveProgram(payload.programId) : null
  const nextProgramId = program?.id ?? section.program.toString()
  const batch = payload.batchId ? await resolveBatch(payload.batchId, nextProgramId) : null
  const semester = payload.semesterId ? await resolveSemester(payload.semesterId) : null
  const nextBatchId = batch?.id ?? section.batch.toString()
  const nextSemesterId = semester?.id ?? section.semester.toString()
  const nextName = payload.name?.trim().toUpperCase() ?? section.name

  if (payload.name || payload.programId || payload.batchId || payload.semesterId) {
    await assertSectionIsUnique(
      {
        name: nextName,
        programId: nextProgramId,
        batchId: nextBatchId,
        semesterId: nextSemesterId,
      },
      sectionId
    )
  }

  section.name = nextName

  if (program) {
    section.program = program._id
  }

  if (batch) {
    section.batch = batch._id
  }

  if (semester) {
    section.semester = semester._id
  }

  if (payload.isActive !== undefined) {
    section.isActive = payload.isActive
  }

  await section.save()

  return serializeSection(await populateSection(section))
}

export async function deleteSection(sectionId: string) {
  ensureValidObjectId(sectionId, 'section')

  const section = await SectionModel.findByIdAndDelete(sectionId).exec()

  if (!section) {
    throw new ApiError(404, 'Section not found')
  }
}
