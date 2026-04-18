import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { beforeEach } from 'vitest'
import { db } from '@/db/schema'

// Fresh IndexedDB between tests
beforeEach(async () => {
  db.close()
  const dbs = await indexedDB.databases()
  for (const { name } of dbs) {
    if (name) indexedDB.deleteDatabase(name)
  }
  await db.open()
})
