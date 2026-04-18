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
