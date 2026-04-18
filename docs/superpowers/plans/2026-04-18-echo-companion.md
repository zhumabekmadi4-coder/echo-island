# Echo Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent companion chibi "Эхо" — spirit of the islands — who narrates scene objectives, hints when the child is stuck, celebrates success with visible power-ups, provides a flashcard practice mode, and renders a spellbook of learned words.

**Architecture:** Global `EchoLayout` wrapper injects an `EchoContext` (state + `speak()`/`setMood()`/`setAnchor()` actions) above all routes. A single `EchoCompanion` component rendered `position: fixed` consumes the context and renders a Lottie chibi + speech bubble, repositioning across pages. Two new routes (`/talk`, `/spellbook`) consume the same context. Pure engine functions (`EchoProgress`, full `SpacedRepetition`) are TDD'd with vitest. Progress is tracked in a new Dexie v2 table `sceneProgress` plus a key-value `appState` table for one-time flags.

**Tech Stack:** React 19 + Vite + TypeScript, Tailwind v4, Framer Motion, Dexie 4 (IndexedDB), react-i18next, Web Speech API (recognition + synthesis), `lottie-react` (new dep). Testing: vitest + jsdom + fake-indexeddb.

---

## Source Spec

See [2026-04-18-echo-companion-design.md](../specs/2026-04-18-echo-companion-design.md).

## File Map

**New files:**
- `src/components/EchoCompanion.tsx` — Lottie player + power styling + bubble overlay + positioning
- `src/components/EchoLayout.tsx` — Context Provider wrapping `<Routes>` + `<EchoCompanion>`
- `src/components/SpeechBubble.tsx` — positioned bubble anchored to Эхо
- `src/components/WordCard.tsx` — reusable card (Spellbook grid + Talk mode)
- `src/hooks/useEcho.ts` — consumer hook for EchoContext
- `src/hooks/useSceneProgress.ts` — reactive Dexie query returning `Set<sceneId>` + count
- `src/engine/EchoProgress.ts` — pure `computePower(n)` function + thresholds
- `src/pages/Talk.tsx` — flashcard practice session
- `src/pages/Spellbook.tsx` — tabbed word grid with status gradations
- `src/content/echo_lines.json` — all generic Эхо dialog lines (RU+KK)
- `public/lottie/echo-idle.json` — primary Lottie asset (plus optional `-listening`, `-talking`, `-celebrating`)
- `vitest.config.ts` — test runner config
- `src/test/setup.ts` — jsdom + fake-indexeddb setup

**Modified files:**
- `package.json` — add `lottie-react`, `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `fake-indexeddb`
- `src/App.tsx` — wrap `<Routes>` with `<EchoLayout>`, add `/talk` and `/spellbook` routes
- `src/db/schema.ts` — add v2 migration: new `sceneProgress` and `appState` tables + type exports
- `src/engine/SpacedRepetition.ts` — replace stub with `recordReview`, `ensureWordProgress`, `scheduleNext`, `getWordsForReview`, `isWordLearned`
- `src/engine/SpeechEngine.ts` — add `speakEnglish`, `speakLocalized`, `isSpeechSynthesisSupported`, `primeSpeechSynthesis`
- `src/db/telemetry.ts` — delegate progress updates to `SpacedRepetition.recordReview`
- `src/pages/Game.tsx` — subscribe to EchoContext, idle timer, fail retry, success celebration + `sceneProgress.put` + power level-up
- `src/pages/Map.tsx` — replace hardcoded `0/N` progress bars with `useSceneProgress` data
- `src/content/scenes.json` — add `echo_intro: { ru, kk }` to all 15 scenes
- `src/locales/ru.json` + `src/locales/kk.json` — add UI strings for new pages and echo actions

---

## Task Ordering Rationale

- **Tasks 1–3 (infra & engines):** unblock everything with pure TDD-able foundations — test framework, Dexie migration, pure functions.
- **Task 4 (SR consolidation):** merge existing `telemetry.ts` logic into the engine, remove duplication.
- **Task 5 (speech synthesis):** browser API wrapper, TDD-able with mocked `window.speechSynthesis`.
- **Tasks 6–8 (content):** JSON files and localization keys — no code deps.
- **Task 9 (Lottie asset gate):** decides asset strategy before UI tasks.
- **Tasks 10–13 (Эхо UI):** component layer bottom-up (bubble → companion → context+layout → app integration).
- **Tasks 14–15 (Map integration):** real progress bars using new data.
- **Tasks 16–19 (Game integration):** intro, idle hint, fail retry, success + level-up, one per task.
- **Task 20 (WordCard):** shared component for the next two.
- **Tasks 21–22 (Spellbook page):** grid + interactions.
- **Tasks 23–25 (Talk page):** session shell + card loop + summary.
- **Task 26 (first-visit flows):** one-shot `appState` flags.
- **Task 27 (manual smoke):** whole-flow verification.

---

### Task 1: Set up vitest + jsdom + fake-indexeddb

**Why:** No test framework exists. Pure engine logic (Task 3 onwards) uses TDD — we need the test runner first.

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json`
- Modify: `tsconfig.app.json` (add vitest globals types)
- Test: sanity test at `src/engine/__tests__/sanity.test.ts` (deleted in step 5)

- [ ] **Step 1: Install test dependencies**

Run from `C:/Antigravity/echo-island`:
```bash
npm install --save-dev vitest@^3 @vitest/ui@^3 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6 fake-indexeddb@^6
```

Expected: deps added to `package.json` devDependencies.

- [ ] **Step 2: Add test scripts to package.json**

Modify `package.json` `"scripts"`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

- [ ] **Step 3: Create vitest.config.ts**

Create `vitest.config.ts` with content:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `src/test/setup.ts` with content:
```ts
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
```

- [ ] **Step 5: Add vitest types to tsconfig.app.json**

Modify `tsconfig.app.json` `"compilerOptions.types"` (add `"vitest/globals"` — create array if missing). If a `"types"` array does not yet exist, add:
```json
"types": ["vitest/globals"]
```
inside `compilerOptions`.

- [ ] **Step 6: Write sanity test**

Create `src/engine/__tests__/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })

  it('has indexeddb', () => {
    expect(typeof indexedDB).toBe('object')
  })
})
```

- [ ] **Step 7: Run sanity test**

Run: `npm run test:run -- src/engine/__tests__/sanity.test.ts`
Expected: 2 tests PASS.

- [ ] **Step 8: Delete sanity test**

Delete `src/engine/__tests__/sanity.test.ts` (keep the `__tests__` directory — more tests follow).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts tsconfig.app.json
git commit -m "chore: add vitest + jsdom + fake-indexeddb test infra"
```

---

### Task 2: Dexie v2 migration — sceneProgress + appState

**Files:**
- Modify: `src/db/schema.ts`
- Test: `src/db/__tests__/schema.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/db/__tests__/schema.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to see it fail**

Run: `npm run test:run -- src/db/__tests__/schema.test.ts`
Expected: FAIL — `db.sceneProgress` is undefined.

- [ ] **Step 3: Update schema with v2 migration**

Replace the entire content of `src/db/schema.ts`:
```ts
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
```

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- src/db/__tests__/schema.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/__tests__/schema.test.ts
git commit -m "feat(db): v2 migration with sceneProgress + appState tables"
```

---

### Task 3: EchoProgress engine — computePower

**Files:**
- Create: `src/engine/EchoProgress.ts`
- Test: `src/engine/__tests__/EchoProgress.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/engine/__tests__/EchoProgress.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { computePower, POWER_THRESHOLDS, isPowerLevelUp } from '@/engine/EchoProgress'

describe('computePower', () => {
  it('returns dim at 0 scenes', () => {
    expect(computePower(0)).toBe('dim')
  })

  it('returns ember for 1-5 scenes', () => {
    expect(computePower(1)).toBe('ember')
    expect(computePower(5)).toBe('ember')
  })

  it('returns burning for 6-10 scenes', () => {
    expect(computePower(6)).toBe('burning')
    expect(computePower(10)).toBe('burning')
  })

  it('returns radiant for 11+ scenes', () => {
    expect(computePower(11)).toBe('radiant')
    expect(computePower(15)).toBe('radiant')
    expect(computePower(100)).toBe('radiant')
  })
})

describe('isPowerLevelUp', () => {
  it('detects dim → ember at 0→1', () => {
    expect(isPowerLevelUp(0, 1)).toBe(true)
  })

  it('detects ember → burning at 5→6', () => {
    expect(isPowerLevelUp(5, 6)).toBe(true)
  })

  it('detects burning → radiant at 10→11', () => {
    expect(isPowerLevelUp(10, 11)).toBe(true)
  })

  it('returns false within same tier', () => {
    expect(isPowerLevelUp(2, 3)).toBe(false)
    expect(isPowerLevelUp(7, 8)).toBe(false)
    expect(isPowerLevelUp(12, 13)).toBe(false)
  })

  it('returns false when count does not advance', () => {
    expect(isPowerLevelUp(5, 5)).toBe(false)
  })
})

describe('POWER_THRESHOLDS', () => {
  it('exposes ordered threshold list', () => {
    expect(POWER_THRESHOLDS).toEqual([
      { min: 0, power: 'dim' },
      { min: 1, power: 'ember' },
      { min: 6, power: 'burning' },
      { min: 11, power: 'radiant' },
    ])
  })
})
```

- [ ] **Step 2: Run test to see it fail**

Run: `npm run test:run -- src/engine/__tests__/EchoProgress.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement EchoProgress**

Create `src/engine/EchoProgress.ts`:
```ts
export type Power = 'dim' | 'ember' | 'burning' | 'radiant'

export const POWER_THRESHOLDS: ReadonlyArray<{ min: number; power: Power }> = [
  { min: 0, power: 'dim' },
  { min: 1, power: 'ember' },
  { min: 6, power: 'burning' },
  { min: 11, power: 'radiant' },
]

export function computePower(scenesCompleted: number): Power {
  let current: Power = 'dim'
  for (const { min, power } of POWER_THRESHOLDS) {
    if (scenesCompleted >= min) current = power
  }
  return current
}

export function isPowerLevelUp(prevCount: number, nextCount: number): boolean {
  return computePower(prevCount) !== computePower(nextCount)
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- src/engine/__tests__/EchoProgress.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/EchoProgress.ts src/engine/__tests__/EchoProgress.test.ts
git commit -m "feat(engine): EchoProgress — computePower + level-up detection"
```

---

### Task 4: Consolidate SpacedRepetition engine

**Why:** Existing `telemetry.ts:18-51` contains SR logic (intervals `[1, 3, 7, 21]`) that should live in `SpacedRepetition.ts` so Talk mode can reuse it. Move logic, delegate from telemetry, keep existing intervals (no behavior change for existing scene flow).

**Files:**
- Modify: `src/engine/SpacedRepetition.ts`
- Modify: `src/db/telemetry.ts`
- Test: `src/engine/__tests__/SpacedRepetition.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/engine/__tests__/SpacedRepetition.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/schema'
import {
  ensureWordProgress,
  recordReview,
  scheduleNext,
  getWordsForReview,
  isWordLearned,
} from '@/engine/SpacedRepetition'

describe('scheduleNext (pure)', () => {
  const baseProgress = {
    wordId: 'fire',
    firstSeen: new Date('2026-01-01'),
    lastReviewed: new Date('2026-01-01'),
    successCount: 0,
    nextReview: new Date('2026-01-01'),
    learned: false,
  }

  it('delays retry by 10 minutes on failure', () => {
    const now = new Date('2026-04-18T12:00:00Z')
    const next = scheduleNext(baseProgress, false, now)
    expect(next.nextReview.getTime() - now.getTime()).toBe(10 * 60 * 1000)
    expect(next.successCount).toBe(0)
    expect(next.learned).toBe(false)
  })

  it('schedules +1 day after 1st success', () => {
    const now = new Date('2026-04-18T12:00:00Z')
    const next = scheduleNext(baseProgress, true, now)
    expect(next.successCount).toBe(1)
    const diffDays = (next.nextReview.getTime() - now.getTime()) / (24 * 3600 * 1000)
    expect(diffDays).toBe(1)
    expect(next.learned).toBe(false)
  })

  it('marks learned at 3 successes', () => {
    const now = new Date('2026-04-18T12:00:00Z')
    const p2 = { ...baseProgress, successCount: 2 }
    const next = scheduleNext(p2, true, now)
    expect(next.successCount).toBe(3)
    expect(next.learned).toBe(true)
  })

  it('caps interval at 21 days', () => {
    const now = new Date('2026-04-18T12:00:00Z')
    const p99 = { ...baseProgress, successCount: 99 }
    const next = scheduleNext(p99, true, now)
    const diffDays = (next.nextReview.getTime() - now.getTime()) / (24 * 3600 * 1000)
    expect(diffDays).toBe(21)
  })
})

describe('ensureWordProgress (Dexie)', () => {
  it('creates a new record if absent', async () => {
    const wp = await ensureWordProgress('fire')
    expect(wp.wordId).toBe('fire')
    expect(wp.successCount).toBe(0)
    expect(wp.learned).toBe(false)
    const row = await db.wordProgress.get('fire')
    expect(row).toBeDefined()
  })

  it('returns existing record unchanged', async () => {
    const now = new Date('2026-01-01T00:00:00Z')
    await db.wordProgress.put({
      wordId: 'fire',
      firstSeen: now,
      lastReviewed: now,
      successCount: 2,
      nextReview: new Date('2026-02-01'),
      learned: false,
    })
    const wp = await ensureWordProgress('fire')
    expect(wp.successCount).toBe(2)
  })
})

describe('recordReview (Dexie)', () => {
  it('creates and marks first-seen+success on a new word', async () => {
    await recordReview('fire', true)
    const wp = await db.wordProgress.get('fire')
    expect(wp?.successCount).toBe(1)
    expect(wp?.learned).toBe(false)
  })

  it('increments successCount on subsequent successes', async () => {
    await recordReview('fire', true)
    await recordReview('fire', true)
    await recordReview('fire', true)
    const wp = await db.wordProgress.get('fire')
    expect(wp?.successCount).toBe(3)
    expect(wp?.learned).toBe(true)
  })

  it('does not decrement on failure but does delay nextReview', async () => {
    await recordReview('fire', true)
    await recordReview('fire', true)
    const before = await db.wordProgress.get('fire')
    await recordReview('fire', false)
    const after = await db.wordProgress.get('fire')
    expect(after?.successCount).toBe(before?.successCount)
    expect(after!.nextReview.getTime()).toBeGreaterThan(Date.now() - 1000)
  })
})

describe('getWordsForReview', () => {
  it('returns words whose nextReview is in the past', async () => {
    const past = new Date(Date.now() - 10_000)
    const future = new Date(Date.now() + 10_000_000)
    await db.wordProgress.put({
      wordId: 'fire', firstSeen: past, lastReviewed: past,
      successCount: 1, nextReview: past, learned: false,
    })
    await db.wordProgress.put({
      wordId: 'water', firstSeen: past, lastReviewed: past,
      successCount: 1, nextReview: future, learned: false,
    })
    const due = await getWordsForReview()
    expect(due).toContain('fire')
    expect(due).not.toContain('water')
  })
})

describe('isWordLearned', () => {
  it('returns false if word has no record', async () => {
    expect(await isWordLearned('ghost')).toBe(false)
  })

  it('returns true when learned flag is set', async () => {
    await db.wordProgress.put({
      wordId: 'fire',
      firstSeen: new Date(),
      lastReviewed: new Date(),
      successCount: 3,
      nextReview: new Date(),
      learned: true,
    })
    expect(await isWordLearned('fire')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to see it fail**

Run: `npm run test:run -- src/engine/__tests__/SpacedRepetition.test.ts`
Expected: FAIL — exported functions are missing.

- [ ] **Step 3: Replace SpacedRepetition.ts**

Replace entire content of `src/engine/SpacedRepetition.ts`:
```ts
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
```

- [ ] **Step 4: Delegate from telemetry.ts**

Replace entire content of `src/db/telemetry.ts`:
```ts
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
```

- [ ] **Step 5: Run tests**

Run: `npm run test:run -- src/engine/__tests__/SpacedRepetition.test.ts`
Expected: all tests PASS.

- [ ] **Step 6: Smoke test existing flow**

Run: `npm run build`
Expected: no TypeScript errors (confirms telemetry refactor doesn't break Game.tsx import chain).

- [ ] **Step 7: Commit**

```bash
git add src/engine/SpacedRepetition.ts src/db/telemetry.ts src/engine/__tests__/SpacedRepetition.test.ts
git commit -m "refactor(engine): consolidate SR logic; add ensureWordProgress + recordReview"
```

---

### Task 5: Web Speech Synthesis wrapper

**Files:**
- Modify: `src/engine/SpeechEngine.ts`
- Test: `src/engine/__tests__/SpeechEngine.synthesis.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/engine/__tests__/SpeechEngine.synthesis.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isSpeechSynthesisSupported,
  primeSpeechSynthesis,
  speakEnglish,
  speakLocalized,
} from '@/engine/SpeechEngine'

describe('isSpeechSynthesisSupported', () => {
  it('returns true when window.speechSynthesis exists', () => {
    // @ts-expect-error jsdom shim
    globalThis.speechSynthesis = { speak: vi.fn(), cancel: vi.fn() }
    globalThis.SpeechSynthesisUtterance = vi.fn() as never
    expect(isSpeechSynthesisSupported()).toBe(true)
  })

  it('returns false when missing', () => {
    // @ts-expect-error jsdom shim
    delete globalThis.speechSynthesis
    // @ts-expect-error jsdom shim
    delete globalThis.SpeechSynthesisUtterance
    expect(isSpeechSynthesisSupported()).toBe(false)
  })
})

describe('speakEnglish / speakLocalized', () => {
  let spokenUtterances: Array<{ text: string; lang: string }>
  let onendHandlers: Array<() => void>

  beforeEach(() => {
    spokenUtterances = []
    onendHandlers = []
    class FakeUtterance {
      text: string
      lang = ''
      onend: (() => void) | null = null
      constructor(text: string) { this.text = text }
    }
    // @ts-expect-error jsdom shim
    globalThis.SpeechSynthesisUtterance = FakeUtterance
    // @ts-expect-error jsdom shim
    globalThis.speechSynthesis = {
      speak: (u: FakeUtterance) => {
        spokenUtterances.push({ text: u.text, lang: u.lang })
        if (u.onend) onendHandlers.push(u.onend)
      },
      cancel: vi.fn(),
    }
  })

  it('speakEnglish uses en-US', async () => {
    const promise = speakEnglish('fire')
    onendHandlers.forEach((fn) => fn())
    await promise
    expect(spokenUtterances).toEqual([{ text: 'fire', lang: 'en-US' }])
  })

  it('speakLocalized uses ru-RU / kk-KZ', async () => {
    const p1 = speakLocalized('Попробуй ещё раз', 'ru')
    onendHandlers.forEach((fn) => fn())
    await p1
    const p2 = speakLocalized('Қайталап көр', 'kk')
    onendHandlers.forEach((fn) => fn())
    await p2
    expect(spokenUtterances[0].lang).toBe('ru-RU')
    expect(spokenUtterances[1].lang).toBe('kk-KZ')
  })

  it('resolves immediately when synthesis unsupported', async () => {
    // @ts-expect-error jsdom shim
    delete globalThis.speechSynthesis
    await expect(speakEnglish('fire')).resolves.toBeUndefined()
  })
})

describe('primeSpeechSynthesis', () => {
  it('speaks empty utterance once for iOS unlock', () => {
    const speak = vi.fn()
    // @ts-expect-error jsdom shim
    globalThis.speechSynthesis = { speak, cancel: vi.fn() }
    class FakeUtterance { text: string; constructor(t: string) { this.text = t } }
    // @ts-expect-error jsdom shim
    globalThis.SpeechSynthesisUtterance = FakeUtterance
    primeSpeechSynthesis()
    primeSpeechSynthesis()  // second call — should not speak again
    expect(speak).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to see it fail**

Run: `npm run test:run -- src/engine/__tests__/SpeechEngine.synthesis.test.ts`
Expected: FAIL — functions missing.

- [ ] **Step 3: Extend SpeechEngine.ts**

Append to `src/engine/SpeechEngine.ts` (keep existing recognition code intact):
```ts
// --- Web Speech Synthesis ---

let primed = false

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof globalThis.speechSynthesis !== 'undefined' &&
    typeof globalThis.SpeechSynthesisUtterance !== 'undefined'
  )
}

export function primeSpeechSynthesis(): void {
  if (primed) return
  if (!isSpeechSynthesisSupported()) return
  const u = new SpeechSynthesisUtterance('')
  window.speechSynthesis.speak(u)
  primed = true
}

export function speakEnglish(text: string): Promise<void> {
  return speakInternal(text, 'en-US')
}

export function speakLocalized(text: string, lang: 'ru' | 'kk'): Promise<void> {
  const locale = lang === 'ru' ? 'ru-RU' : 'kk-KZ'
  return speakInternal(text, locale)
}

function speakInternal(text: string, lang: string): Promise<void> {
  if (!isSpeechSynthesisSupported()) return Promise.resolve()
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- src/engine/__tests__/SpeechEngine.synthesis.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/SpeechEngine.ts src/engine/__tests__/SpeechEngine.synthesis.test.ts
git commit -m "feat(engine): add Web Speech Synthesis wrappers + iOS priming"
```

---

### Task 6: Author echo_lines.json content

**Files:**
- Create: `src/content/echo_lines.json`

- [ ] **Step 1: Create echo_lines.json**

Create `src/content/echo_lines.json`:
```json
{
  "first_greeting": {
    "ru": "Привет… я Эхо, дух этих островов. Мой свет угас — все зверята попали в беду. Помоги им, и я разгорюсь снова.",
    "kk": "Сәлем… мен Эхо, осы аралдардың рухымын. Жануарларға көмек керек — көмектессең, қайта жанамын."
  },
  "retry_hint": {
    "ru": "Почти! Послушай:",
    "kk": "Дерлік! Тыңда:"
  },
  "level_up": {
    "ember": {
      "ru": "Я разгораюсь!",
      "kk": "Мен қайта жанып жатырмын!"
    },
    "burning": {
      "ru": "Я чувствую силу!",
      "kk": "Мен күш сезіп тұрмын!"
    },
    "radiant": {
      "ru": "Я снова сияю!",
      "kk": "Мен қайта жарқырап тұрмын!"
    }
  },
  "talk_session_start": {
    "ru": "Давай потренируем слова!",
    "kk": "Сөздерді жаттығайық!"
  },
  "talk_session_empty": {
    "ru": "Всё выучено! Приходи позже.",
    "kk": "Барлығы жатталды! Кейінірек кел."
  },
  "talk_session_done": {
    "ru": "Ты повторил {{n}} слов!",
    "kk": "Сен {{n}} сөзді қайталадың!"
  },
  "talk_next_word": {
    "ru": "Следующее слово…",
    "kk": "Келесі сөз…"
  },
  "talk_try_again": {
    "ru": "Попробуй ещё раз",
    "kk": "Қайталап көр"
  },
  "spellbook_intro": {
    "ru": "Это твои слова-заклинания. Чем ярче слово, тем крепче ты его помнишь.",
    "kk": "Бұл сенің сиқырлы сөздерің. Жарқырағанын неғұрлым жақсы білесің."
  },
  "locked_word": {
    "ru": "Сначала найди это на острове!",
    "kk": "Алдымен аралдан тап!"
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/echo_lines.json
git commit -m "content: Echo companion dialog lines (RU+KK)"
```

---

### Task 7: Author scene echo_intro lines

**Files:**
- Modify: `src/content/scenes.json`

- [ ] **Step 1: Add echo_intro to all 15 scenes**

Modify `src/content/scenes.json` — for each of the 15 scene objects, add a new field `echo_intro` with RU + KK lines. Full replacement content (this is the complete file — DO NOT merge partial):

```json
[
  {
    "id": "dragon_frozen",
    "island_id": "crystal_caves",
    "background": "cave_icy",
    "character": { "id": "dragon_red", "type": "dragon", "state_before": "frozen", "state_after": "happy", "position": { "x": 55, "y": 38 } },
    "trigger_word_id": "fire",
    "success_animation": "fire",
    "success_text": { "ru": "Дракончик спасён!", "kk": "Айдаһар құтқарылды!" },
    "echo_intro": { "ru": "Дракончик замёрз! Скажи \"fire\" 🔥", "kk": "Айдаһар тоңып қалды! \"fire\" деп айт 🔥" },
    "hint_emoji": "🔥",
    "next_scene_id": "fish_dry"
  },
  {
    "id": "fish_dry",
    "island_id": "crystal_caves",
    "background": "cave_dry",
    "character": { "id": "fish_blue", "type": "fish", "state_before": "sad", "state_after": "happy", "position": { "x": 50, "y": 45 } },
    "trigger_word_id": "water",
    "success_animation": "water",
    "success_text": { "ru": "Рыбка плавает!", "kk": "Балық жүзіп жүр!" },
    "echo_intro": { "ru": "Рыбке нужна вода! Скажи \"water\" 💧", "kk": "Балыққа су керек! \"water\" деп айт 💧" },
    "hint_emoji": "💧",
    "next_scene_id": "owl_dark"
  },
  {
    "id": "owl_dark",
    "island_id": "crystal_caves",
    "background": "cave_dark",
    "character": { "id": "owl_gold", "type": "owl", "state_before": "sleeping", "state_after": "happy", "position": { "x": 55, "y": 35 } },
    "trigger_word_id": "light",
    "success_animation": "light",
    "success_text": { "ru": "Совёнок проснулся!", "kk": "Жапалақ оянды!" },
    "echo_intro": { "ru": "В пещере темно! Скажи \"light\" 💡", "kk": "Үңгір қараңғы! \"light\" деп айт 💡" },
    "hint_emoji": "💡",
    "next_scene_id": "fairy_fog"
  },
  {
    "id": "fairy_fog",
    "island_id": "crystal_caves",
    "background": "cave_foggy",
    "character": { "id": "fairy_green", "type": "fairy", "state_before": "hidden", "state_after": "happy", "position": { "x": 50, "y": 40 } },
    "trigger_word_id": "wind",
    "success_animation": "wind",
    "success_text": { "ru": "Фея найдена!", "kk": "Пері табылды!" },
    "echo_intro": { "ru": "Фея спряталась в тумане! Скажи \"wind\" 🌬️", "kk": "Пері тұман ішінде! \"wind\" деп айт 🌬️" },
    "hint_emoji": "🌬️",
    "next_scene_id": "fox_lost"
  },
  {
    "id": "fox_lost",
    "island_id": "crystal_caves",
    "background": "cave_exit",
    "character": { "id": "fox_silver", "type": "fox", "state_before": "lost", "state_after": "happy", "position": { "x": 55, "y": 42 } },
    "trigger_word_id": "star",
    "success_animation": "light",
    "success_text": { "ru": "Лисёнок нашёл путь!", "kk": "Түлкі жолын тапты!" },
    "echo_intro": { "ru": "Лисёнок потерялся! Скажи \"star\" ⭐", "kk": "Түлкі адасып қалды! \"star\" деп айт ⭐" },
    "hint_emoji": "⭐",
    "next_scene_id": null
  },
  {
    "id": "cat_sleeping",
    "island_id": "enchanted_forest",
    "background": "forest_tree",
    "character": { "id": "cat_purple", "type": "cat", "state_before": "sleeping", "state_after": "happy", "position": { "x": 55, "y": 38 } },
    "trigger_word_id": "cat",
    "success_animation": "sparkle",
    "success_text": { "ru": "Котёнок мурлычет!", "kk": "Мысық мырылдайды!" },
    "echo_intro": { "ru": "Котёнок спит на дереве! Позови — скажи \"cat\" 🐱", "kk": "Мысық ағашта ұйықтап тұр! Шақыр — \"cat\" деп айт 🐱" },
    "hint_emoji": "🐱",
    "next_scene_id": "puppy_lost"
  },
  {
    "id": "puppy_lost",
    "island_id": "enchanted_forest",
    "background": "forest_path",
    "character": { "id": "dog_golden", "type": "dog", "state_before": "lost", "state_after": "happy", "position": { "x": 50, "y": 45 } },
    "trigger_word_id": "dog",
    "success_animation": "sparkle",
    "success_text": { "ru": "Щенок нашёлся!", "kk": "Күшік табылды!" },
    "echo_intro": { "ru": "Щенок заблудился! Позови — скажи \"dog\" 🐶", "kk": "Күшік жоғалып қалды! Шақыр — \"dog\" деп айт 🐶" },
    "hint_emoji": "🐶",
    "next_scene_id": "egg_nest"
  },
  {
    "id": "egg_nest",
    "island_id": "enchanted_forest",
    "background": "forest_canopy",
    "character": { "id": "bird_blue", "type": "bird", "state_before": "egg", "state_after": "happy", "position": { "x": 55, "y": 35 } },
    "trigger_word_id": "bird",
    "success_animation": "wind",
    "success_text": { "ru": "Птенчик вылупился!", "kk": "Балапан жарылды!" },
    "echo_intro": { "ru": "В гнезде яйцо! Помоги птенцу — скажи \"bird\" 🐣", "kk": "Ұяда жұмыртқа бар! Балапанға көмектес — \"bird\" деп айт 🐣" },
    "hint_emoji": "🐣",
    "next_scene_id": "bear_hibernate"
  },
  {
    "id": "bear_hibernate",
    "island_id": "enchanted_forest",
    "background": "forest_den",
    "character": { "id": "bear_brown", "type": "bear", "state_before": "sleeping", "state_after": "happy", "position": { "x": 50, "y": 42 } },
    "trigger_word_id": "bear",
    "success_animation": "fire",
    "success_text": { "ru": "Мишка проснулся!", "kk": "Аю оянды!" },
    "echo_intro": { "ru": "Мишка спит в берлоге! Позови — скажи \"bear\" 🐻", "kk": "Аю үңгірде ұйықтап тұр! Шақыр — \"bear\" деп айт 🐻" },
    "hint_emoji": "🐻",
    "next_scene_id": "rabbit_trapped"
  },
  {
    "id": "rabbit_trapped",
    "island_id": "enchanted_forest",
    "background": "forest_clearing",
    "character": { "id": "rabbit_white", "type": "rabbit", "state_before": "trapped", "state_after": "happy", "position": { "x": 55, "y": 45 } },
    "trigger_word_id": "rabbit",
    "success_animation": "sparkle",
    "success_text": { "ru": "Зайчик свободен!", "kk": "Қоян бос!" },
    "echo_intro": { "ru": "Зайчик попал в ловушку! Скажи \"rabbit\" 🐰", "kk": "Қоян қақпанға түсіп қалды! \"rabbit\" деп айт 🐰" },
    "hint_emoji": "🐰",
    "next_scene_id": null
  },
  {
    "id": "turtle_cold",
    "island_id": "star_beach",
    "background": "beach_night",
    "character": { "id": "turtle_green", "type": "turtle", "state_before": "cold", "state_after": "happy", "position": { "x": 50, "y": 48 } },
    "trigger_word_id": "sun",
    "success_animation": "fire",
    "success_text": { "ru": "Черепашке тепло!", "kk": "Тасбақаға жылы!" },
    "echo_intro": { "ru": "Черепашке холодно ночью! Скажи \"sun\" ☀️", "kk": "Тасбақа түнде тоңып тұр! \"sun\" деп айт ☀️" },
    "hint_emoji": "☀️",
    "next_scene_id": "wolf_howl"
  },
  {
    "id": "wolf_howl",
    "island_id": "star_beach",
    "background": "beach_cliff",
    "character": { "id": "wolf_grey", "type": "wolf", "state_before": "lonely", "state_after": "happy", "position": { "x": 55, "y": 38 } },
    "trigger_word_id": "moon",
    "success_animation": "light",
    "success_text": { "ru": "Волчонок воет на луну!", "kk": "Бөлтірік айға ұлиды!" },
    "echo_intro": { "ru": "Волчонку одиноко! Позови — скажи \"moon\" 🌙", "kk": "Бөлтірік жалғыз! Шақыр — \"moon\" деп айт 🌙" },
    "hint_emoji": "🌙",
    "next_scene_id": "flower_wilted"
  },
  {
    "id": "flower_wilted",
    "island_id": "star_beach",
    "background": "beach_garden",
    "character": { "id": "flower_fairy", "type": "fairy", "state_before": "sad", "state_after": "happy", "position": { "x": 50, "y": 42 } },
    "trigger_word_id": "rain",
    "success_animation": "water",
    "success_text": { "ru": "Цветы расцвели!", "kk": "Гүлдер гүлдеді!" },
    "echo_intro": { "ru": "Цветы засохли! Скажи \"rain\" 🌧️", "kk": "Гүлдер қурап қалды! \"rain\" деп айт 🌧️" },
    "hint_emoji": "🌧️",
    "next_scene_id": "tree_dead"
  },
  {
    "id": "tree_dead",
    "island_id": "star_beach",
    "background": "beach_hill",
    "character": { "id": "tree_spirit", "type": "tree_spirit", "state_before": "withered", "state_after": "happy", "position": { "x": 50, "y": 38 } },
    "trigger_word_id": "tree",
    "success_animation": "sparkle",
    "success_text": { "ru": "Дерево ожило!", "kk": "Ағаш тірілді!" },
    "echo_intro": { "ru": "Дерево увяло! Скажи \"tree\" 🌳", "kk": "Ағаш қурап қалды! \"tree\" деп айт 🌳" },
    "hint_emoji": "🌳",
    "next_scene_id": "penguin_hot"
  },
  {
    "id": "penguin_hot",
    "island_id": "star_beach",
    "background": "beach_tropical",
    "character": { "id": "penguin_blue", "type": "penguin", "state_before": "hot", "state_after": "happy", "position": { "x": 55, "y": 45 } },
    "trigger_word_id": "snow",
    "success_animation": "ice",
    "success_text": { "ru": "Пингвинёнку прохладно!", "kk": "Пингвинге салқын!" },
    "echo_intro": { "ru": "Пингвинёнку жарко! Скажи \"snow\" ❄️", "kk": "Пингвинге ыстық! \"snow\" деп айт ❄️" },
    "hint_emoji": "❄️",
    "next_scene_id": null
  }
]
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/scenes.json
git commit -m "content: add echo_intro lines for all 15 scenes (RU+KK)"
```

---

### Task 8: Add UI strings to locales

**Files:**
- Modify: `src/locales/ru.json`
- Modify: `src/locales/kk.json`

- [ ] **Step 1: Extend ru.json**

Replace entire content of `src/locales/ru.json`:
```json
{
  "app_name": "Эхо-остров",
  "mic_button_speak": "Скажи слово!",
  "mic_button_listening": "Слушаю...",
  "mic_button_processing": "Проверяю...",
  "try_again": "Попробуй ещё раз!",
  "hint_say": "Скажи:",
  "hint_means": "Означает:",
  "welcome_title": "Добро пожаловать на Эхо-остров!",
  "welcome_subtitle": "Произноси слова — твори магию!",
  "speech_not_supported": "Твой браузер не поддерживает распознавание речи",
  "mic_permission_denied": "Разреши доступ к микрофону",
  "no_speech_detected": "Я тебя не услышал. Попробуй ещё раз!",
  "scene_complete": "Отлично! Ты справился!",

  "echo_menu_talk": "Поговорить",
  "echo_menu_spellbook": "Книга заклинаний",
  "echo_menu_close": "Закрыть",
  "echo_level_up_banner": "Эхо разгорелся ярче!",

  "spellbook_title": "Книга заклинаний",
  "spellbook_progress": "{{learned}} из {{total}} выучено",
  "spellbook_tab_magic_elements": "Магия",
  "spellbook_tab_animals": "Животные",
  "spellbook_tab_sky": "Небо",
  "spellbook_listen": "Послушать",
  "spellbook_pronounce": "Произнести",
  "spellbook_return_to_scene": "Вернуться на остров",

  "talk_title": "Потренируемся!",
  "talk_session_next": "Следующее слово",
  "talk_session_done_button_again": "Ещё раз",
  "talk_session_done_button_map": "К карте",
  "talk_hint_show": "Подсказка",

  "nav_back_to_map": "К карте",
  "locked_tooltip_prefix": "Сначала найди это на острове"
}
```

- [ ] **Step 2: Extend kk.json**

Read current `src/locales/kk.json` to keep existing keys, then replace with (merge existing keys + add new):
```json
{
  "app_name": "Эхо-арал",
  "mic_button_speak": "Сөзді айт!",
  "mic_button_listening": "Тыңдап тұрмын...",
  "mic_button_processing": "Тексеріп жатырмын...",
  "try_again": "Қайталап көр!",
  "hint_say": "Айт:",
  "hint_means": "Мағынасы:",
  "welcome_title": "Эхо-аралға қош келдің!",
  "welcome_subtitle": "Сөздерді айт — сиқыр жаса!",
  "speech_not_supported": "Браузер сөзді танымайды",
  "mic_permission_denied": "Микрофонға рұқсат бер",
  "no_speech_detected": "Естімедім. Қайталап көр!",
  "scene_complete": "Жарайсың! Сен жасадың!",

  "echo_menu_talk": "Сөйлесейік",
  "echo_menu_spellbook": "Сиқыр кітабы",
  "echo_menu_close": "Жабу",
  "echo_level_up_banner": "Эхо жарқырап кетті!",

  "spellbook_title": "Сиқыр кітабы",
  "spellbook_progress": "{{learned}} / {{total}} жатталды",
  "spellbook_tab_magic_elements": "Сиқыр",
  "spellbook_tab_animals": "Жануарлар",
  "spellbook_tab_sky": "Аспан",
  "spellbook_listen": "Тыңда",
  "spellbook_pronounce": "Айт",
  "spellbook_return_to_scene": "Аралға қайт",

  "talk_title": "Жаттығайық!",
  "talk_session_next": "Келесі сөз",
  "talk_session_done_button_again": "Тағы да",
  "talk_session_done_button_map": "Картаға",
  "talk_hint_show": "Нұсқау",

  "nav_back_to_map": "Картаға",
  "locked_tooltip_prefix": "Алдымен аралдан тап"
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/ru.json src/locales/kk.json
git commit -m "i18n: add strings for Echo menu, spellbook, talk mode"
```

---

### Task 9: Install lottie-react and decide asset strategy

**Purpose gate:** decide whether we have a 4-state Lottie set or fall back to single-idle + Framer Motion.

**Files:**
- Modify: `package.json`
- Create: `public/lottie/echo-idle.json`
- Possibly create: `public/lottie/echo-listening.json`, `echo-talking.json`, `echo-celebrating.json`
- Create: `public/lottie/README.md` (documents asset source + license)

- [ ] **Step 1: Install lottie-react**

Run: `npm install lottie-react@^2`
Expected: added to `package.json` dependencies.

- [ ] **Step 2: Decide asset path and document it**

Search LottieFiles (https://lottiefiles.com/) for terms: `fire sprite`, `magical flame`, `cute flame mascot`, `spirit creature`. Target: a single artist/style with at least an idle animation, ideally with companion states.

**Decision rules:**
- If a consistent 4-state set exists → download all 4 under `public/lottie/echo-{idle,listening,talking,celebrating}.json`.
- Else → download 1 `idle.json`; listening/talking/celebrating will be derived in-component via Framer Motion.

Create `public/lottie/README.md`:
```md
# Echo Companion Lottie Assets

**Source:** [LottieFiles — ARTIST/URL]
**License:** [CC-BY / CC0 / commercial free — paste license terms]
**Files present:**
- `echo-idle.json` — required
- `echo-listening.json` — optional; if absent, idle + Framer Motion `listening` variant used
- `echo-talking.json` — optional; if absent, idle + Framer Motion `talking` variant used
- `echo-celebrating.json` — optional; if absent, idle + Framer Motion `celebrating` variant used

Replace this paragraph with the chosen asset's actual attribution.
```

Fill in actual attribution once the asset is chosen. If nothing acceptable found on LottieFiles, fall back to a hand-authored placeholder JSON (a simple pulsing circle works for bootstrap — can be upgraded later).

- [ ] **Step 3: Place at least echo-idle.json**

Place `public/lottie/echo-idle.json` (downloaded or placeholder) in the folder.

Minimum acceptable placeholder content (pulsing flame circle, ~3 KB) if no LottieFiles asset is chosen:
```json
{"v":"5.7.4","fr":30,"ip":0,"op":60,"w":200,"h":200,"nm":"echo-idle","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"flame","sr":1,"ks":{"o":{"a":0,"k":100},"r":{"a":0,"k":0},"p":{"a":0,"k":[100,100,0]},"a":{"a":0,"k":[0,0,0]},"s":{"a":1,"k":[{"t":0,"s":[100,100,100]},{"t":30,"s":[115,115,100]},{"t":60,"s":[100,100,100]}]}},"ao":0,"shapes":[{"ty":"el","p":{"a":0,"k":[0,0]},"s":{"a":0,"k":[120,160]},"nm":"ellipse"},{"ty":"fl","c":{"a":0,"k":[1,0.6,0.2,1]},"o":{"a":0,"k":100},"nm":"fill"}],"ip":0,"op":60,"st":0,"bm":0}],"markers":[]}
```

- [ ] **Step 4: Verify asset loads in browser**

Run: `npm run dev`
In browser devtools console, hit: `fetch('/lottie/echo-idle.json').then(r => r.json()).then(console.log)`
Expected: JSON printed, `layers` array present.

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json public/lottie/
git commit -m "chore: add lottie-react + Echo idle asset"
```

---

### Task 10: SpeechBubble component

**Files:**
- Create: `src/components/SpeechBubble.tsx`

- [ ] **Step 1: Implement SpeechBubble**

Create `src/components/SpeechBubble.tsx`:
```tsx
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface SpeechBubbleProps {
  visible: boolean
  text: ReactNode
  side?: 'left' | 'right' | 'top'
}

export function SpeechBubble({ visible, text, side = 'top' }: SpeechBubbleProps) {
  const sideStyle = {
    left:  { right: '105%', top: '50%', transform: 'translateY(-50%)' },
    right: { left:  '105%', top: '50%', transform: 'translateY(-50%)' },
    top:   { bottom: '110%', left: '50%', transform: 'translateX(-50%)' },
  }[side]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute z-20 pointer-events-none"
          style={sideStyle}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <div
            className="rounded-2xl px-4 py-2 text-sm font-medium text-white max-w-[240px] text-center"
            style={{
              background: 'rgba(15,10,40,0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(251,191,36,0.35)',
              boxShadow: '0 0 20px rgba(251,191,36,0.15), 0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            {text}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SpeechBubble.tsx
git commit -m "feat(ui): SpeechBubble component"
```

---

### Task 11: EchoCompanion component (Lottie + position + power styling)

**Files:**
- Create: `src/components/EchoCompanion.tsx`

- [ ] **Step 1: Implement EchoCompanion**

Create `src/components/EchoCompanion.tsx`:
```tsx
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import type { Power } from '@/engine/EchoProgress'
import type { Mood, Anchor } from '@/hooks/useEcho'
import { SpeechBubble } from '@/components/SpeechBubble'
import idleAnimation from '../../public/lottie/echo-idle.json'

const POWER_STYLES: Record<Power, { tint: string; scale: number; glow: string }> = {
  dim:      { tint: '#64748b', scale: 0.7,  glow: 'transparent' },
  ember:    { tint: '#fb923c', scale: 1.0,  glow: 'rgba(251,146,60,0.35)' },
  burning:  { tint: '#f97316', scale: 1.15, glow: 'rgba(249,115,22,0.5)' },
  radiant:  { tint: '#fbbf24', scale: 1.3,  glow: 'rgba(251,191,36,0.7)' },
}

const MOOD_MOTION: Record<Mood, { scale: number[]; rotate: number[]; duration: number }> = {
  idle:        { scale: [1, 1.04, 1],   rotate: [0, 0, 0],    duration: 2.5 },
  listening:   { scale: [1, 1.1, 1],    rotate: [-3, 3, -3],  duration: 0.6 },
  talking:     { scale: [1, 1.06, 1],   rotate: [0, 0, 0],    duration: 0.3 },
  celebrating: { scale: [1, 1.3, 0.95], rotate: [0, 15, -15], duration: 0.5 },
}

interface EchoCompanionProps {
  power: Power
  mood: Mood
  anchor: Anchor
  bubbleText: string | null
}

export function EchoCompanion({ power, mood, anchor, bubbleText }: EchoCompanionProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const powerStyle = POWER_STYLES[power]
  const motionSpec = MOOD_MOTION[mood]

  useEffect(() => {
    if (!lottieRef.current) return
    lottieRef.current.setSpeed(mood === 'celebrating' ? 1.5 : 1)
  }, [mood])

  const { left, top, right, bottom, bubbleSide } = resolveAnchor(anchor)

  return (
    <motion.div
      className="fixed z-50"
      style={{ left, top, right, bottom, pointerEvents: 'auto' }}
      layout
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <motion.div
        style={{ position: 'relative', width: 80, height: 80 }}
        animate={{ scale: motionSpec.scale, rotate: motionSpec.rotate }}
        transition={{
          duration: motionSpec.duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${powerStyle.glow} 0%, transparent 70%)`,
            transform: `scale(${powerStyle.scale * 1.4})`,
          }}
        />

        {/* Lottie */}
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${powerStyle.scale})`,
            filter: `drop-shadow(0 0 8px ${powerStyle.glow})`,
          }}
        >
          <Lottie
            lottieRef={lottieRef}
            animationData={idleAnimation}
            loop
            autoplay
            style={{
              width: '100%',
              height: '100%',
              // CSS tint via mix-blend-mode trick (works for mono-color Lottie)
              filter: power === 'dim' ? 'grayscale(0.6) brightness(0.7)' : undefined,
            }}
          />
        </div>

        <SpeechBubble visible={!!bubbleText} text={bubbleText} side={bubbleSide} />
      </motion.div>
    </motion.div>
  )
}

function resolveAnchor(anchor: Anchor): {
  left?: string; top?: string; right?: string; bottom?: string;
  bubbleSide: 'left' | 'right' | 'top'
} {
  if (anchor.mode === 'corner') {
    return { right: '16px', bottom: '16px', bubbleSide: 'left' }
  }
  if (anchor.mode === 'center-top') {
    return { left: '50%', top: '18%', bubbleSide: 'top' }
  }
  // scene anchor: percentage coords relative to viewport
  return {
    left: `${anchor.x}%`,
    top: `${anchor.y}%`,
    bubbleSide: anchor.x > 50 ? 'left' : 'right',
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: may fail — `@/hooks/useEcho` types don't exist yet. That's fine; Task 12 adds them. Skip to commit only after Task 12.

- [ ] **Step 3: Stage for commit (but do NOT commit until Task 12 passes)**

Leave the file in working tree. Task 12 will commit together.

---

### Task 12: EchoContext + EchoLayout + useEcho hook

**Files:**
- Create: `src/hooks/useEcho.ts`
- Create: `src/components/EchoLayout.tsx`

- [ ] **Step 1: Implement useEcho hook + types**

Create `src/hooks/useEcho.ts`:
```ts
import { createContext, useContext } from 'react'
import type { Power } from '@/engine/EchoProgress'

export type Mood = 'idle' | 'listening' | 'talking' | 'celebrating'

export type Anchor =
  | { mode: 'corner' }
  | { mode: 'center-top' }
  | { mode: 'scene'; x: number; y: number }

export interface SpeakInput {
  ru: string
  kk: string
  en?: string
}

export interface EchoContextValue {
  power: Power
  mood: Mood
  bubbleText: string | null
  anchor: Anchor
  speak: (input: SpeakInput, opts?: { mood?: Mood; duration?: number }) => Promise<void>
  setMood: (m: Mood) => void
  setAnchor: (a: Anchor) => void
  levelUpFlash: Power | null
}

export const EchoContext = createContext<EchoContextValue | null>(null)

export function useEcho(): EchoContextValue {
  const ctx = useContext(EchoContext)
  if (!ctx) throw new Error('useEcho must be used inside <EchoLayout>')
  return ctx
}
```

- [ ] **Step 2: Implement EchoLayout Provider**

Create `src/components/EchoLayout.tsx`:
```tsx
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { db } from '@/db/schema'
import { computePower, isPowerLevelUp, type Power } from '@/engine/EchoProgress'
import {
  speakEnglish,
  speakLocalized,
  primeSpeechSynthesis,
} from '@/engine/SpeechEngine'
import {
  EchoContext,
  type Anchor,
  type EchoContextValue,
  type Mood,
  type SpeakInput,
} from '@/hooks/useEcho'
import { EchoCompanion } from '@/components/EchoCompanion'
import echoLines from '@/content/echo_lines.json'

export function EchoLayout({ children }: { children: ReactNode }) {
  const { i18n, t } = useTranslation()
  const location = useLocation()
  const lang = i18n.language as 'ru' | 'kk'

  const scenesCompleted = useLiveQuery(() => db.sceneProgress.count(), [], 0)
  const prevCountRef = useRef(scenesCompleted)
  const power: Power = useMemo(() => computePower(scenesCompleted ?? 0), [scenesCompleted])

  const [mood, setMood] = useState<Mood>('idle')
  const [anchor, setAnchor] = useState<Anchor>({ mode: 'corner' })
  const [bubbleText, setBubbleText] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [levelUpFlash, setLevelUpFlash] = useState<Power | null>(null)
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset anchor to corner on route change (pages override as needed)
  useEffect(() => {
    setAnchor({ mode: location.pathname === '/talk' ? 'center-top' : 'corner' })
    setMood('idle')
    setBubbleText(null)
    setMenuOpen(false)
  }, [location.pathname])

  // Detect power level-up
  useEffect(() => {
    const prev = prevCountRef.current ?? 0
    const curr = scenesCompleted ?? 0
    if (curr > prev && isPowerLevelUp(prev, curr)) {
      setLevelUpFlash(computePower(curr))
      setTimeout(() => setLevelUpFlash(null), 1500)
    }
    prevCountRef.current = curr
  }, [scenesCompleted])

  const clearBubbleTimer = () => {
    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current)
      bubbleTimerRef.current = null
    }
  }

  const speak = useCallback(
    async (input: SpeakInput, opts?: { mood?: Mood; duration?: number }) => {
      primeSpeechSynthesis()
      clearBubbleTimer()
      const text = input[lang] ?? input.ru
      const prevMood = mood
      setBubbleText(text)
      setMood(opts?.mood ?? 'talking')

      await speakLocalized(text, lang)
      if (input.en) await speakEnglish(input.en)

      const duration = opts?.duration ?? 3000
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleText(null)
        setMood(prevMood)
      }, duration)
    },
    [lang, mood]
  )

  const menuSuppressed =
    location.pathname.startsWith('/island/') ||
    location.pathname === '/talk' ||
    location.pathname === '/spellbook'

  const toggleMenu = useCallback(() => {
    if (menuSuppressed) return
    primeSpeechSynthesis()
    setMenuOpen((o) => !o)
  }, [menuSuppressed])

  const value: EchoContextValue = {
    power,
    mood,
    bubbleText,
    anchor,
    speak,
    setMood,
    setAnchor,
    levelUpFlash,
  }

  return (
    <EchoContext.Provider value={value}>
      {children}

      <div onClick={toggleMenu}>
        <EchoCompanion
          power={power}
          mood={mood}
          anchor={anchor}
          bubbleText={bubbleText}
        />
      </div>

      {/* Tap menu */}
      {menuOpen && !menuSuppressed && (
        <EchoMenu
          onNavigate={(path) => {
            setMenuOpen(false)
            window.history.pushState({}, '', path)
            // trigger react-router update
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
          onClose={() => setMenuOpen(false)}
          labels={{
            talk: t('echo_menu_talk'),
            spellbook: t('echo_menu_spellbook'),
            close: t('echo_menu_close'),
          }}
        />
      )}

      {/* Level-up banner */}
      {levelUpFlash && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl text-white font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.9), rgba(249,115,22,0.9))',
            boxShadow: '0 0 30px rgba(251,191,36,0.5)',
            animation: 'echoFlash 1.5s ease-out',
          }}
        >
          {t('echo_level_up_banner')}
        </div>
      )}
    </EchoContext.Provider>
  )
}

function EchoMenu({
  onNavigate,
  onClose,
  labels,
}: {
  onNavigate: (path: string) => void
  onClose: () => void
  labels: { talk: string; spellbook: string; close: string }
}) {
  return (
    <div
      className="fixed z-[55] flex flex-col gap-2"
      style={{ right: '110px', bottom: '24px' }}
    >
      <button
        className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-black/60 backdrop-blur hover:bg-black/80"
        onClick={() => onNavigate('/talk')}
      >
        💬 {labels.talk}
      </button>
      <button
        className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-black/60 backdrop-blur hover:bg-black/80"
        onClick={() => onNavigate('/spellbook')}
      >
        📖 {labels.spellbook}
      </button>
      <button
        className="px-4 py-2 rounded-xl text-white/60 text-xs bg-black/40 backdrop-blur"
        onClick={onClose}
      >
        ✕ {labels.close}
      </button>
    </div>
  )
}
```

Note: `echo_lines.json` is imported but not yet used here — Talk/Spellbook/Game pages will reference it directly.

- [ ] **Step 3: Add echoFlash keyframes**

Append to `src/index.css`:
```css
@keyframes echoFlash {
  0%   { opacity: 0; transform: translate(-50%, -10px) scale(0.8); }
  20%  { opacity: 1; transform: translate(-50%, 0) scale(1.05); }
  80%  { opacity: 1; transform: translate(-50%, 0) scale(1.0); }
  100% { opacity: 0; transform: translate(-50%, -10px) scale(0.95); }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS (types from Task 11 now resolve).

- [ ] **Step 5: Commit (includes Task 11 files)**

```bash
git add src/hooks/useEcho.ts src/components/EchoLayout.tsx src/components/EchoCompanion.tsx src/index.css
git commit -m "feat(ui): EchoContext + EchoLayout + EchoCompanion with Lottie"
```

---

### Task 13: Wire EchoLayout into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx**

Replace entire content:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MapPage } from '@/pages/Map'
import { Game } from '@/pages/Game'
import { Talk } from '@/pages/Talk'
import { Spellbook } from '@/pages/Spellbook'
import { EchoLayout } from '@/components/EchoLayout'
import '@/lib/i18n'

function App() {
  return (
    <BrowserRouter>
      <EchoLayout>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/island/:islandId/scene/:sceneId" element={<Game />} />
          <Route path="/talk" element={<Talk />} />
          <Route path="/spellbook" element={<Spellbook />} />
        </Routes>
      </EchoLayout>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 2: Create stub pages so build passes**

Create `src/pages/Talk.tsx`:
```tsx
export function Talk() {
  return <div className="w-full h-full bg-black text-white flex items-center justify-center">Talk — TBD</div>
}
```

Create `src/pages/Spellbook.tsx`:
```tsx
export function Spellbook() {
  return <div className="w-full h-full bg-black text-white flex items-center justify-center">Spellbook — TBD</div>
}
```

These stubs are replaced in Tasks 21 and 23. The "TBD" text here is intentional scaffolding for a runtime build, not planning placeholder — acceptable because the stub lives for ~5 tasks then gets replaced with the real page.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`. Open `http://localhost:5173/`.
Expected: map loads, Эхо chibi visible in bottom-right corner with idle animation. Tap on Эхо → menu with "Поговорить" + "Книга заклинаний" appears. Tap "Книга заклинаний" → navigates to `/spellbook` stub. Tap corner (no menu on spellbook). Back-button navigates to map.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/pages/Talk.tsx src/pages/Spellbook.tsx
git commit -m "feat: wire EchoLayout into App + stub Talk/Spellbook routes"
```

---

### Task 14: useSceneProgress hook

**Files:**
- Create: `src/hooks/useSceneProgress.ts`
- Test: `src/hooks/__tests__/useSceneProgress.test.ts` (optional — skipping, logic covered indirectly by Map tests)

- [ ] **Step 1: Implement hook**

Create `src/hooks/useSceneProgress.ts`:
```ts
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
  // island mapping is looked up by caller via scenes.json
  return {
    completed,
    countByIsland: {},  // callers compute this using scenes.json
    totalCompleted: completed.size,
  }
}
```

Note: island-level counts are derived in `Map.tsx` because `scenes.json` already lives there.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSceneProgress.ts
git commit -m "feat(hooks): useSceneProgress — live Dexie query"
```

---

### Task 15: Real progress bars on Map.tsx

**Files:**
- Modify: `src/pages/Map.tsx`

- [ ] **Step 1: Update Map.tsx**

In `src/pages/Map.tsx`:

Add imports near top:
```tsx
import scenes from '@/content/scenes.json'
import { useSceneProgress } from '@/hooks/useSceneProgress'
```

Inside `MapPage()` function, after `const lang = ...`:
```tsx
const { completed } = useSceneProgress()

const completedByIsland = useMemo(() => {
  const map: Record<string, number> = {}
  for (const s of scenes) {
    if (completed.has(s.id)) {
      map[s.island_id] = (map[s.island_id] ?? 0) + 1
    }
  }
  return map
}, [completed])
```

Add `useMemo` to existing React import (replace the existing `import { motion } from 'framer-motion'` block as needed — add `import { useMemo } from 'react'`).

Replace the progress-bar block (currently at lines ~107-118):
```tsx
{/* Progress bar */}
<div className="mt-2 flex items-center gap-2">
  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
    <motion.div
      className="h-full rounded-full"
      style={{ background: island.accent_color }}
      initial={{ width: 0 }}
      animate={{ width: `${((completedByIsland[island.id] ?? 0) / totalScenes) * 100}%` }}
      transition={{ delay: 0.5 + idx * 0.2, duration: 0.8 }}
    />
  </div>
  <span className="text-xs text-white/40 font-medium">
    {completedByIsland[island.id] ?? 0}/{totalScenes}
  </span>
</div>
```

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`. Complete one scene (or manually add a row to IndexedDB via devtools). Return to map.
Expected: the progress bar on that island reflects `1/5`.

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Map.tsx
git commit -m "feat(map): wire progress bars to sceneProgress"
```

---

### Task 16: Scene entry intro — Эхо narrates echo_intro

**Files:**
- Modify: `src/pages/Game.tsx`

- [ ] **Step 1: Wire useEcho into Game**

In `src/pages/Game.tsx`:

Add imports at top:
```tsx
import { useEffect } from 'react'
import { useEcho } from '@/hooks/useEcho'
import echoLines from '@/content/echo_lines.json'
```

Inside `Game()` after `const bg = ...`:
```tsx
const echo = useEcho()
```

After `useMemo` for `scene`, add the intro effect:
```tsx
useEffect(() => {
  const intro = (scene as { echo_intro?: { ru: string; kk: string } }).echo_intro
  if (!intro) return
  echo.setAnchor({ mode: 'scene', x: scene.character.position.x - 20, y: scene.character.position.y + 15 })
  echo.speak({ ru: intro.ru, kk: intro.kk, en: word.en }, { mood: 'talking', duration: 4500 }).then(() => {
    echo.setAnchor({ mode: 'corner' })
    echo.setMood('idle')
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [scene.id])
```

Note: `echo_intro` field is typed externally because scenes.json shape changed in Task 7. Cast inline to avoid re-typing the whole JSON here.

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`. Open the first scene.
Expected: Эхо flies from corner to the animal's left-below, speaks the intro (text bubble + voice), then returns to corner after ~4.5s.

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Game.tsx
git commit -m "feat(game): Echo narrates scene echo_intro on entry"
```

---

### Task 17: Idle timer hint (10s of silence)

**Files:**
- Modify: `src/pages/Game.tsx`

- [ ] **Step 1: Add idle timer**

In `src/pages/Game.tsx`, add state flag and timer effect.

Import `useState` and `useRef` if not already.

Add state below `const echo = useEcho()`:
```tsx
const [micPressed, setMicPressed] = useState(false)
const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const hintShownRef = useRef(false)
```

Add an effect that runs once per scene:
```tsx
useEffect(() => {
  setMicPressed(false)
  hintShownRef.current = false

  idleTimerRef.current = setTimeout(() => {
    if (!micPressed && !hintShownRef.current && gameState === 'idle') {
      const intro = (scene as { echo_intro?: { ru: string; kk: string } }).echo_intro
      if (!intro) return
      hintShownRef.current = true
      echo.setAnchor({ mode: 'scene', x: scene.character.position.x - 20, y: scene.character.position.y + 15 })
      echo.speak({ ru: intro.ru, kk: intro.kk, en: word.en }, { mood: 'talking', duration: 4500 }).then(() => {
        echo.setAnchor({ mode: 'corner' })
      })
    }
  }, 10_000)

  return () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [scene.id])
```

Modify `handleMicPress` to set `micPressed` true at the start:
```tsx
const handleMicPress = useCallback(async () => {
  setMicPressed(true)
  if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
  // ... rest of the existing body unchanged
}, [word, t])
```

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`. Open a scene, don't tap mic for 10s.
Expected: Эхо flies to the scene anchor, repeats intro text + voice, then returns to corner. If you tap mic before 10s → no idle hint fires.

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Game.tsx
git commit -m "feat(game): Echo gives silence hint after 10s idle"
```

---

### Task 18: Retry hint after failed mic attempt

**Files:**
- Modify: `src/pages/Game.tsx`

- [ ] **Step 1: Add fail hint**

Extend `handleMicPress` — in the `else` (fail) branch, after `setErrorMessage(t('try_again'))`:
```tsx
echo.setAnchor({ mode: 'scene', x: scene.character.position.x - 20, y: scene.character.position.y + 15 })
await echo.speak(
  { ru: echoLines.retry_hint.ru, kk: echoLines.retry_hint.kk, en: word.en },
  { mood: 'talking', duration: 3500 }
)
echo.setAnchor({ mode: 'corner' })
```

The `en` field in `speak()` triggers `speakEnglish(word.en)` after the localized sentence — the child hears the correct pronunciation.

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`. Open a scene, press mic and intentionally say something wrong (or stay silent just to trigger fail path).
Expected: red error banner + Эхо comes to scene, speaks "Почти! Послушай:" then pronounces the English word. Returns to corner.

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Game.tsx
git commit -m "feat(game): Echo retry hint after failed mic attempt"
```

---

### Task 19: Success celebration + sceneProgress + level-up

**Files:**
- Modify: `src/pages/Game.tsx`

- [ ] **Step 1: Persist scene progress and celebrate**

In `src/pages/Game.tsx`:

Add imports:
```tsx
import { db } from '@/db/schema'
import { ensureWordProgress } from '@/engine/SpacedRepetition'
```

In `handleMicPress`, inside the `if (isCorrect)` branch, **after** `setGameState('success')`:
```tsx
await db.sceneProgress.put({ sceneId: scene.id, completedAt: new Date() })
await ensureWordProgress(word.id)

echo.setAnchor({ mode: 'scene', x: scene.character.position.x + 15, y: scene.character.position.y - 10 })
echo.setMood('celebrating')
setTimeout(() => {
  echo.setAnchor({ mode: 'corner' })
  echo.setMood('idle')
}, 2500)
```

Note: the level-up banner and flash are driven by `EchoLayout` watching `db.sceneProgress.count()` — no extra wiring needed here. `ensureWordProgress` is called to initialize SR record (existing `logAttempt` also triggers `recordReview` via the telemetry refactor, but `ensureWordProgress` is idempotent — safe to call).

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`. Complete scene 1 (say "fire" for the dragon).
Expected: success text shows, Эхо moves to right-above animal, shakes/jumps (celebrating), then returns to corner. Also: level-up banner "Эхо разгорелся ярче!" appears (because 0→1 crosses dim→ember). On returning to map, island 1 shows 1/5 progress.

Complete 5 more scenes → 6th success should trigger the ember→burning level-up.

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Game.tsx
git commit -m "feat(game): Echo celebration + sceneProgress persistence + level-up"
```

---

### Task 20: WordCard component

**Files:**
- Create: `src/components/WordCard.tsx`

- [ ] **Step 1: Implement WordCard**

Create `src/components/WordCard.tsx`:
```tsx
import { motion } from 'framer-motion'

export type WordStatus = 'locked' | 'seen' | 'learning' | 'mastered'

interface WordCardProps {
  emoji: string
  en: string
  phonetic: string
  translation: string
  status: WordStatus
  successCount: number  // 0..3+
  onClick?: () => void
}

const STATUS_STYLES: Record<WordStatus, {
  border: string
  opacity: number
  glow: string
  badge: string
}> = {
  locked:   { border: '1px solid rgba(255,255,255,0.1)', opacity: 0.35, glow: 'transparent',                 badge: '🔒' },
  seen:     { border: '1px solid rgba(255,255,255,0.2)', opacity: 1,    glow: 'transparent',                 badge: '✨' },
  learning: { border: '1.5px solid rgba(251,191,36,0.5)', opacity: 1,   glow: 'rgba(251,191,36,0.2)',        badge: '⭐' },
  mastered: { border: '2px solid rgba(251,191,36,0.9)',  opacity: 1,    glow: 'rgba(251,191,36,0.5)',        badge: '🌟' },
}

export function WordCard({
  emoji,
  en,
  phonetic,
  translation,
  status,
  successCount,
  onClick,
}: WordCardProps) {
  const s = STATUS_STYLES[status]
  const dotsFilled = status === 'mastered' ? 4 : Math.min(successCount, 3)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="relative rounded-2xl p-3 flex flex-col items-center text-center cursor-pointer"
      style={{
        background: 'rgba(15,10,40,0.6)',
        backdropFilter: 'blur(8px)',
        border: s.border,
        boxShadow: `0 0 20px ${s.glow}`,
        opacity: s.opacity,
        minHeight: 160,
      }}
      whileHover={status !== 'locked' ? { scale: 1.04 } : undefined}
      whileTap={status !== 'locked' ? { scale: 0.96 } : undefined}
      animate={status === 'mastered' ? { boxShadow: [
        `0 0 20px ${s.glow}`,
        `0 0 30px ${s.glow}`,
        `0 0 20px ${s.glow}`,
      ]} : undefined}
      transition={status === 'mastered' ? { repeat: Infinity, duration: 2 } : undefined}
    >
      <div className="absolute top-1 right-1 text-xs">{s.badge}</div>
      <span className="text-3xl mb-1">{emoji}</span>
      <span className="text-white font-bold text-lg uppercase tracking-wide">{en}</span>
      <span className="text-purple-300/60 text-xs">{phonetic}</span>
      <span className="text-purple-300/40 text-xs mt-0.5">{translation}</span>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: i < dotsFilled ? '#fbbf24' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    </motion.button>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/WordCard.tsx
git commit -m "feat(ui): WordCard component with status gradations"
```

---

### Task 21: Spellbook page — grid + status derivation

**Files:**
- Modify: `src/pages/Spellbook.tsx` (replace stub from Task 13)

- [ ] **Step 1: Implement Spellbook page**

Replace entire `src/pages/Spellbook.tsx`:
```tsx
import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import words from '@/content/words.json'
import scenes from '@/content/scenes.json'
import islands from '@/content/islands.json'
import { db } from '@/db/schema'
import { WordCard, type WordStatus } from '@/components/WordCard'
import { useSceneProgress } from '@/hooks/useSceneProgress'
import { speakEnglish } from '@/engine/SpeechEngine'

type Topic = 'magic_elements' | 'animals' | 'sky'

const TOPICS: { id: Topic; labelKey: string; islandId: string }[] = [
  { id: 'magic_elements', labelKey: 'spellbook_tab_magic_elements', islandId: 'crystal_caves' },
  { id: 'animals',        labelKey: 'spellbook_tab_animals',        islandId: 'enchanted_forest' },
  { id: 'sky',            labelKey: 'spellbook_tab_sky',            islandId: 'star_beach' },
]

export function Spellbook() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language as 'ru' | 'kk'
  const { completed } = useSceneProgress()

  const wordProgress = useLiveQuery(() => db.wordProgress.toArray(), [], [])
  const wpMap = useMemo(() => {
    const m = new Map<string, (typeof wordProgress)[number]>()
    for (const wp of wordProgress ?? []) m.set(wp.wordId, wp)
    return m
  }, [wordProgress])

  const [activeTab, setActiveTab] = useState<Topic>('magic_elements')
  const [selected, setSelected] = useState<string | null>(null)

  const totalLearned = (wordProgress ?? []).filter((w) => w.learned).length
  const activeIsland = islands.find((i) => i.id === TOPICS.find((tp) => tp.id === activeTab)!.islandId)!
  const topicWords = words.filter((w) => w.topic === activeTab)

  function statusFor(wordId: string, sceneId: string): WordStatus {
    const sceneDone = completed.has(sceneId)
    if (!sceneDone) return 'locked'
    const wp = wpMap.get(wordId)
    if (!wp || wp.successCount === 0) return 'seen'
    if (wp.learned) return 'mastered'
    return 'learning'
  }

  const selectedWord = selected ? words.find((w) => w.id === selected) : null
  const selectedScene = selectedWord ? scenes.find((s) => s.trigger_word_id === selectedWord.id) : null

  return (
    <div className="relative w-full min-h-full overflow-y-auto overflow-x-hidden select-none">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(180deg, #0a0618 0%, #0f1a3d 25%, #1a2d5c 50%, #1e3a5f 100%)',
        }}
      />

      <div className="px-5 pt-14 pb-20">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/80 bg-black/30"
        >
          ← {t('nav_back_to_map')}
        </button>

        {/* Title + summary */}
        <h1 className="text-center text-2xl font-bold text-white mb-1">{t('spellbook_title')}</h1>
        <p className="text-center text-purple-300/60 text-sm mb-6">
          {t('spellbook_progress', { learned: totalLearned, total: words.length })}
        </p>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {TOPICS.map((tp) => {
            const island = islands.find((i) => i.id === tp.islandId)!
            const active = activeTab === tp.id
            return (
              <button
                key={tp.id}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  color: active ? 'white' : 'rgba(255,255,255,0.5)',
                  background: active ? `${island.accent_color}33` : 'transparent',
                  border: active ? `1px solid ${island.accent_color}88` : '1px solid rgba(255,255,255,0.1)',
                }}
                onClick={() => setActiveTab(tp.id)}
              >
                {t(tp.labelKey)}
              </button>
            )
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {topicWords.map((w) => {
            const scene = scenes.find((s) => s.trigger_word_id === w.id)!
            const st = statusFor(w.id, scene.id)
            return (
              <WordCard
                key={w.id}
                emoji={scene.hint_emoji}
                en={w.en}
                phonetic={w.phonetic}
                translation={w[lang] ?? w.ru}
                status={st}
                successCount={wpMap.get(w.id)?.successCount ?? 0}
                onClick={() => setSelected(w.id)}
              />
            )
          })}
        </div>
      </div>

      {/* Detail sheet */}
      {selectedWord && selectedScene && (
        <WordDetailSheet
          word={selectedWord}
          scene={selectedScene}
          status={statusFor(selectedWord.id, selectedScene.id)}
          accentColor={activeIsland.accent_color}
          lang={lang}
          onClose={() => setSelected(null)}
          onListen={() => speakEnglish(selectedWord.en)}
          onReturnToScene={() => navigate(`/island/${selectedScene.island_id}/scene/${selectedScene.id}`)}
          lockedLabel={t('locked_tooltip_prefix')}
          listenLabel={t('spellbook_listen')}
          returnLabel={t('spellbook_return_to_scene')}
        />
      )}
    </div>
  )
}

interface DetailSheetProps {
  word: typeof words[number]
  scene: typeof scenes[number]
  status: WordStatus
  accentColor: string
  lang: 'ru' | 'kk'
  onClose: () => void
  onListen: () => void
  onReturnToScene: () => void
  lockedLabel: string
  listenLabel: string
  returnLabel: string
}

function WordDetailSheet({
  word, status, accentColor, lang,
  onClose, onListen, onReturnToScene,
  lockedLabel, listenLabel, returnLabel,
}: DetailSheetProps) {
  const locked = status === 'locked'
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(15,10,40,0.95), rgba(30,20,80,0.95))',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${accentColor}55`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {locked ? (
          <p className="text-white/60 text-sm">{lockedLabel} 💎</p>
        ) : (
          <>
            <p className="text-white text-4xl font-bold uppercase">{word.en}</p>
            <p className="text-purple-300/70 text-sm mt-1">{word.phonetic}</p>
            <p className="text-purple-300/50 text-sm mt-0.5">{word[lang] ?? word.ru}</p>
            <div className="flex justify-center gap-3 mt-5">
              <button
                onClick={onListen}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: `${accentColor}44`, border: `1px solid ${accentColor}88` }}
              >
                🔊 {listenLabel}
              </button>
              <button
                onClick={onReturnToScene}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: `${accentColor}44`, border: `1px solid ${accentColor}88` }}
              >
                ↩ {returnLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`. Navigate to `/spellbook` via Эхо menu.
Expected: title + "0 из 15 выучено"; three tabs; active tab shows 5 cards, all locked (🔒) because no scenes completed. Tap a locked card → bottom sheet shows "Сначала найди это на острове 💎".

Complete scene 1, return to spellbook, first tab → dragon card now "seen" (✨) with 1 dot. Tap → detail with "Послушать" + "Вернуться на остров" buttons.

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Spellbook.tsx
git commit -m "feat(page): Spellbook — tabbed grid with status gradations + detail sheet"
```

---

### Task 22: Spellbook — "Pronounce" inline mini-session

**Files:**
- Modify: `src/pages/Spellbook.tsx`

**Note:** the "Произнести" button (mini one-card practice) is intentionally deferred. Adding it here would create per-card SR side effects from the spellbook, which overlaps with Talk mode. Instead we route the user to Talk mode for any pronunciation practice. Update the detail sheet to offer "К тренировке" instead when the word is due for review.

- [ ] **Step 1: Simplify detail sheet — replace "Произнести" with "Потренироваться"**

Spec section 6.4 lists a "Произнести" per-card mini-session. For v1 we consolidate that into Talk mode for code simplicity and consistent SR semantics. Per-card mini-session can be added later.

This task is a **no-op** intentionally: the spellbook as built in Task 21 already lacks a "Произнести" button. Document this decision:

- [ ] **Step 2: Commit a doc note**

Add a line in `docs/superpowers/specs/2026-04-18-echo-companion-design.md` under section 6.4, after "Произнести" list item. Insert:
```
> **Implementation deviation (v1):** per-card mini-session deferred. "Послушать" (playback) and "Вернуться на остров" (navigate back to scene) remain. Practice is consolidated in `/talk`.
```

Run:
```bash
git add docs/superpowers/specs/2026-04-18-echo-companion-design.md
git commit -m "docs(spec): note spellbook per-card mini-session deferred to Talk"
```

---

### Task 23: Talk page — shell + session bootstrap + empty state

**Files:**
- Modify: `src/pages/Talk.tsx` (replace stub from Task 13)

- [ ] **Step 1: Implement Talk shell**

Replace entire `src/pages/Talk.tsx`:
```tsx
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import words from '@/content/words.json'
import scenes from '@/content/scenes.json'
import echoLines from '@/content/echo_lines.json'
import { getWordsForReview, recordReview } from '@/engine/SpacedRepetition'
import { useEcho } from '@/hooks/useEcho'
import { TalkCard } from '@/components/TalkCard'

type SessionState =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'active'; queue: string[]; index: number; completedIds: string[] }
  | { phase: 'done'; completedIds: string[] }

const SESSION_SIZE = 5

export function Talk() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language as 'ru' | 'kk') ?? 'ru'
  const navigate = useNavigate()
  const echo = useEcho()
  const [state, setState] = useState<SessionState>({ phase: 'loading' })

  useEffect(() => {
    (async () => {
      const due = await getWordsForReview()
      if (due.length === 0) {
        setState({ phase: 'empty' })
        echo.setMood('celebrating')
        echo.speak(echoLines.talk_session_empty)
        return
      }
      const shuffled = [...due].sort(() => Math.random() - 0.5).slice(0, SESSION_SIZE)
      setState({ phase: 'active', queue: shuffled, index: 0, completedIds: [] })
      echo.setMood('talking')
      echo.speak(echoLines.talk_session_start)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCardResult(wordId: string, success: boolean) {
    await recordReview(wordId, success)
    if (state.phase !== 'active') return
    const nextCompleted = [...state.completedIds, wordId]
    const nextIndex = state.index + 1
    if (nextIndex >= state.queue.length) {
      setState({ phase: 'done', completedIds: nextCompleted })
      echo.setMood('celebrating')
      echo.speak({
        ru: echoLines.talk_session_done.ru.replace('{{n}}', String(nextCompleted.length)),
        kk: echoLines.talk_session_done.kk.replace('{{n}}', String(nextCompleted.length)),
      })
    } else {
      setState({ ...state, index: nextIndex, completedIds: nextCompleted })
      echo.speak(echoLines.talk_next_word)
    }
  }

  const currentWord = useMemo(() => {
    if (state.phase !== 'active') return null
    const id = state.queue[state.index]
    const w = words.find((w) => w.id === id)!
    const s = scenes.find((s) => s.trigger_word_id === id)!
    return { word: w, emoji: s.hint_emoji }
  }, [state])

  return (
    <div className="relative w-full min-h-full select-none">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(180deg, #0a0618 0%, #0f1a3d 40%, #1a2d5c 100%)',
        }}
      />

      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg text-sm text-white/50 bg-black/30"
      >
        ← {t('nav_back_to_map')}
      </button>

      <div className="pt-36 px-5 pb-24 flex flex-col items-center gap-6">
        {state.phase === 'loading' && <p className="text-white/40">...</p>}

        {state.phase === 'empty' && (
          <>
            <p className="text-white text-lg font-semibold text-center max-w-xs">
              {echoLines.talk_session_empty[lang]}
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-3 rounded-2xl text-white font-bold bg-purple-600"
            >
              {t('talk_session_done_button_map')}
            </button>
          </>
        )}

        {state.phase === 'active' && currentWord && (
          <>
            <p className="text-purple-300/50 text-sm">
              {state.index + 1} / {state.queue.length}
            </p>
            <TalkCard
              word={currentWord.word}
              emoji={currentWord.emoji}
              onResult={(success) => handleCardResult(currentWord.word.id, success)}
            />
          </>
        )}

        {state.phase === 'done' && (
          <>
            <p className="text-white text-xl font-bold text-center">
              {echoLines.talk_session_done[lang].replace('{{n}}', String(state.completedIds.length))}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-2xl text-white font-bold bg-purple-600"
              >
                {t('talk_session_done_button_again')}
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-2xl text-white font-bold bg-slate-700"
              >
                {t('talk_session_done_button_map')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build (TalkCard missing)**

Run: `npm run build`
Expected: FAIL — `@/components/TalkCard` does not exist yet. Task 24 adds it.

Leave file in working tree; commit after Task 24.

---

### Task 24: TalkCard component + card loop

**Files:**
- Create: `src/components/TalkCard.tsx`

- [ ] **Step 1: Implement TalkCard**

Create `src/components/TalkCard.tsx`:
```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { MicButton } from '@/components/MicButton'
import {
  recognizeSpeech,
  checkWord,
  isSpeechSupported,
  speakEnglish,
} from '@/engine/SpeechEngine'
import echoLines from '@/content/echo_lines.json'
import wordsList from '@/content/words.json'

type Word = (typeof wordsList)[number]
const MAX_ATTEMPTS = 3

interface TalkCardProps {
  word: Word
  emoji: string
  onResult: (success: boolean) => void
}

export function TalkCard({ word, emoji, onResult }: TalkCardProps) {
  const { i18n } = useTranslation()
  const { t } = useTranslation()
  const lang = (i18n.language as 'ru' | 'kk') ?? 'ru'
  const [listening, setListening] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'retry'>('idle')

  async function handleMic() {
    if (!isSpeechSupported()) return
    setListening(true)
    setFeedback('idle')
    try {
      const recognized = await recognizeSpeech()
      const ok = checkWord(recognized, word.en)
      if (ok) {
        setFeedback('success')
        setTimeout(() => onResult(true), 1000)
      } else {
        const nextAttempts = attempts + 1
        setAttempts(nextAttempts)
        setFeedback('retry')
        await speakEnglish(word.en)
        if (nextAttempts >= MAX_ATTEMPTS) {
          setTimeout(() => onResult(false), 800)
        }
      }
    } catch {
      setFeedback('retry')
    } finally {
      setListening(false)
    }
  }

  return (
    <motion.div
      key={word.id}
      className="flex flex-col items-center gap-4 w-full max-w-xs"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
    >
      <div
        className="rounded-3xl px-6 py-6 w-full text-center"
        style={{
          background: 'rgba(15,10,40,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(167,139,250,0.35)',
          boxShadow: feedback === 'success'
            ? '0 0 40px rgba(251,191,36,0.5)'
            : '0 0 25px rgba(167,139,250,0.15)',
        }}
      >
        <div className="text-5xl">{emoji}</div>
        <div className="text-white text-4xl font-bold uppercase tracking-wide mt-2">{word.en}</div>
        <div className="text-purple-300/60 text-sm mt-1">{word.phonetic}</div>

        <AnimatePresence>
          {hintVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-purple-300/80 text-sm mt-2"
            >
              {word[lang] ?? word.ru}
            </motion.div>
          )}
        </AnimatePresence>

        {!hintVisible && (
          <button
            onClick={() => setHintVisible(true)}
            className="text-purple-300/50 text-xs mt-2 underline"
          >
            {t('talk_hint_show')}
          </button>
        )}
      </div>

      <MicButton state={listening ? 'listening' : 'idle'} onPress={handleMic} />

      {feedback === 'retry' && attempts < MAX_ATTEMPTS && (
        <p className="text-orange-300 text-sm">
          {echoLines.talk_try_again[lang]}
        </p>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS (Task 23's Talk.tsx now compiles too).

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`. Complete at least one scene first to create a `wordProgress` entry. Navigate to `/talk`.
Expected:
- If the word's `nextReview` is in the past → session starts with that word on the card.
- Tap mic, say the word correctly → green glow, auto-advance.
- Say it wrong 3 times → auto-advance, SR schedule delayed by 10 min.
- After all cards → summary screen with "Ещё раз" and "К карте".

If no words due (just completed a scene — it's scheduled 1 day out) — trigger an empty state by manually setting `nextReview` to a past date in devtools.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Talk.tsx src/components/TalkCard.tsx
git commit -m "feat(page): Talk mode — flashcard session with SR + MicButton"
```

---

### Task 25: First-visit intro flows

**Files:**
- Modify: `src/components/EchoLayout.tsx`
- Modify: `src/pages/Spellbook.tsx`

- [ ] **Step 1: Add first-greeting on first app load**

In `src/components/EchoLayout.tsx`, add an effect after the power-levelup effect:
```tsx
// First-visit greeting
useEffect(() => {
  let cancelled = false
  ;(async () => {
    const flag = await db.appState.get('echo_first_greeting_seen')
    if (flag?.value === true || cancelled) return
    await new Promise((r) => setTimeout(r, 1500))  // settle after route animation
    if (cancelled) return
    await speak(echoLines.first_greeting, { mood: 'talking', duration: 7000 })
    await db.appState.put({
      key: 'echo_first_greeting_seen',
      value: true,
      updatedAt: new Date(),
    })
  })()
  return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

Ensure `echoLines` is imported at the top of `EchoLayout.tsx` (it already is from Task 12).

- [ ] **Step 2: Add spellbook intro on first open**

In `src/pages/Spellbook.tsx`, add an effect inside `Spellbook()`:
```tsx
useEffect(() => {
  let cancelled = false
  ;(async () => {
    const flag = await db.appState.get('spellbook_intro_seen')
    if (flag?.value === true || cancelled) return
    echo.speak(echoLinesJson.spellbook_intro, { mood: 'talking', duration: 5000 })
    await db.appState.put({
      key: 'spellbook_intro_seen',
      value: true,
      updatedAt: new Date(),
    })
  })()
  return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

Also add to imports in `Spellbook.tsx`:
```tsx
import { useEcho } from '@/hooks/useEcho'
import { useEffect } from 'react'
import echoLinesJson from '@/content/echo_lines.json'
```

And declare `const echo = useEcho()` inside `Spellbook()`.

- [ ] **Step 3: Manual smoke test**

Open devtools → Application → IndexedDB → `EchoIslandDB` → `appState` — clear or delete. Refresh.
Expected:
- App loads → Эхо says `first_greeting` text + voice after ~1.5s. Reload → no repeat.
- Open `/spellbook` → Эхо says `spellbook_intro`. Reopen → no repeat.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/EchoLayout.tsx src/pages/Spellbook.tsx
git commit -m "feat: first-visit greetings for Echo and Spellbook"
```

---

### Task 26: Full-flow manual verification

**Purpose:** end-to-end smoke covering spec success criteria. No code changes.

- [ ] **Step 1: Clear IndexedDB**

Open the app in a private/incognito window or clear the `EchoIslandDB` via devtools.

- [ ] **Step 2: Run through the verification checklist**

Run: `npm run dev`, open `http://localhost:5173/`.

For each of the following, verify the expected behavior. Check off each item:

- [ ] App loads → dim Эхо in corner, says `first_greeting` (text + voice).
- [ ] Tap Эхо → menu opens with 💬 Поговорить and 📖 Книга заклинаний.
- [ ] Open scene 1 (dragon_frozen) → Эхо flies to animal, speaks `echo_intro` + says "fire" in English.
- [ ] Wait 10s without tapping mic → Эхо re-plays intro (once only).
- [ ] Tap mic, say nothing or say "cat" → error banner + Эхо comes to scene, says "Почти! Послушай:" + "fire" in English.
- [ ] Say "fire" correctly → success animation + Эхо celebrates above animal + level-up banner "Эхо разгорелся ярче!" + "Далее" button.
- [ ] Return to map → island 1 shows 1/5 progress bar filled.
- [ ] Open `/spellbook` → `first_greeting` flag already set, so no repeat. `spellbook_intro` fires on first open.
- [ ] Spellbook shows Магия tab active, fire card as 1 dot ✨, others 🔒.
- [ ] Tap fire card → detail sheet with "Послушать" (plays "fire") + "Вернуться на остров".
- [ ] Complete 4 more scenes (5 total) → Эхо in `ember` tier still; sixth scene completion triggers ember→burning banner.
- [ ] Open `/talk` — if no words are due (all scheduled 1+ day out) → "Всё выучено, приходи позже" + Эхо celebrating.
- [ ] Manually set one wordProgress.nextReview to a past date in devtools → reopen /talk → card appears; say the word right 2 more times across sessions → becomes mastered 🌟 in spellbook.
- [ ] Reload page — no greeting repeats; sceneProgress persists.
- [ ] Toggle ru/kk — all UI strings translate; Эхо speaks in the current lang.

- [ ] **Step 3: Note any defects**

If any step fails, open a follow-up task in this plan as a new numbered section. If everything passes, commit a note:

```bash
git commit --allow-empty -m "chore: Echo companion v1 verified end-to-end"
```

---

## Self-Review Checklist (plan author — already run)

1. **Spec coverage:** every spec section (narrative, visual, persistence, scene behavior, talk, spellbook, data, content, open gates) has corresponding tasks.
2. **Placeholder scan:** no TODOs/TBDs in code steps. Task 9 documents a decision gate with clear fallback rules. Task 22 explicitly deviates from spec section 6.4 and updates the spec — documented, not deferred silently.
3. **Type consistency:** `Power`, `Mood`, `Anchor`, `SpeakInput`, `EchoContextValue`, `WordStatus` are each defined in exactly one place and reused. `scheduleNext`/`ensureWordProgress`/`recordReview`/`getWordsForReview`/`isWordLearned` names stay consistent.

## Out of Scope (mirrors spec section 9)

- Full SM-2 with ease-factor and self-grading.
- Customization of Эхо (name, color, accessories).
- Sound effects beyond Web Speech Synthesis.
- Reset-progress controls.
- Parent-facing statistics.
- External TTS services.
- Per-card spellbook mini-session (deferred to post-v1, see Task 22).
