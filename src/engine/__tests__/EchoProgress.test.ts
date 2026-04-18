import { describe, it, expect } from 'vitest'
import { computePower, POWER_THRESHOLDS, isPowerLevelUp } from '@/engine/EchoProgress'

describe('computePower', () => {
  it('returns dim at 0 scenes', () => {
    expect(computePower(0)).toBe('dim')
  })

  it('returns ember for 1-5 scenes', () => {
    expect(computePower(1)).toBe('ember')
    expect(computePower(5)).toBe('ember')
  })

  it('returns burning for 6-10 scenes', () => {
    expect(computePower(6)).toBe('burning')
    expect(computePower(10)).toBe('burning')
  })

  it('returns radiant for 11+ scenes', () => {
    expect(computePower(11)).toBe('radiant')
    expect(computePower(15)).toBe('radiant')
    expect(computePower(100)).toBe('radiant')
  })
})

describe('isPowerLevelUp', () => {
  it('detects dim → ember at 0→1', () => {
    expect(isPowerLevelUp(0, 1)).toBe(true)
  })

  it('detects ember → burning at 5→6', () => {
    expect(isPowerLevelUp(5, 6)).toBe(true)
  })

  it('detects burning → radiant at 10→11', () => {
    expect(isPowerLevelUp(10, 11)).toBe(true)
  })

  it('returns false within same tier', () => {
    expect(isPowerLevelUp(2, 3)).toBe(false)
    expect(isPowerLevelUp(7, 8)).toBe(false)
    expect(isPowerLevelUp(12, 13)).toBe(false)
  })

  it('returns false when count does not advance', () => {
    expect(isPowerLevelUp(5, 5)).toBe(false)
  })
})

describe('POWER_THRESHOLDS', () => {
  it('exposes ordered threshold list', () => {
    expect(POWER_THRESHOLDS).toEqual([
      { min: 0, power: 'dim' },
      { min: 1, power: 'ember' },
      { min: 6, power: 'burning' },
      { min: 11, power: 'radiant' },
    ])
  })
})
