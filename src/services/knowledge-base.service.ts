import {
  KnowledgeModel,
  type KnowledgeCategory,
  type KnowledgeDocument,
} from '../models/knowledge.model.js'
import { getAttendanceConfiguration } from './academic-performance.service.js'
import { getAssessmentStructure } from './assessment.service.js'
import { getGradingScale } from './grading-scale.service.js'

export type DeveloperKnowledgeInput = {
  knowledgeKey: string
  title: string
  category: KnowledgeCategory
  question?: string
  information: string
  keywords: string[]
  isActive: boolean
}

export type TrustedKnowledge = {
  id?: string
  key: string
  title: string
  category: KnowledgeCategory
  question?: string
  information: string
  keywords: string[]
  source: 'developer' | 'configuration'
  updatedAt?: Date
}

type KnowledgeSearchOptions = {
  categories?: KnowledgeCategory[]
  limit?: number
}

function optionalText(value: string | undefined) {
  const text = value?.trim()
  return text || undefined
}

function normalizeDeveloperRecord(record: DeveloperKnowledgeInput): DeveloperKnowledgeInput {
  return {
    knowledgeKey: record.knowledgeKey.trim().toLowerCase(),
    title: record.title.trim(),
    category: record.category,
    question: optionalText(record.question),
    information: record.information.trim(),
    keywords: [...new Set(record.keywords.map((keyword) => keyword.trim().toLowerCase()))].filter(
      Boolean
    ),
    isActive: record.isActive,
  }
}

export async function upsertDeveloperKnowledge(records: readonly DeveloperKnowledgeInput[]) {
  if (!records.length) return { matched: 0, modified: 0, upserted: 0 }

  const operations = records.map((input) => {
    const { knowledgeKey, question, ...record } = normalizeDeveloperRecord(input)
    return {
      updateOne: {
        filter: { knowledgeKey },
        update: {
          $set: { ...record, ...(question ? { question } : {}) },
          $setOnInsert: { knowledgeKey },
          ...(question ? {} : { $unset: { question: true as const } }),
        },
        upsert: true,
      },
    }
  })
  const result = await KnowledgeModel.bulkWrite(operations)

  return {
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedCount,
  }
}

function serializeDeveloperKnowledge(
  record: Pick<
    KnowledgeDocument,
    | '_id'
    | 'knowledgeKey'
    | 'title'
    | 'category'
    | 'question'
    | 'information'
    | 'keywords'
    | 'updatedAt'
  >
): TrustedKnowledge {
  return {
    id: record._id.toString(),
    key: record.knowledgeKey,
    title: record.title,
    category: record.category,
    question: record.question,
    information: record.information,
    keywords: record.keywords,
    source: 'developer',
    updatedAt: record.updatedAt,
  }
}

function gradingScaleInformation(ranges: Awaited<ReturnType<typeof getGradingScale>>['ranges']) {
  return ranges
    .map(
      (range) =>
        `${range.letterGrade}: ${range.minimumPercentage}-${range.maximumPercentage}% (${range.gradePoint} grade points)`
    )
    .join('; ')
}

async function configuredKnowledge(): Promise<TrustedKnowledge[]> {
  const [attendance, assessments, grading] = await Promise.all([
    getAttendanceConfiguration(),
    getAssessmentStructure(),
    getGradingScale(),
  ])
  const passingRanges = grading.ranges.filter((range) => range.gradePoint > 0)
  const passingThreshold = passingRanges.length
    ? Math.min(...passingRanges.map((range) => range.minimumPercentage))
    : null
  const assessmentInformation = assessments.categories.length
    ? assessments.categories
        .map((category) => `${category.label}: ${category.weightPercentage}%`)
        .join('; ')
    : 'No assessment categories are configured.'
  const entries: TrustedKnowledge[] = [
    {
      key: 'configured-attendance-requirement',
      title: 'Configured attendance requirement',
      category: 'attendance_rules',
      question: 'What is the minimum attendance requirement?',
      information: `The configured minimum attendance requirement is ${attendance.minimumAttendancePercentage}%.`,
      keywords: ['attendance', 'minimum', 'requirement', 'shortage'],
      source: 'configuration',
      updatedAt: attendance.updatedAt,
    },
    {
      key: 'configured-assessment-structure',
      title: 'Configured assessment structure',
      category: 'academic_procedures',
      question: 'How are assessment categories weighted?',
      information: assessmentInformation,
      keywords: ['assessment', 'weight', 'marks', 'midterm', 'final'],
      source: 'configuration',
      updatedAt: assessments.updatedAt,
    },
    {
      key: 'configured-grading-scale',
      title: 'Configured grading scale',
      category: 'grading_policy',
      question: 'What grading scale is configured?',
      information: gradingScaleInformation(grading.ranges),
      keywords: ['grade', 'grading', 'letter', 'point', 'percentage'],
      source: 'configuration',
      updatedAt: grading.updatedAt,
    },
  ]

  if (passingThreshold !== null) {
    entries.push({
      key: 'configured-passing-threshold',
      title: 'Configured passing threshold',
      category: 'passing_rules',
      question: 'What is the passing threshold?',
      information: `The configured passing threshold is ${passingThreshold}%.`,
      keywords: ['pass', 'passing', 'threshold', 'grade'],
      source: 'configuration',
      updatedAt: grading.updatedAt,
    })
  }

  return entries
}

function searchTokens(query: string) {
  return query
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1)
}

function matchesConfiguredKnowledge(entry: TrustedKnowledge, tokens: string[]) {
  const text = [entry.title, entry.question, entry.information, ...entry.keywords]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return tokens.some((token) => text.includes(token))
}

function searchLimit(value = 5) {
  return Math.min(10, Math.max(1, Math.trunc(value)))
}

export async function searchTrustedKnowledge(
  query: string,
  options: KnowledgeSearchOptions = {}
): Promise<TrustedKnowledge[]> {
  const tokens = searchTokens(query)
  if (!tokens.length) return []

  const limit = searchLimit(options.limit)
  const filter = {
    isActive: true,
    $text: { $search: query.trim() },
    ...(options.categories?.length ? { category: { $in: options.categories } } : {}),
  }
  const [developerRecords, configurationRecords] = await Promise.all([
    KnowledgeModel.find(filter)
      .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec(),
    configuredKnowledge(),
  ])
  const developerMatches = developerRecords.map((record) =>
    serializeDeveloperKnowledge(record as unknown as KnowledgeDocument)
  )
  const configuredMatches = configurationRecords.filter(
    (entry) =>
      (!options.categories?.length || options.categories.includes(entry.category)) &&
      matchesConfiguredKnowledge(entry, tokens)
  )

  return [...developerMatches, ...configuredMatches].slice(0, limit)
}
