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
  const { i18n, t } = useTranslation()
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
