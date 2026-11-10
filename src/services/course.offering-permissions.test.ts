import { Types } from 'mongoose'
import { describe, expect, it, vi } from 'vitest'
import { assertCanManageOfferingTeacher } from './course.service.js'

const department = new Types.ObjectId()

function offeringIn(courseDepartment: unknown) {
  return {
    populate: vi.fn().mockResolvedValue(undefined),
    course: { creditHours: 3, department: courseDepartment },
  } as never
}

describe('assertCanManageOfferingTeacher', () => {
  it('lets an admin manage any offering', async () => {
    await expect(
      assertCanManageOfferingTeacher(offeringIn(new Types.ObjectId()), { role: 'admin' } as never)
    ).resolves.toBeUndefined()
  })

  it('lets an HOD manage a course in their own department', async () => {
    await expect(
      assertCanManageOfferingTeacher(offeringIn(department), { role: 'hod', department } as never)
    ).resolves.toBeUndefined()
  })

  it('still works when the department was populated into a full document', async () => {
    // toString() on a populated document prints the object, so comparing it to an id always
    // failed and every HOD was refused, even for their own department.
    const populated = { _id: department, name: 'Artificial Intelligence', toString: () => '[doc]' }

    await expect(
      assertCanManageOfferingTeacher(offeringIn(populated), { role: 'hod', department } as never)
    ).resolves.toBeUndefined()
  })

  it('refuses an HOD for another department', async () => {
    await expect(
      assertCanManageOfferingTeacher(offeringIn(new Types.ObjectId()), {
        role: 'hod',
        department,
      } as never)
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'HOD can only assign teachers for their department courses',
    })
  })

  it('refuses an HOD who has no department, and other roles', async () => {
    await expect(
      assertCanManageOfferingTeacher(offeringIn(department), { role: 'hod' } as never)
    ).rejects.toMatchObject({ statusCode: 403 })
    await expect(
      assertCanManageOfferingTeacher(offeringIn(department), {
        role: 'teacher',
        department,
      } as never)
    ).rejects.toMatchObject({ statusCode: 403 })
  })
})
