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

export interface SceneProgress {
  sceneId: string
  completedAt: Date
}

export interface AppStateEntry {
  key: string
  value: unknown
  updatedAt: Date
}

export const db = new Dexie('EchoIslandDB') as Dexie & {
  wordProgress: EntityTable<WordProgress, 'wordId'>
  telemetry: EntityTable<TelemetryEntry, 'id'>
  sceneProgress: EntityTable<SceneProgress, 'sceneId'>
  appState: EntityTable<AppStateEntry, 'key'>
}

db.version(1).stores({
  wordProgress: 'wordId, nextReview, learned',
  telemetry: '++id, wordId, timestamp',
})

db.version(2).stores({
  wordProgress: 'wordId, nextReview, learned',
  telemetry: '++id, wordId, timestamp',
  sceneProgress: 'sceneId, completedAt',
  appState: 'key',
})
