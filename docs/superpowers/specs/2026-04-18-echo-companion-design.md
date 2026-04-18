# Echo Companion — Design Spec

**Date:** 2026-04-18
**Status:** Approved, ready for implementation plan
**Scope:** Add a persistent companion chibi ("Эхо") who hints when the child is stuck, lets them practice learned words, provides a spellbook of vocabulary, and narrates scene objectives.

---

## 1. Narrative & Identity

Эхо is the spirit of the islands. At the start he is dim and sad because the animals are in distress — his light has faded. Each rescued animal returns some of his power. By the time the child finishes all 15 scenes, Эхо is a radiant golden flame-sprite.

- **Name:** Эхо (works in both RU and KK; echoes the product name).
- **Persona:** gentle, encouraging, slightly playful. Speaks in short sentences. Never shames failure.
- **Form:** small chibi fire/light spirit — no limbs, expressive eyes, flame body. Non-animal, non-gendered, not tied to any existing scene character.

---

## 2. Visual Design

### 2.1 Asset source

Lottie animations via `lottie-react`. Primary search on LottieFiles (CC-BY / free) for terms like *fire sprite*, *magical flame*, *spirit creature*, *cute mascot*. If a full 4-state set matching the style isn't found:

1. Use one `idle.json` and derive `listening/talking/celebrating` via Framer Motion transforms (scale, rotate, bounce).
2. Fallback: commissioned Lottie, or hand-authored SVG at higher fidelity than existing `Character.tsx` chibis (gradients, soft shadows).

Decision on full-set vs. single-idle is the first implementation gate.

### 2.2 Two state axes

| Axis | Values | Driven by |
|---|---|---|
| **Power** (changes rarely) | `dim` (0/15) → `ember` (1-5) → `burning` (6-10) → `radiant` (11-15) | `sceneProgress` count in Dexie |
| **Mood** (changes often) | `idle` • `listening` • `talking` • `celebrating` | Page logic via EchoContext |

Combinations are not 16 separate files. Power is expressed via **CSS/Framer Motion** (tint, scale, glow). Mood is the Lottie animation itself. Target: 4 Lottie files (one per mood).

### 2.3 Power visuals

| Power | Tint | Size | Glow |
|---|---|---|---|
| `dim` | `#64748b` (slate) | 0.7× | none |
| `ember` | `#fb923c` (warm orange) | 1.0× | weak |
| `burning` | `#f97316` (bright orange) | 1.15× | medium, animated |
| `radiant` | `#fbbf24` (gold) | 1.3× | pulsing, strong |

### 2.4 Level-up transitions

When `sceneProgress` count crosses a threshold (0→1 = `dim → ember`, 5→6 = `ember → burning`, 10→11 = `burning → radiant`), after the scene's success celebration:
- 1.5s flash animation: Эхо grows, color shifts to next tier, brief sparkle particle burst.
- Localized banner keyed on the new tier — see `echo_lines.level_up.{ember|burning|radiant}` (section 7.2).
- New power persists going forward.

---

## 3. Persistent Presence & Architecture

### 3.1 Layout wrapper

```tsx
// App.tsx
<BrowserRouter>
  <EchoLayout>           // new
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/island/:islandId/scene/:sceneId" element={<Game />} />
      <Route path="/talk" element={<Talk />} />           // new
      <Route path="/spellbook" element={<Spellbook />} /> // new
    </Routes>
    <EchoCompanion />    // always visible
  </EchoLayout>
</BrowserRouter>
```

`EchoCompanion` is rendered `position: fixed, z-index: 50`. Layer itself is `pointer-events: none`; the chibi and bubble are `pointer-events: auto`.

### 3.2 Default position & tap menu

- Anchor: bottom-right corner, `bottom: 16px, right: 16px`, ~80px square (power-dependent).
- Tap on Эхо → expands into a speech-bubble menu:
  - 💬 Поговорить → navigates to `/talk`
  - 📖 Книга заклинаний → navigates to `/spellbook`
  - ✕ closes
- On Game, Talk, and Spellbook pages the tap menu is suppressed — on Game/Talk because Эхо has a contextual role (see sections 4 and 5), on Spellbook because both menu options are redundant (the user is already viewing the spellbook). Direct tap on those pages either does nothing or re-triggers the current hint.

### 3.3 EchoContext

```ts
interface EchoContextValue {
  power: 'dim' | 'ember' | 'burning' | 'radiant'      // derived from Dexie
  mood: 'idle' | 'listening' | 'talking' | 'celebrating'
  bubble: { text: string; visible: boolean } | null
  anchor: { mode: 'corner' } | { mode: 'scene'; x: number; y: number } | { mode: 'center-top' }
  speak(text: { ru: string; kk: string; en?: string }, opts?: { mood?: Mood; duration?: number }): Promise<void>
  setMood(m: Mood): void
  setAnchor(a: Anchor): void
}
```

`speak()` does three things atomically:
1. Shows the text bubble near Эхо (auto-hides after N seconds or after speech ends).
2. Calls Web Speech Synthesis — `lang="en-US"` for English words (when `text.en` is provided), `lang="ru-RU"` / `"kk-KZ"` for instruction text based on current i18n language.
3. Sets `mood: 'talking'` during utterance, reverts to previous mood on `onend`.

### 3.4 Progress → power derivation

New Dexie table:
```ts
sceneProgress: EntityTable<{ sceneId: string; completedAt: Date }, 'sceneId'>
```

Hook `useEchoPower()` reads `db.sceneProgress.count()` and returns a `Power` value. Same count drives the map's per-island progress bars (currently hardcoded to `0/5` in `Map.tsx:107-117`).

Thresholds in `engine/EchoProgress.ts`:
```ts
function computePower(scenesCompleted: number): Power {
  if (scenesCompleted === 0) return 'dim'
  if (scenesCompleted <= 5) return 'ember'
  if (scenesCompleted <= 10) return 'burning'
  return 'radiant'
}
```

### 3.5 Speech synthesis policy

- Extend `engine/SpeechEngine.ts` with:
  ```ts
  export function speakEnglish(text: string): Promise<void>       // lang=en-US
  export function speakLocalized(text: string, lang: 'ru' | 'kk'): Promise<void>
  export function isSpeechSynthesisSupported(): boolean
  ```
- iOS Safari requires user gesture for first utterance. Solution: on first tap of Эхо **or** first mic press, prime an empty utterance. Track `primed` flag in-memory (not Dexie — per session is fine).
- If unsupported → functions resolve immediately, bubbles still display as text-only. No error surfaced.

---

## 4. In-Scene Behavior (Game page)

### 4.1 Scene entry

On scene load, Эхо flies from corner to a scene anchor (left-below the animal), `mood: 'talking'`, speaks the scene's `echo_intro` localized text. Then returns to corner, `mood: 'idle'`.

New field in `content/scenes.json` for each of 15 scenes:
```json
"echo_intro": {
  "ru": "Дракончику холодно! Скажи \"fire\" 🔥",
  "kk": "Айдаһарға суық! \"fire\" деп айт 🔥"
}
```
English word in `echo_intro` is embedded literally in the RU/KK string — pronounced with `en-US` voice via `speak({ ru, kk, en: word.en })`.

### 4.2 Idle timer (hint on silence)

On Game mount:
```ts
const timer = setTimeout(() => {
  if (gameState === 'idle' && !micTappedYet) {
    triggerHint()
  }
}, 10_000)
```

`triggerHint` re-plays `echo_intro`. Timer fires **at most once per scene** — not repeated if ignored. Cleared on unmount, on success, or on first mic press.

### 4.3 Retry hint (after fail)

When `gameState === 'fail'`, Эхо flies to scene anchor, `mood: 'talking'`:
```ts
await speak({
  ru: echoLines.retry_hint.ru,  // "Почти! Послушай:"
  kk: echoLines.retry_hint.kk,
})
await speakEnglish(word.en)     // same voice pronounces the target word
```
Returns to corner. Normal `setTimeout(2000)` fail→idle flow in `Game.tsx:67-70` remains.

### 4.4 Success celebration

On `gameState === 'success'`:
- Эхо flies to `{ x: character.x + 15, y: character.y - 10 }` (right-above animal, doesn't clash with MagicAnimation).
- `mood: 'celebrating'`, bounces in sync with the 1.5s magic animation.
- Side effects:
  ```ts
  await db.sceneProgress.put({ sceneId: scene.id, completedAt: new Date() })
  await ensureWordProgress(word.id)
  ```
- If this completion crosses a power threshold → play level-up flash (section 2.4) before returning to corner.

### 4.5 Scene anchors

| Mood context | Anchor |
|---|---|
| `idle` after intro | bottom-right corner |
| `talking` hint | `{ x: character.x - 20, y: character.y + 15 }` (left-below animal) |
| `celebrating` | `{ x: character.x + 15, y: character.y - 10 }` (right-above animal) |

Positions interpolated via Framer Motion `animate`/`layout`.

---

## 5. Talk Mode (/talk)

### 5.1 Page shell

- New route `/talk` in `App.tsx`.
- Full-screen page, same ocean gradient as Map but dimmer (fewer stars, slower animations — training, not adventure).
- Эхо anchored to `center-top`, size ~160px (larger than usual), mood driven by session state.
- Back button to Map at top-left.

### 5.2 Session start

On `/talk` mount:
1. Call `getWordsForReview()` from `engine/SpacedRepetition.ts` — returns wordIds where `nextReview <= now`.
2. **Empty list:** show "Всё выучено, приходи позже!" screen + big "К карте" button. Эхо `celebrating`. End.
3. **Non-empty:** sample up to 5 words (shuffle), start card loop.

### 5.3 Card loop (per word)

1. Эхо `talking`, says `echoLines.talk_session_start` on first card, otherwise a short prompt like "Следующее слово…".
2. Card renders:
   - Large emoji (`scenes.json.hint_emoji` for the word's scene)
   - `word.en` (large, bold)
   - `word.phonetic` (small, muted)
   - "Подсказка" button (collapsed by default — reveals `word[lang]` translation)
3. Эхо `listening`, `<MicButton>` at bottom (reuse existing component).
4. On mic press: `recognizeSpeech()` → `checkWord(recognized, word.en)`:
   - **Success:** Эхо `celebrating`, card flies away, call `recordReview(wordId, success: true)`. Advance.
   - **Fail:** Эхо `talking`, `await speakEnglish(word.en)` (correct pronunciation), say "Попробуй ещё раз". Retry up to **3 attempts per card**. After 3rd failure: `recordReview(wordId, success: false)`, advance anyway (don't frustrate the child).

### 5.4 Session end

After 5 cards (or fewer if due pool was smaller):
- Summary card: "Ты повторил N слов! ✨"
- Эхо `celebrating`. If any word during the session transitioned to `learned: true`, trigger a mini level-up on the word (not on Эхо's power — that's tied to scenes only).
- Buttons: "Ещё раз" (only if more due words remain) / "К карте".

### 5.5 SR logic (SM-2 lite in `engine/SpacedRepetition.ts`)

Replace the stub with:
```ts
export async function recordReview(wordId: string, success: boolean): Promise<void>
export async function ensureWordProgress(wordId: string): Promise<WordProgress>

function scheduleNext(progress: WordProgress, success: boolean): WordProgress {
  const now = new Date()
  if (!success) {
    return {
      ...progress,
      lastReviewed: now,
      nextReview: addMinutes(now, 10),
      // successCount NOT reset — just delayed. Avoids demoralizing losses.
    }
  }
  const intervals = [1, 3, 7, 14, 30]  // days
  const nextIntervalDays = intervals[Math.min(progress.successCount, intervals.length - 1)]
  const nextCount = progress.successCount + 1
  return {
    ...progress,
    lastReviewed: now,
    successCount: nextCount,
    nextReview: addDays(now, nextIntervalDays),
    learned: nextCount >= 3,
  }
}
```

No ease-factor, no "easy/medium/hard" grading — kids can't self-assess. Three consecutive successes (with gaps) = `learned`.

### 5.6 First-success record creation

`ensureWordProgress(wordId)` creates `{ firstSeen: now, lastReviewed: now, successCount: 1, nextReview: addDays(now, 1), learned: false }` if no record exists — called on **scene success** (not on talk-mode success, since talk can only show words that are already in `wordProgress`).

---

## 6. Spellbook (/spellbook)

### 6.1 Page shell

- New route `/spellbook` in `App.tsx`.
- Night-gradient background matching Map.
- Эхо in corner, default menu suppressed (tap does nothing on this page).
- Top: title "Книга заклинаний" (RU) / "Сиқыр кітабы" (KK) + summary "N из 15 выучено".
- Three tabs by `word.topic`: **Магия** (`magic_elements`), **Животные** (`animals`), **Небо** (`sky`).
- Active tab tinted with island `accent_color` (`crystal_caves` → violet, `enchanted_forest` → green, `star_beach` → cyan).

### 6.2 Card grid

3×2 mobile grid per tab (5 words per topic — one row of 3, one row of 2 with the last slot empty or centered).

Card layout:
```
┌──────────────┐
│     🔥       │  hint_emoji
│    FIRE      │  word.en (dimmed if locked)
│   /faɪər/    │  phonetic
│   огонь      │  word[lang]
│   ● ● ● ○    │  gradation dots (0-4)
└──────────────┘
```

### 6.3 Word status

| Status | Condition | Visual |
|---|---|---|
| 🔒 `locked` | No `sceneProgress` for the word's scene | Grayscale card, word/emoji faded, 0 dots |
| ✨ `seen` | Scene completed; `wordProgress.successCount < 1` | Normal colors, 1 dot |
| ⭐ `learning` | `wordProgress.successCount` 1-2 | Thin golden border, 2-3 dots |
| 🌟 `mastered` | `wordProgress.learned === true` | Thick golden border, pulsing glow, 4 dots |

Status derivation:
```ts
function getStatus(wordId: string, sceneId: string, wp?: WordProgress, sp?: SceneProgress): Status {
  if (!sp) return 'locked'
  if (!wp || wp.successCount === 0) return 'seen'
  if (wp.learned) return 'mastered'
  return 'learning'
}
```

### 6.4 Card tap behavior

- **Locked:** small tooltip near card "Сначала найди это на острове 💎" (island emoji from `islands.json`). No navigation — spoiler-free.
- **Not locked:** opens bottom-sheet modal:
  - Word (large) + phonetic + translation
  - 🔊 "Послушать" → `speakEnglish(word.en)`
  - 🎤 "Произнести" → one-card talk session; result feeds into SR
  - (If scene still accessible) "Вернуться на остров" → `navigate(/island/${islandId}/scene/${sceneId})`

### 6.5 First-visit intro

On first open of `/spellbook` (flag `spellbook_intro_seen` in `appState` table), Эхо speaks:
```json
"spellbook_intro": {
  "ru": "Это твои слова-заклинания. Чем ярче слово, тем крепче ты его помнишь.",
  "kk": "Бұл сенің сиқырлы сөздерің. Сөз неғұрлым жарқырақ болса, соғұрлым берік есінде."
}
```

---

## 7. Data, Content, and i18n

### 7.1 Dexie v2 migration

```ts
db.version(2).stores({
  wordProgress: 'wordId, nextReview, learned',  // unchanged
  telemetry: '++id, wordId, timestamp',         // unchanged
  sceneProgress: 'sceneId, completedAt',        // new
  appState: 'key',                              // new: key-value flags
})
```

Types:
```ts
interface SceneProgress { sceneId: string; completedAt: Date }
interface AppStateEntry { key: string; value: unknown; updatedAt: Date }
```

### 7.2 Content file additions

- `content/scenes.json`: add `echo_intro: { ru, kk }` to all 15 scenes. Author during implementation.
- New `content/echo_lines.json`:
  ```json
  {
    "first_greeting":     { "ru": "...", "kk": "..." },
    "retry_hint":         { "ru": "Почти! Послушай:", "kk": "..." },
    "level_up": {
      "ember":   { "ru": "Я разгораюсь!", "kk": "..." },
      "burning": { "ru": "...", "kk": "..." },
      "radiant": { "ru": "...", "kk": "..." }
    },
    "talk_session_start": { "ru": "Давай потренируемся!", "kk": "..." },
    "talk_session_empty": { "ru": "Всё выучено, приходи позже!", "kk": "..." },
    "talk_session_done":  { "ru": "Ты повторил {{n}} слов!", "kk": "..." },
    "spellbook_intro":    { "ru": "...", "kk": "..." },
    "locked_word":        { "ru": "Сначала найди это на острове!", "kk": "..." }
  }
  ```
- `locales/ru.json` + `locales/kk.json`: add UI strings (tabs, buttons like "Подсказка", "Послушать", "Произнести", "К карте", "Ещё раз", "N из M выучено", etc.).

### 7.3 New files

**Components:**
- `src/components/EchoCompanion.tsx` — Lottie player + positioning + bubble overlay
- `src/components/EchoLayout.tsx` — Context Provider wrapping routes
- `src/components/SpeechBubble.tsx` — positioned bubble near Эхо
- `src/components/WordCard.tsx` — reusable card (Spellbook grid + Talk session)

**Hooks:**
- `src/hooks/useEcho.ts` — consumes EchoContext

**Engines:**
- `src/engine/EchoProgress.ts` — `computePower`, thresholds
- `src/engine/SpacedRepetition.ts` — fill in `scheduleNext`, `recordReview`, `ensureWordProgress`
- `src/engine/SpeechEngine.ts` — add `speakEnglish`, `speakLocalized`, `isSpeechSynthesisSupported`

**Pages:**
- `src/pages/Talk.tsx`
- `src/pages/Spellbook.tsx`

**Assets:**
- `public/lottie/echo-idle.json`
- `public/lottie/echo-listening.json`
- `public/lottie/echo-talking.json`
- `public/lottie/echo-celebrating.json`
- Fallback: one `idle.json` + Framer Motion derivations for the rest.

### 7.4 Dependencies

Add to `package.json`:
```json
"lottie-react": "^2.x"
```
No other runtime deps. All speech APIs are browser-native.

---

## 8. Integration Points (existing code)

- **`App.tsx`** — wrap Routes with `<EchoLayout>`, add `/talk` and `/spellbook` routes.
- **`pages/Game.tsx`** — subscribe to `EchoContext`; manage idle timer, hint on fail, celebrate success; persist `sceneProgress` + `ensureWordProgress` on success.
- **`pages/Map.tsx`** — progress bars at lines 107-117 currently show `0/N`. Wire to `useSceneProgress()` hook for real counts.
- **`components/MicButton.tsx`** — no changes expected; reused in Talk mode.
- **`db/schema.ts`** — add v2 migration with new tables.
- **`engine/SpacedRepetition.ts`** — replace stub with full implementation.
- **`engine/SpeechEngine.ts`** — add synthesis functions alongside existing recognition.

---

## 9. Out of Scope (YAGNI)

- Full SM-2 with ease-factor and self-grading ("easy/medium/hard").
- Customization of Эхо (name, color, accessories).
- Sound effects for animations (mute-friendly by default).
- Reset-progress controls (for Эхо or spellbook).
- Parent-facing statistics (playtime, retention).
- Extra Эхо chatter on Spellbook / Talk beyond the lines specified.
- Custom/external TTS — browser Web Speech Synthesis only.
- Echo appearance on first ever app launch beyond the `dim` state; no tutorial beyond `first_greeting` + scene-by-scene `echo_intro`.

---

## 10. Open Implementation Gates

1. **Lottie asset availability** — first implementation task is searching LottieFiles. If a consistent 4-state set isn't findable, fall back to single-idle + Framer Motion mood variations. Document the chosen path in the plan.
2. **Speech Synthesis on iOS Safari** — verify priming works on first tap. Have the text-only fallback tested on at least one unsupported path.
3. **`echo_intro` copy** — 15 scene lines × 2 languages. Writer (user) supplies during implementation; placeholder stub lines are acceptable until then.

---

## 11. Success Criteria

- Child opens the app for the first time → sees dim Эхо in the corner who greets with `first_greeting`.
- In a scene, if child stays silent 10s → Эхо hints once.
- After failed mic attempt → Эхо re-voices the target word in English.
- After a scene is solved → `sceneProgress` persists, Эхо may level up with a visible flash.
- `/spellbook` shows all 15 words with accurate per-status visuals; tapping a locked word doesn't navigate anywhere.
- `/talk` surfaces only words due for review; completing a session updates SR schedule.
- All text available in both RU and KK; `echo_intro` spoken with EN voice for the English word.
- App works offline (PWA) — no new network dependencies.
