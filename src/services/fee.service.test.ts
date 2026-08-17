import { describe, expect, it } from 'vitest'
import { calculateFeeStatus, calculateRemainingAmount } from './fee.service.js'

describe('calculateRemainingAmount', () => {
  it('rounds currency calculations to two decimal places', () => {
    expect(calculateRemainingAmount(100.1, 40.2)).toBe(59.9)
  })
})

describe('calculateFeeStatus', () => {
  const today = new Date('2026-08-17T12:00:00.000Z')

  it('returns paid when no balance remains', () => {
    expect(calculateFeeStatus(100_000, 100_000, '2026-08-01', today)).toBe('paid')
  })

  it('returns overdue when an unpaid balance remains after the due date', () => {
    expect(calculateFeeStatus(100_000, 40_000, '2026-08-16', today)).toBe('overdue')
  })

  it('returns partially paid before the due date when some payment exists', () => {
    expect(calculateFeeStatus(100_000, 40_000, '2026-08-18', today)).toBe('partially_paid')
  })

  it('returns unpaid before the due date when no payment exists', () => {
    expect(calculateFeeStatus(100_000, 0, '2026-08-18', today)).toBe('unpaid')
  })
})
