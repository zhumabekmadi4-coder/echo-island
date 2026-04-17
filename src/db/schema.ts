import Dexie, { type EntityTable } from 'dexie'

export interface WordProgress {
  wordId: string
  firstSeen: Date
  lastReviewed: Date
  successCount: number
  nextReview: Date
  learned: boolean
}

export interface TelemetryEntry {
  id?: number
  wordId: string
  timestamp: Date
  success: boolean
  recognizedText: string
}

export const db = new Dexie('EchoIslandDB') as Dexie & {
  wordProgress: EntityTable<WordProgress, 'wordId'>
  telemetry: EntityTable<TelemetryEntry, 'id'>
}

db.version(1).stores({
  wordProgress: 'wordId, nextReview, learned',
  telemetry: '++id, wordId, timestamp',
})
