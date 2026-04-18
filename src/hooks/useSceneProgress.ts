import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'

export interface SceneProgressSummary {
  completed: Set<string>
  countByIsland: Record<string, number>
  totalCompleted: number
}

export function useSceneProgress(): SceneProgressSummary {
  const data = useLiveQuery(
    async () => {
      const all = await db.sceneProgress.toArray()
      return all.map((s) => s.sceneId)
    },
    [],
    [] as string[]
  )
  const completed = new Set(data ?? [])
  return {
    completed,
    countByIsland: {},
    totalCompleted: completed.size,
  }
}
