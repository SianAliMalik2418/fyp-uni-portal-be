import { Types, isValidObjectId } from 'mongoose'
import {
  CourseOfferingModel,
  type CourseOfferingDocument,
} from '../models/course-offering.model.js'
import { type CourseDocument } from '../models/course.model.js'
import { type ProgramDocument } from '../models/program.model.js'
import { type BatchDocument } from '../models/batch.model.js'
import { type SectionDocument, SectionModel } from '../models/section.model.js'
import { type SemesterDocument } from '../models/semester.model.js'
import {
  TimetableModel,
  type TimetableDay,
  type TimetableDocument,
  type TimetableEntry,
  type TimetableSlotType,
  type TimetableStatus,
} from '../models/timetable.model.js'
import { type UserDocument, UserModel } from '../models/user.model.js'
import { ApiError } from '../utils/api-error.js'
import { serializeSection, type SerializedSection } from './section.service.js'
import type { SaveTimetableDraftPayload } from '../validators/timetable.validator.js'

type SerializedTimetableTeacher = {
  id: string
  fullName: string
  email: string
  employeeId?: string
}

export type SerializedTimetableOffering = {
  id: string
  course: {
    id: string
    code: string
    title: string
    creditHours: number
  }
  teacher?: SerializedTimetableTeacher
  isActive: boolean
}

export type SerializedTimetableEntry = {
  id: string
  dayOfWeek: TimetableDay
  startTime: string
  endTime: string
  room: string
  slotType: TimetableSlotType
  notes?: string
  courseOffering: SerializedTimetableOffering
}

export type SerializedTimetable = {
  id: string
  section: SerializedSection
  status: TimetableStatus
  version: number
  notes?: string
  publishedAt: Date | null
  entries: SerializedTimetableEntry[]
  createdAt?: Date
  updatedAt?: Date
}

export type AdminTimetableWorkspace = {
  section: SerializedSection
  availableCourseOfferings: SerializedTimetableOffering[]
  draftTimetable: SerializedTimetable | null
  publishedTimetable: SerializedTimetable | null
}

type MutationActor = {
  userId: string
}

type PopulatedOffering = CourseOfferingDocument & {
  course: CourseDocument
  teacher?: UserDocument
}

type PopulatedSection = SectionDocument & {
  program: ProgramDocument
  batch: BatchDocument
  semester: SemesterDocument
}

type NormalizedEntry = TimetableEntry & {
  courseOfferingId: string
  teacherId?: string
  teacherName?: string
  normalizedRoom: string
}

type ConflictTimetableSection = {
  id: string
  name: string
}

type ConflictTimetable = {
  section: ConflictTimetableSection
  entries: Array<{
    dayOfWeek: TimetableDay
    startMinutes: number
    endMinutes: number
    room: string
    teacher?: Types.ObjectId | string
    courseOffering?: {
      teacher?: Types.ObjectId | string | { _id: Types.ObjectId | string }
    }
  }>
}

const dayOrder: Record<TimetableDay, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
}

function ensureValidObjectId(value: string, label: string) {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label} ID`)
  }
}

function optionalString(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined
}

function normalizeRoom(room: string) {
  return room.trim().toUpperCase()
}

function toMinutes(time: string) {
  const [hoursPart = '0', minutesPart = '0'] = time.split(':')
  const hours = Number(hoursPart)
  const minutes = Number(minutesPart)
  return hours * 60 + minutes
}

function labelDay(day: TimetableDay) {
  return day.charAt(0).toUpperCase() + day.slice(1)
}

function referenceId(
  reference: Types.ObjectId | string | { _id: Types.ObjectId | string } | undefined
) {
  if (!reference) {
    return undefined
  }

  if (typeof reference === 'object' && '_id' in reference) {
    return reference._id.toString()
  }

  return reference.toString()
}

function timesOverlap(
  left: Pick<NormalizedEntry, 'startMinutes' | 'endMinutes'>,
  right: Pick<NormalizedEntry, 'startMinutes' | 'endMinutes'>
) {
  return left.startMinutes < right.endMinutes && right.startMinutes < left.endMinutes
}

function isPopulatedProgram(value: Types.ObjectId | ProgramDocument): value is ProgramDocument {
  return typeof value === 'object' && 'code' in value && 'name' in value
}

function isPopulatedBatch(value: Types.ObjectId | BatchDocument): value is BatchDocument {
  return typeof value === 'object' && 'startingYear' in value
}

function isPopulatedSemester(value: Types.ObjectId | SemesterDocument): value is SemesterDocument {
  return typeof value === 'object' && 'academicYear' in value
}

function isPopulatedSection(value: Types.ObjectId | SectionDocument): value is SectionDocument {
  return typeof value === 'object' && 'batch' in value && 'program' in value && 'semester' in value
}

function isPopulatedCourse(value: Types.ObjectId | CourseDocument): value is CourseDocument {
  return typeof value === 'object' && 'code' in value && 'title' in value
}

function isPopulatedTeacher(
  value: Types.ObjectId | UserDocument | undefined
): value is UserDocument {
  return Boolean(value && typeof value === 'object' && 'fullName' in value && 'email' in value)
}

function isPopulatedOffering(
  value: Types.ObjectId | CourseOfferingDocument
): value is PopulatedOffering {
  return typeof value === 'object' && 'course' in value && 'isActive' in value
}

function serializeTimetableTeacher(teacher: UserDocument): SerializedTimetableTeacher {
  return {
    id: teacher.id,
    fullName: teacher.fullName,
    email: teacher.email,
    employeeId: teacher.employeeId,
  }
}

function serializeTimetableOffering(offering: PopulatedOffering): SerializedTimetableOffering {
  if (!isPopulatedCourse(offering.course)) {
    throw new ApiError(500, 'Course offering course relationship was not loaded')
  }

  return {
    id: offering.id,
    course: {
      id: offering.course.id,
      code: offering.course.code,
      title: offering.course.title,
      creditHours: offering.course.creditHours,
    },
    teacher: isPopulatedTeacher(offering.teacher)
      ? serializeTimetableTeacher(offering.teacher)
      : undefined,
    isActive: offering.isActive,
  }
}

async function populateSectionForTimetable(section: SectionDocument) {
  await section.populate(['program', 'batch', 'semester'])

  if (
    !isPopulatedSection(section) ||
    !isPopulatedProgram(section.program) ||
    !isPopulatedBatch(section.batch) ||
    !isPopulatedSemester(section.semester)
  ) {
    throw new ApiError(500, 'Section relationships were not loaded')
  }

  return section as PopulatedSection
}

async function resolveSection(sectionId: string) {
  ensureValidObjectId(sectionId, 'section')
  const section = await SectionModel.findById(sectionId).exec()

  if (!section) {
    throw new ApiError(404, 'Section not found')
  }

  return populateSectionForTimetable(section)
}

function getSectionReferenceIds(section: PopulatedSection) {
  return {
    programId: section.program._id,
    semesterId: section.semester._id,
  }
}

async function listTimetableOfferingsForSection(sectionId: string) {
  const offerings = await CourseOfferingModel.find({ section: sectionId, isActive: true })
    .sort({ createdAt: 1 })
    .populate('course')
    .populate('teacher')
    .exec()

  return offerings as unknown as PopulatedOffering[]
}

async function listTimetableOfferingsByIds(sectionId: string, offeringIds: string[]) {
  if (offeringIds.length === 0) {
    return new Map<string, PopulatedOffering>()
  }

  offeringIds.forEach((offeringId) => ensureValidObjectId(offeringId, 'course offering'))

  const offerings = await CourseOfferingModel.find({
    _id: { $in: offeringIds },
    section: sectionId,
    isActive: true,
  })
    .populate('course')
    .populate('teacher')
    .exec()

  const offeringMap = new Map(
    (offerings as unknown as PopulatedOffering[]).map((offering) => [offering.id, offering])
  )

  if (offeringMap.size !== offeringIds.length) {
    throw new ApiError(
      400,
      'Every timetable entry must reference an active course offering from the selected section'
    )
  }

  return offeringMap
}

function assertSectionEntriesDoNotOverlap(entries: NormalizedEntry[]) {
  const groupedEntries = new Map<TimetableDay, NormalizedEntry[]>()

  entries.forEach((entry) => {
    const group = groupedEntries.get(entry.dayOfWeek) ?? []
    group.push(entry)
    groupedEntries.set(entry.dayOfWeek, group)
  })

  groupedEntries.forEach((dayEntries, dayOfWeek) => {
    const sortedEntries = [...dayEntries].sort(
      (left, right) => left.startMinutes - right.startMinutes
    )

    for (let index = 1; index < sortedEntries.length; index += 1) {
      const previous = sortedEntries[index - 1]
      const current = sortedEntries[index]

      if (!previous || !current) {
        continue
      }

      if (timesOverlap(previous, current)) {
        throw new ApiError(
          409,
          `Section timetable has overlapping slots on ${labelDay(dayOfWeek)} between ${previous.startTime}-${previous.endTime} and ${current.startTime}-${current.endTime}`
        )
      }
    }
  })
}

function assertPublishableTeacherAssignments(entries: NormalizedEntry[]) {
  const missingTeacherEntry = entries.find((entry) => !entry.teacherId)

  if (missingTeacherEntry) {
    throw new ApiError(
      409,
      `Assign a teacher before publishing the ${missingTeacherEntry.courseOfferingId} timetable slot`
    )
  }
}

async function loadPublishedConflictsForSemester(sectionId: string, semesterId: string) {
  const timetables = await TimetableModel.find({
    section: { $ne: sectionId },
    semester: semesterId,
    status: 'published',
  })
    .select(
      'section entries.dayOfWeek entries.startMinutes entries.endMinutes entries.room entries.teacher entries.courseOffering'
    )
    .populate({ path: 'section', select: 'name' })
    .populate({ path: 'entries.courseOffering', select: 'teacher' })
    .lean()
    .exec()

  return timetables as unknown as ConflictTimetable[]
}

async function assertPublishedTimetableConflicts(
  sectionId: string,
  semesterId: string,
  entries: NormalizedEntry[]
) {
  const publishedTimetables = await loadPublishedConflictsForSemester(sectionId, semesterId)

  for (const entry of entries) {
    for (const publishedTimetable of publishedTimetables) {
      for (const publishedEntry of publishedTimetable.entries) {
        if (entry.dayOfWeek !== publishedEntry.dayOfWeek) {
          continue
        }

        if (!timesOverlap(entry, publishedEntry)) {
          continue
        }

        const publishedTeacherId =
          referenceId(publishedEntry.courseOffering?.teacher) ?? referenceId(publishedEntry.teacher)

        if (entry.teacherId && publishedTeacherId === entry.teacherId) {
          throw new ApiError(
            409,
            `${entry.teacherName ?? 'Assigned teacher'} is already scheduled for ${labelDay(entry.dayOfWeek)} ${entry.startTime}-${entry.endTime} in section ${publishedTimetable.section.name}`
          )
        }

        if (normalizeRoom(publishedEntry.room) === entry.normalizedRoom) {
          throw new ApiError(
            409,
            `Room ${entry.room} is already scheduled for ${labelDay(entry.dayOfWeek)} ${entry.startTime}-${entry.endTime} in section ${publishedTimetable.section.name}`
          )
        }
      }
    }
  }
}

function normalizeDraftEntries(
  entries: SaveTimetableDraftPayload['entries'],
  offeringsById: Map<string, PopulatedOffering>
): NormalizedEntry[] {
  return entries.map((entry) => {
    const offering = offeringsById.get(entry.courseOfferingId)

    if (!offering || !isPopulatedCourse(offering.course)) {
      throw new ApiError(
        400,
        'Every timetable entry must reference an active course offering from the selected section'
      )
    }

    return {
      courseOffering: offering._id,
      course: offering.course._id,
      teacher: isPopulatedTeacher(offering.teacher) ? offering.teacher._id : undefined,
      teacherId: isPopulatedTeacher(offering.teacher) ? offering.teacher.id : undefined,
      teacherName: isPopulatedTeacher(offering.teacher) ? offering.teacher.fullName : undefined,
      courseOfferingId: offering.id,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      startMinutes: toMinutes(entry.startTime),
      endMinutes: toMinutes(entry.endTime),
      room: entry.room.trim(),
      normalizedRoom: normalizeRoom(entry.room),
      slotType: entry.slotType,
      notes: optionalString(entry.notes),
    }
  })
}

function normalizeStoredEntries(
  entries: TimetableEntry[],
  offeringsById: Map<string, PopulatedOffering>
): NormalizedEntry[] {
  return entries.map((entry) => {
    const offeringId = entry.courseOffering.toString()
    const offering = offeringsById.get(offeringId)

    if (!offering || !isPopulatedCourse(offering.course)) {
      throw new ApiError(
        409,
        'Timetable contains course offerings that are no longer active for the selected section'
      )
    }

    return {
      courseOffering: offering._id,
      course: offering.course._id,
      teacher: isPopulatedTeacher(offering.teacher) ? offering.teacher._id : undefined,
      teacherId: isPopulatedTeacher(offering.teacher) ? offering.teacher.id : undefined,
      teacherName: isPopulatedTeacher(offering.teacher) ? offering.teacher.fullName : undefined,
      courseOfferingId: offering.id,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      startMinutes: entry.startMinutes,
      endMinutes: entry.endMinutes,
      room: entry.room.trim(),
      normalizedRoom: normalizeRoom(entry.room),
      slotType: entry.slotType,
      notes: optionalString(entry.notes),
    }
  })
}

async function populateTimetable(timetable: TimetableDocument) {
  await timetable.populate([
    { path: 'section', populate: ['program', 'batch', 'semester'] },
    {
      path: 'entries.courseOffering',
      populate: [{ path: 'course' }, { path: 'teacher' }],
    },
  ])

  return timetable
}

function serializeTimetable(
  timetable: TimetableDocument,
  options?: { courseOfferingIds?: Set<string> }
): SerializedTimetable {
  if (!isPopulatedSection(timetable.section)) {
    throw new ApiError(500, 'Timetable section relationship was not loaded')
  }

  const entries = timetable.entries
    .map((entry): SerializedTimetableEntry | null => {
      if (!isPopulatedOffering(entry.courseOffering)) {
        throw new ApiError(500, 'Timetable entry course offering was not loaded')
      }

      if (!entry._id) {
        throw new ApiError(500, 'Timetable entry ID was not loaded')
      }

      const offering = entry.courseOffering

      if (options?.courseOfferingIds && !options.courseOfferingIds.has(offering.id)) {
        return null
      }

      return {
        id: entry._id.toString(),
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room,
        slotType: entry.slotType,
        notes: entry.notes,
        courseOffering: serializeTimetableOffering(offering),
      }
    })
    .filter((entry): entry is SerializedTimetableEntry => entry !== null)
    .sort((left, right) => {
      const leftStart = toMinutes(left.startTime)
      const rightStart = toMinutes(right.startTime)

      if (dayOrder[left.dayOfWeek] !== dayOrder[right.dayOfWeek]) {
        return dayOrder[left.dayOfWeek] - dayOrder[right.dayOfWeek]
      }

      return leftStart - rightStart
    })

  return {
    id: timetable.id,
    section: serializeSection(timetable.section),
    status: timetable.status,
    version: timetable.version,
    notes: timetable.notes,
    publishedAt: timetable.publishedAt ?? null,
    entries,
    createdAt: timetable.createdAt,
    updatedAt: timetable.updatedAt,
  }
}

async function findTimetable(sectionId: string, status: TimetableStatus) {
  return TimetableModel.findOne({ section: sectionId, status }).exec()
}

export async function getAdminSectionTimetableWorkspace(
  sectionId: string
): Promise<AdminTimetableWorkspace> {
  const [section, offerings, draftTimetable, publishedTimetable] = await Promise.all([
    resolveSection(sectionId),
    listTimetableOfferingsForSection(sectionId),
    findTimetable(sectionId, 'draft'),
    findTimetable(sectionId, 'published'),
  ])

  return {
    section: serializeSection(section),
    availableCourseOfferings: offerings.map((offering) => serializeTimetableOffering(offering)),
    draftTimetable: draftTimetable
      ? serializeTimetable(await populateTimetable(draftTimetable))
      : null,
    publishedTimetable: publishedTimetable
      ? serializeTimetable(await populateTimetable(publishedTimetable))
      : null,
  }
}

export async function saveSectionTimetableDraft(
  sectionId: string,
  payload: SaveTimetableDraftPayload,
  actor: MutationActor
): Promise<SerializedTimetable> {
  ensureValidObjectId(actor.userId, 'user')
  const actorObjectId = new Types.ObjectId(actor.userId)
  const [section, existingDraft, existingPublished] = await Promise.all([
    resolveSection(sectionId),
    findTimetable(sectionId, 'draft'),
    findTimetable(sectionId, 'published'),
  ])
  const { programId, semesterId } = getSectionReferenceIds(section)
  const offeringIds = [...new Set(payload.entries.map((entry) => entry.courseOfferingId))]
  const offeringsById = await listTimetableOfferingsByIds(sectionId, offeringIds)
  const normalizedEntries = normalizeDraftEntries(payload.entries, offeringsById)

  assertSectionEntriesDoNotOverlap(normalizedEntries)

  const timetable =
    existingDraft ??
    new TimetableModel({
      section: section._id,
      program: programId,
      semester: semesterId,
      status: 'draft',
      version: (existingPublished?.version ?? 0) + 1,
      createdBy: actorObjectId,
      updatedBy: actorObjectId,
      entries: [],
    })

  timetable.program = programId
  timetable.semester = semesterId
  timetable.notes = optionalString(payload.notes)
  timetable.entries = normalizedEntries.map(
    ({
      normalizedRoom: _normalizedRoom,
      teacherId: _teacherId,
      teacherName: _teacherName,
      courseOfferingId: _courseOfferingId,
      ...entry
    }) => entry
  )
  timetable.updatedBy = actorObjectId

  await timetable.save()

  return serializeTimetable(await populateTimetable(timetable))
}

export async function publishSectionTimetableDraft(
  sectionId: string,
  actor: MutationActor
): Promise<SerializedTimetable> {
  ensureValidObjectId(actor.userId, 'user')
  const actorObjectId = new Types.ObjectId(actor.userId)
  const [section, draftTimetable, publishedTimetable] = await Promise.all([
    resolveSection(sectionId),
    findTimetable(sectionId, 'draft'),
    findTimetable(sectionId, 'published'),
  ])
  const { programId, semesterId } = getSectionReferenceIds(section)

  if (!draftTimetable) {
    throw new ApiError(404, 'Timetable draft not found')
  }

  if (!section.isActive) {
    throw new ApiError(409, 'Only active sections can publish a timetable')
  }

  if (draftTimetable.entries.length === 0) {
    throw new ApiError(400, 'Add at least one timetable entry before publishing')
  }

  const offeringIds = [
    ...new Set(draftTimetable.entries.map((entry) => entry.courseOffering.toString())),
  ]
  const offeringsById = await listTimetableOfferingsByIds(sectionId, offeringIds)
  const normalizedEntries = normalizeStoredEntries(draftTimetable.entries, offeringsById)

  assertSectionEntriesDoNotOverlap(normalizedEntries)
  assertPublishableTeacherAssignments(normalizedEntries)
  await assertPublishedTimetableConflicts(sectionId, semesterId.toString(), normalizedEntries)

  const publishedAt = new Date()
  const persistedEntries = normalizedEntries.map(
    ({
      normalizedRoom: _normalizedRoom,
      teacherId: _teacherId,
      teacherName: _teacherName,
      courseOfferingId: _courseOfferingId,
      ...entry
    }) => entry
  )

  let timetableToReturn: TimetableDocument

  if (publishedTimetable) {
    publishedTimetable.program = programId
    publishedTimetable.semester = semesterId
    publishedTimetable.version = draftTimetable.version
    publishedTimetable.notes = draftTimetable.notes
    publishedTimetable.entries = persistedEntries
    publishedTimetable.updatedBy = actorObjectId
    publishedTimetable.publishedBy = actorObjectId
    publishedTimetable.publishedAt = publishedAt
    await publishedTimetable.save()
    await draftTimetable.deleteOne()
    timetableToReturn = publishedTimetable
  } else {
    draftTimetable.status = 'published'
    draftTimetable.program = programId
    draftTimetable.semester = semesterId
    draftTimetable.entries = persistedEntries
    draftTimetable.updatedBy = actorObjectId
    draftTimetable.publishedBy = actorObjectId
    draftTimetable.publishedAt = publishedAt
    await draftTimetable.save()
    timetableToReturn = draftTimetable
  }

  return serializeTimetable(await populateTimetable(timetableToReturn))
}

export async function getStudentTimetable(
  authenticatedUser: UserDocument
): Promise<SerializedTimetable | null> {
  if (authenticatedUser.role !== 'student') {
    throw new ApiError(403, 'Student timetable access required')
  }

  const student = await UserModel.findById(authenticatedUser._id).select('role section').exec()

  if (!student || student.role !== 'student' || !student.section) {
    return null
  }

  const timetable = await TimetableModel.findOne({
    section: student.section,
    status: 'published',
  }).exec()

  if (!timetable) {
    return null
  }

  return serializeTimetable(await populateTimetable(timetable))
}

export async function getTeacherTimetables(
  authenticatedUser: UserDocument
): Promise<SerializedTimetable[]> {
  if (authenticatedUser.role !== 'teacher') {
    throw new ApiError(403, 'Teacher timetable access required')
  }

  const offerings = await CourseOfferingModel.find({
    teacher: authenticatedUser._id,
    isActive: true,
  })
    .select('_id')
    .lean()
    .exec()
  const offeringIds = offerings.map((offering) => offering._id)

  if (offeringIds.length === 0) {
    return []
  }

  const timetables = await TimetableModel.find({
    status: 'published',
    'entries.courseOffering': { $in: offeringIds },
  })
    .sort({ updatedAt: -1 })
    .limit(100)
    .exec()
  const courseOfferingIds = new Set(offerings.map((offering) => offering._id.toString()))

  const serializedTimetables = await Promise.all(
    timetables.map(async (timetable) => {
      return serializeTimetable(await populateTimetable(timetable), {
        courseOfferingIds,
      })
    })
  )

  return serializedTimetables.filter((timetable) => timetable.entries.length > 0)
}
