export type Power = 'dim' | 'ember' | 'burning' | 'radiant'

export const POWER_THRESHOLDS: ReadonlyArray<{ min: number; power: Power }> = [
  { min: 0, power: 'dim' },
  { min: 1, power: 'ember' },
  { min: 6, power: 'burning' },
  { min: 11, power: 'radiant' },
]

export function computePower(scenesCompleted: number): Power {
  let current: Power = 'dim'
  for (const { min, power } of POWER_THRESHOLDS) {
    if (scenesCompleted >= min) current = power
  }
  return current
}

export function isPowerLevelUp(prevCount: number, nextCount: number): boolean {
  return computePower(prevCount) !== computePower(nextCount)
}
