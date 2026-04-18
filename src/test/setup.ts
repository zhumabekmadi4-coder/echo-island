import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { beforeEach } from 'vitest'

// Fresh IndexedDB between tests
beforeEach(async () => {
  const dbs = await indexedDB.databases()
  for (const { name } of dbs) {
    if (name) indexedDB.deleteDatabase(name)
  }
})
