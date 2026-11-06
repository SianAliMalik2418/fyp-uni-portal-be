import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '../services/department.service.js'
import { recordAuditLog } from '../services/audit-log.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  createDepartmentSchema,
  departmentListQuerySchema,
  departmentParamsSchema,
  updateDepartmentSchema,
} from '../validators/department.validator.js'

export const listDepartmentsController = asyncHandler(async (req, res) => {
  const query = departmentListQuerySchema.parse(req.query)
  const result = await listDepartments(query)

  res.status(200).json(result)
})

export const createDepartmentController = asyncHandler(async (req, res) => {
  const payload = createDepartmentSchema.parse(req.body)
  const department = await createDepartment(payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'created',
    module: 'departments',
    affectedRecord: { id: department.id, label: department.name },
  })

  res.status(201).json({
    message: 'Department created',
    department,
  })
})

export const updateDepartmentController = asyncHandler(async (req, res) => {
  const { departmentId } = departmentParamsSchema.parse(req.params)
  const payload = updateDepartmentSchema.parse(req.body)
  const department = await updateDepartment(departmentId, payload)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'updated',
    module: 'departments',
    affectedRecord: { id: department.id, label: department.name },
  })

  res.status(200).json({
    message: 'Department updated',
    department,
  })
})

export const deleteDepartmentController = asyncHandler(async (req, res) => {
  const { departmentId } = departmentParamsSchema.parse(req.params)
  await deleteDepartment(departmentId)
  await recordAuditLog({
    actor: req.auth!.user,
    action: 'deleted',
    module: 'departments',
    affectedRecord: { id: departmentId },
  })

  res.status(200).json({ message: 'Department deleted' })
})
