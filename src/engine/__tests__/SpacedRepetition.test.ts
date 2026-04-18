import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/schema'
import {
  ensureWordProgress,
  recordReview,
  scheduleNext,
  getWordsForReview,
  isWordLearned,
} from '@/engine/SpacedRepetition'

describe('scheduleNext (pure)', () => {
  const baseProgress = {
    wordId: 'fire',
    firstSeen: new Date('2026-01-01'),
    lastReviewed: new Date('2026-01-01'),
    successCount: 0,
    nextReview: new Date('2026-01-01'),
    learned: false,
  }

  it('delays retry by 10 minutes on failure', () => {
    const now = new Date('2026-04-18T12:00:00Z')
    const next = scheduleNext(baseProgress, false, now)
    expect(next.nextReview.getTime() - now.getTime()).toBe(10 * 60 * 1000)
    expect(next.successCount).toBe(0)
    expect(next.learned).toBe(false)
  })

  it('schedules +1 day after 1st success', () => {
    const now = new Date('2026-04-18T12:00:00Z')
    const next = scheduleNext(baseProgress, true, now)
    expect(next.successCount).toBe(1)
    const diffDays = (next.nextReview.getTime() - now.getTime()) / (24 * 3600 * 1000)
    expect(diffDays).toBe(1)
    expect(next.learned).toBe(false)
  })

  it('marks learned at 3 successes', () => {
    const now = new Date('2026-04-18T12:00:00Z')
    const p2 = { ...baseProgress, successCount: 2 }
    const next = scheduleNext(p2, true, now)
    expect(next.successCount).toBe(3)
    expect(next.learned).toBe(true)
  })

  it('caps interval at 21 days', () => {
    const now = new Date('2026-04-18T12:00:00Z')
    const p99 = { ...baseProgress, successCount: 99 }
    const next = scheduleNext(p99, true, now)
    const diffDays = (next.nextReview.getTime() - now.getTime()) / (24 * 3600 * 1000)
    expect(diffDays).toBe(21)
  })
})

describe('ensureWordProgress (Dexie)', () => {
  it('creates a new record if absent', async () => {
    const wp = await ensureWordProgress('fire')
    expect(wp.wordId).toBe('fire')
    expect(wp.successCount).toBe(0)
    expect(wp.learned).toBe(false)
    const row = await db.wordProgress.get('fire')
    expect(row).toBeDefined()
  })

  it('returns existing record unchanged', async () => {
    const now = new Date('2026-01-01T00:00:00Z')
    await db.wordProgress.put({
      wordId: 'fire',
      firstSeen: now,
      lastReviewed: now,
      successCount: 2,
      nextReview: new Date('2026-02-01'),
      learned: false,
    })
    const wp = await ensureWordProgress('fire')
    expect(wp.successCount).toBe(2)
  })
})

describe('recordReview (Dexie)', () => {
  it('creates and marks first-seen+success on a new word', async () => {
    await recordReview('fire', true)
    const wp = await db.wordProgress.get('fire')
    expect(wp?.successCount).toBe(1)
    expect(wp?.learned).toBe(false)
  })

  it('increments successCount on subsequent successes', async () => {
    await recordReview('fire', true)
    await recordReview('fire', true)
    await recordReview('fire', true)
    const wp = await db.wordProgress.get('fire')
    expect(wp?.successCount).toBe(3)
    expect(wp?.learned).toBe(true)
  })

  it('does not decrement on failure but does delay nextReview', async () => {
    await recordReview('fire', true)
    await recordReview('fire', true)
    const before = await db.wordProgress.get('fire')
    await recordReview('fire', false)
    const after = await db.wordProgress.get('fire')
    expect(after?.successCount).toBe(before?.successCount)
    expect(after!.nextReview.getTime()).toBeGreaterThan(Date.now() - 1000)
  })
})

describe('getWordsForReview', () => {
  it('returns words whose nextReview is in the past', async () => {
    const past = new Date(Date.now() - 10_000)
    const future = new Date(Date.now() + 10_000_000)
    await db.wordProgress.put({
      wordId: 'fire', firstSeen: past, lastReviewed: past,
      successCount: 1, nextReview: past, learned: false,
    })
    await db.wordProgress.put({
      wordId: 'water', firstSeen: past, lastReviewed: past,
      successCount: 1, nextReview: future, learned: false,
    })
    const due = await getWordsForReview()
    expect(due).toContain('fire')
    expect(due).not.toContain('water')
  })
})

describe('isWordLearned', () => {
  it('returns false if word has no record', async () => {
    expect(await isWordLearned('ghost')).toBe(false)
  })

  it('returns true when learned flag is set', async () => {
    await db.wordProgress.put({
      wordId: 'fire',
      firstSeen: new Date(),
      lastReviewed: new Date(),
      successCount: 3,
      nextReview: new Date(),
      learned: true,
    })
    expect(await isWordLearned('fire')).toBe(true)
  })
})
