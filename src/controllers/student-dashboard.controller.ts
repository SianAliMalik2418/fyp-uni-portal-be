import { getStudentDashboardSummary } from '../services/student-dashboard.service.js'
import { asyncHandler } from '../utils/async-handler.js'

export const getStudentDashboardController = asyncHandler(async (req, res) => {
  const dashboard = await getStudentDashboardSummary(req.auth!.user)

  res.status(200).json(dashboard)
})
