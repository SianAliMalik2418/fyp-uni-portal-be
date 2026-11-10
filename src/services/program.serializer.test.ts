import { describe, expect, it } from 'vitest'
import { serializeProgram } from './program.service.js'

const base = {
  id: 'program-1',
  name: 'BS Computer Science',
  code: 'BSCS',
  totalSemesters: 8,
  duration: 4,
  durationUnit: 'years',
  isActive: true,
}

describe('serializeProgram', () => {
  it('serializes a program with its department', () => {
    const program = serializeProgram({
      ...base,
      department: { id: 'department-1', name: 'Computer Science', code: 'CS', isActive: true },
    } as never)

    expect(program.department).toEqual({
      id: 'department-1',
      name: 'Computer Science',
      code: 'CS',
      isActive: true,
    })
  })

  it('shows a placeholder instead of failing when the department was deleted', () => {
    const program = serializeProgram({ ...base, department: null } as never)

    expect(program.name).toBe('BS Computer Science')
    expect(program.department).toEqual({
      id: '',
      name: 'Deleted department',
      code: 'N/A',
      isActive: false,
    })
  })

  it('still reports a department that was never populated', () => {
    expect(() => serializeProgram({ ...base, department: 'department-1' } as never)).toThrow(
      'Program department was not loaded'
    )
  })
})
