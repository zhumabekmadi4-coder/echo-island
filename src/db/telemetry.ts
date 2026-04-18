import { db } from './schema'
import { recordReview } from '@/engine/SpacedRepetition'

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
  await recordReview(wordId, success)
}
