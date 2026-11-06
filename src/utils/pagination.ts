import type { PaginationQuery } from '../validators/pagination.validator.js'

export type PaginatedResult<T, Key extends string> = {
  [K in Key]: T[]
} & {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function paginationSkip(query: PaginationQuery) {
  return (query.page - 1) * query.limit
}

export function paginationMeta(query: PaginationQuery, total: number) {
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  }
}
