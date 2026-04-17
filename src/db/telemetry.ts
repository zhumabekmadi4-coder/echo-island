import { db } from './schema'

export async function logAttempt(
  wordId: string,
  success: boolean,
  recognizedText: string
) {
  await db.telemetry.add({
    wordId,
    timestamp: new Date(),
    success,
    recognizedText,
  })

  await updateProgress(wordId, success)
}

async function updateProgress(wordId: string, success: boolean) {
  const existing = await db.wordProgress.get(wordId)
  const now = new Date()

  if (!existing) {
    await db.wordProgress.add({
      wordId,
      firstSeen: now,
      lastReviewed: now,
      successCount: success ? 1 : 0,
      nextReview: getNextReview(now, success ? 1 : 0),
      learned: false,
    })
    return
  }

  const newCount = success ? existing.successCount + 1 : existing.successCount

  await db.wordProgress.update(wordId, {
    lastReviewed: now,
    successCount: newCount,
    nextReview: getNextReview(now, newCount),
    learned: newCount >= 3,
  })
}

// Simplified SM-2 intervals: 1d, 3d, 7d, 21d
function getNextReview(from: Date, successCount: number): Date {
  const intervals = [1, 3, 7, 21]
  const days = intervals[Math.min(successCount, intervals.length - 1)] ?? 21
  const next = new Date(from)
  next.setDate(next.getDate() + days)
  return next
}
