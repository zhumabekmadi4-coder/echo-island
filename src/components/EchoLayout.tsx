import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const lang = i18n.language as 'ru' | 'kk'

  const scenesCompleted = useLiveQuery(() => db.sceneProgress.count(), [])
  const prevCountRef = useRef<number | undefined>(undefined)
  const power: Power = useMemo(() => computePower(scenesCompleted ?? 0), [scenesCompleted])

  const [mood, setMood] = useState<Mood>('idle')
  const [anchor, setAnchor] = useState<Anchor>({ mode: 'corner' })
  const [bubbleText, setBubbleText] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [levelUpFlash, setLevelUpFlash] = useState<Power | null>(null)
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPathRef = useRef<string | null>(null)
  const moodRef = useRef<Mood>('idle')

  useEffect(() => {
    const isInitialMount = prevPathRef.current === null
    prevPathRef.current = location.pathname

    // Anchor always updates per route (initial and subsequent)
    setAnchor({ mode: location.pathname === '/talk' ? 'center-top' : 'corner' })
    setMenuOpen(false)

    // Only reset mood/bubble on actual navigation, NOT the initial mount
    // (so child pages' mount effects that set mood/speak() are preserved)
    if (!isInitialMount) {
      setMood('idle')
      setBubbleText(null)
    }
  }, [location.pathname])

  useEffect(() => {
    if (scenesCompleted === undefined) return
    const prev = prevCountRef.current
    prevCountRef.current = scenesCompleted
    if (prev === undefined) return  // first real resolution, no comparison
    if (scenesCompleted > prev && isPowerLevelUp(prev, scenesCompleted)) {
      setLevelUpFlash(computePower(scenesCompleted))
      setTimeout(() => setLevelUpFlash(null), 1500)
    }
  }, [scenesCompleted])

  // Keep moodRef in sync so speak's setTimeout restores the current mood
  useEffect(() => {
    moodRef.current = mood
  }, [mood])

  // First-visit greeting
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const flag = await db.appState.get('echo_first_greeting_seen')
      if (flag?.value === true || cancelled) return
      await new Promise((r) => setTimeout(r, 1500))
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
      const prevMood = moodRef.current
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
    [lang]
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

      {menuOpen && !menuSuppressed && (
        <EchoMenu
          onNavigate={(path) => {
            setMenuOpen(false)
            navigate(path)
          }}
          onClose={() => setMenuOpen(false)}
          labels={{
            talk: t('echo_menu_talk'),
            spellbook: t('echo_menu_spellbook'),
            close: t('echo_menu_close'),
          }}
        />
      )}

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
