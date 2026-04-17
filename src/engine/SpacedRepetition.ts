// Spaced Repetition engine — stub for Stage 3
// Will implement full SM-2 logic with scene-based review

import { db } from '@/db/schema'

export async function getWordsForReview(): Promise<string[]> {
  const now = new Date()
  const due = await db.wordProgress
    .where('nextReview')
    .belowOrEqual(now)
    .toArray()

  return due.map((w) => w.wordId)
}

export async function isWordLearned(wordId: string): Promise<boolean> {
  const progress = await db.wordProgress.get(wordId)
  return progress?.learned ?? false
}
