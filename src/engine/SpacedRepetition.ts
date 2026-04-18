import { db, type WordProgress } from '@/db/schema'

const INTERVALS_DAYS = [1, 3, 7, 21] as const
const RETRY_DELAY_MINUTES = 10
const LEARNED_THRESHOLD = 3

export function scheduleNext(
  progress: WordProgress,
  success: boolean,
  now: Date = new Date()
): WordProgress {
  if (!success) {
    const nextReview = new Date(now.getTime() + RETRY_DELAY_MINUTES * 60 * 1000)
    return {
      ...progress,
      lastReviewed: now,
      nextReview,
    }
  }

  const newCount = progress.successCount + 1
  const intervalDays =
    INTERVALS_DAYS[Math.min(progress.successCount, INTERVALS_DAYS.length - 1)]
  const nextReview = new Date(now)
  nextReview.setDate(nextReview.getDate() + intervalDays)

  return {
    ...progress,
    lastReviewed: now,
    successCount: newCount,
    nextReview,
    learned: newCount >= LEARNED_THRESHOLD,
  }
}

export async function ensureWordProgress(wordId: string): Promise<WordProgress> {
  const existing = await db.wordProgress.get(wordId)
  if (existing) return existing

  const now = new Date()
  const fresh: WordProgress = {
    wordId,
    firstSeen: now,
    lastReviewed: now,
    successCount: 0,
    nextReview: now,
    learned: false,
  }
  await db.wordProgress.add(fresh)
  return fresh
}

export async function recordReview(wordId: string, success: boolean): Promise<void> {
  const progress = await ensureWordProgress(wordId)
  const next = scheduleNext(progress, success)
  await db.wordProgress.put(next)
}

export async function getWordsForReview(): Promise<string[]> {
  const now = new Date()
  const due = await db.wordProgress.where('nextReview').belowOrEqual(now).toArray()
  return due.map((w) => w.wordId)
}

export async function isWordLearned(wordId: string): Promise<boolean> {
  const progress = await db.wordProgress.get(wordId)
  return progress?.learned ?? false
}
