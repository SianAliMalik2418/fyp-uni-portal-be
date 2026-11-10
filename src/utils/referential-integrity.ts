import mongoose from 'mongoose'
import { ApiError } from './api-error.js'

type Reference = { model: string; path: string; collection: mongoose.Model<unknown> }

const labels: Record<string, [string, string]> = {
  Batch: ['batch', 'batches'],
  Course: ['course', 'courses'],
  CourseOffering: ['course offering', 'course offerings'],
  Department: ['department', 'departments'],
  Enrollment: ['enrollment', 'enrollments'],
  Exam: ['exam', 'exams'],
  Fee: ['fee record', 'fee records'],
  Program: ['program', 'programs'],
  Section: ['section', 'sections'],
  Semester: ['semester', 'semesters'],
  Timetable: ['timetable', 'timetables'],
  User: ['user', 'users'],
}

function labelFor(model: string, count: number) {
  const [singular, plural] = labels[model] ?? [
    model.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(),
    `${model.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()} records`,
  ]
  return `${count} ${count === 1 ? singular : plural}`
}

function referenceOf(type: unknown) {
  const schemaType = type as {
    options?: { ref?: unknown; type?: unknown }
    caster?: { options?: { ref?: unknown } }
  }
  const arrayItem = Array.isArray(schemaType.options?.type)
    ? (schemaType.options.type[0] as { ref?: unknown } | undefined)
    : undefined
  return schemaType.options?.ref ?? arrayItem?.ref ?? schemaType.caster?.options?.ref
}

function findReferences(target: string): Reference[] {
  const references: Reference[] = []

  for (const [model, mongooseModel] of Object.entries(mongoose.models)) {
    mongooseModel.schema.eachPath((path, type) => {
      if (referenceOf(type) === target) {
        references.push({ model, path, collection: mongooseModel as mongoose.Model<unknown> })
      }
    })
  }

  return references
}

/**
 * Blocks deleting a record that other records still point at, so lists that
 * populate the parent never meet a dangling reference.
 */
export async function assertNoDependents(target: string, id: string, label: string) {
  const counts = await Promise.all(
    findReferences(target).map(async ({ model, path, collection }) => ({
      model,
      count: await collection.countDocuments({ [path]: id }).exec(),
    }))
  )

  const largestByModel = new Map<string, number>()
  for (const { model, count } of counts) {
    if (count > 0) largestByModel.set(model, Math.max(largestByModel.get(model) ?? 0, count))
  }

  if (!largestByModel.size) return

  const usedBy = [...largestByModel].map(([model, count]) => labelFor(model, count)).join(', ')
  throw new ApiError(
    409,
    `This ${label} can't be deleted because it is still used by ${usedBy}. Reassign or remove them first.`
  )
}
