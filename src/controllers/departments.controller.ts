import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '../services/department.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  createDepartmentSchema,
  departmentParamsSchema,
  updateDepartmentSchema,
} from '../validators/department.validator.js'

export const listDepartmentsController = asyncHandler(async (_req, res) => {
  const departments = await listDepartments()

  res.status(200).json({ departments })
})

export const createDepartmentController = asyncHandler(async (req, res) => {
  const payload = createDepartmentSchema.parse(req.body)
  const department = await createDepartment(payload)

  res.status(201).json({
    message: 'Department created',
    department,
  })
})

export const updateDepartmentController = asyncHandler(async (req, res) => {
  const { departmentId } = departmentParamsSchema.parse(req.params)
  const payload = updateDepartmentSchema.parse(req.body)
  const department = await updateDepartment(departmentId, payload)

  res.status(200).json({
    message: 'Department updated',
    department,
  })
})

export const deleteDepartmentController = asyncHandler(async (req, res) => {
  const { departmentId } = departmentParamsSchema.parse(req.params)
  await deleteDepartment(departmentId)

  res.status(200).json({ message: 'Department deleted' })
})
