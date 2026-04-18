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
