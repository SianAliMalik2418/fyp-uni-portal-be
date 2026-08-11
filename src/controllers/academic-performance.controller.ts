import type { RequestHandler } from 'express'
import {
  getAcademicPerformanceContext,
  getAcademicPerformancePlaceholder,
  type AcademicPerformanceModule,
} from '../services/academic-performance.service.js'
import { asyncHandler } from '../utils/async-handler.js'

function createAcademicPerformanceController(module: AcademicPerformanceModule): RequestHandler {
  return (_req, res) => {
    res.json(getAcademicPerformancePlaceholder(module))
  }
}

export const getAttendancePlaceholder = createAcademicPerformanceController('attendance')
export const getAssessmentsPlaceholder = createAcademicPerformanceController('assessments')
export const getMarksPlaceholder = createAcademicPerformanceController('marks')
export const getResultsPlaceholder = createAcademicPerformanceController('results')

export const getAcademicPerformanceContextController = asyncHandler(async (req, res) => {
  const context = await getAcademicPerformanceContext(req.auth?.user.id)

  res.status(200).json(context)
})
