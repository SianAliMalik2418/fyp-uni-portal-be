import { afterEach, describe, expect, it, vi } from 'vitest'
import { CourseModel } from '../models/course.model.js'
import { DepartmentModel } from '../models/department.model.js'
import { ProgramModel } from '../models/program.model.js'
import { UserModel } from '../models/user.model.js'
import { ApiError } from './api-error.js'
import { assertNoDependents } from './referential-integrity.js'

function counting(model: { countDocuments: unknown }, count: number) {
  return vi
    .spyOn(model as { countDocuments: () => unknown }, 'countDocuments')
    .mockReturnValue({ exec: () => Promise.resolve(count) } as never)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('assertNoDependents', () => {
  it('allows deleting a record nothing points at', async () => {
    counting(ProgramModel, 0)
    counting(CourseModel, 0)
    counting(UserModel, 0)

    await expect(
      assertNoDependents('Department', 'department-1', 'department')
    ).resolves.toBeUndefined()
  })

  it('blocks the delete with a 409 that names what still uses the record', async () => {
    const programs = counting(ProgramModel, 1)
    counting(CourseModel, 0)
    counting(UserModel, 5)

    const failure = await assertNoDependents('Department', 'department-1', 'department').catch(
      (error: unknown) => error
    )

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({
      statusCode: 409,
      message:
        "This department can't be deleted because it is still used by 1 program, 5 users. Reassign or remove them first.",
    })
    expect(programs).toHaveBeenCalledWith({ department: 'department-1' })
  })

  it('only looks at models that reference the target', async () => {
    const departments = counting(DepartmentModel, 9)
    counting(ProgramModel, 0)
    counting(CourseModel, 0)
    counting(UserModel, 0)

    await assertNoDependents('Department', 'department-1', 'department')

    expect(departments).not.toHaveBeenCalled()
  })
})
