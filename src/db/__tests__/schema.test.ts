import { describe, it, expect } from 'vitest'
import { db } from '@/db/schema'

describe('db v2 schema', () => {
  it('has sceneProgress table', async () => {
    await db.sceneProgress.put({ sceneId: 'scene_a', completedAt: new Date() })
    const all = await db.sceneProgress.toArray()
    expect(all).toHaveLength(1)
    expect(all[0].sceneId).toBe('scene_a')
  })

  it('deduplicates sceneProgress by sceneId', async () => {
    await db.sceneProgress.put({ sceneId: 'scene_a', completedAt: new Date() })
    await db.sceneProgress.put({ sceneId: 'scene_a', completedAt: new Date() })
    expect(await db.sceneProgress.count()).toBe(1)
  })

  it('has appState key-value table', async () => {
    await db.appState.put({ key: 'echo_intro_seen', value: true, updatedAt: new Date() })
    const entry = await db.appState.get('echo_intro_seen')
    expect(entry?.value).toBe(true)
  })
})
