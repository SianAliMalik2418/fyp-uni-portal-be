import { getRoleDashboard } from '../services/dashboard.service.js'
import { asyncHandler } from '../utils/async-handler.js'

export const getRoleDashboardController = asyncHandler(async (req, res) => {
  const dashboard = await getRoleDashboard(req.auth!.user)
  res.status(200).json(dashboard)
})
