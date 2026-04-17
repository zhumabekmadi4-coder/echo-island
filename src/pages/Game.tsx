import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Character, type CharacterType } from '@/components/Character'
import { MicButton } from '@/components/MicButton'
import { MagicAnimation, type MagicType } from '@/components/MagicAnimation'
import { SuccessMessage } from '@/components/SuccessMessage'
import { AmbientParticles } from '@/components/AmbientParticles'
import { recognizeSpeech, checkWord, isSpeechSupported } from '@/engine/SpeechEngine'
import { logAttempt } from '@/db/telemetry'
import scenes from '@/content/scenes.json'
import words from '@/content/words.json'
import islands from '@/content/islands.json'

type GameState = 'idle' | 'listening' | 'success' | 'fail'

// Background configs per island type
const BG_CONFIGS: Record<string, { gradient: string; groundGradient: string; groundColor: string }> = {
  crystal_caves: {
    gradient: 'linear-gradient(180deg, #0a0618 0%, #1a1145 20%, #2d1b69 45%, #1a3a5c 70%, #0d4a3a 100%)',
    groundGradient: 'linear-gradient(to top, #061a14 0%, #0d3a2a 40%, #0d4a3a 100%)',
    groundColor: '#86efac',
  },
  enchanted_forest: {
    gradient: 'linear-gradient(180deg, #0a1a0a 0%, #0d2818 20%, #1a4a2e 50%, #0d3a20 80%, #0a2a18 100%)',
    groundGradient: 'linear-gradient(to top, #051208 0%, #0a2a18 40%, #1a4a2e 100%)',
    groundColor: '#86efac',
  },
  star_beach: {
    gradient: 'linear-gradient(180deg, #0a0e27 0%, #0f1a3d 25%, #1a2d5c 50%, #1a3a5c 80%, #1e3a5f 100%)',
    groundGradient: 'linear-gradient(to top, #0f1520 0%, #1a2d4c 40%, #1a3a5c 100%)',
    groundColor: '#38bdf8',
  },
}

export function Game() {
  const { sceneId } = useParams<{ islandId: string; sceneId: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [gameState, setGameState] = useState<GameState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const scene = useMemo(() => scenes.find((s) => s.id === sceneId) ?? scenes[0], [sceneId])
  const word = useMemo(() => words.find((w) => w.id === scene.trigger_word_id)!, [scene])
  const island = useMemo(() => islands.find((i) => i.id === scene.island_id), [scene])
  const lang = i18n.language as 'ru' | 'kk'
  const bg = BG_CONFIGS[scene.island_id] ?? BG_CONFIGS.crystal_caves

  const handleMicPress = useCallback(async () => {
    if (!isSpeechSupported()) {
      setErrorMessage(t('speech_not_supported'))
      return
    }

    setGameState('listening')
    setErrorMessage('')

    try {
      const recognized = await recognizeSpeech()
      const isCorrect = checkWord(recognized, word.en)

      await logAttempt(word.id, isCorrect, recognized)

      if (isCorrect) {
        setGameState('success')
      } else {
        setGameState('fail')
        setErrorMessage(t('try_again'))
        setTimeout(() => setGameState('idle'), 2000)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown_error'
      const translated = t(message, { defaultValue: '' })
      setErrorMessage(translated || t('try_again'))
      setGameState('idle')
    }
  }, [word, t])

  const handleNextScene = useCallback(() => {
    if (scene.next_scene_id) {
      setGameState('idle')
      setErrorMessage('')
      navigate(`/island/${scene.island_id}/scene/${scene.next_scene_id}`)
    } else {
      navigate('/')
    }
  }, [scene, navigate])

  const characterState = gameState === 'success' ? 'after' : 'before'

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: bg.gradient }} />

      {/* Stars */}
      {Array.from({ length: 25 }, (_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: 1 + Math.random() * 2,
            height: 1 + Math.random() * 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 35}%`,
            boxShadow: `0 0 ${2 + Math.random() * 3}px rgba(255,255,255,0.5)`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + Math.random() * 3, delay: Math.random() * 3, repeat: Infinity }}
        />
      ))}

      {/* Ground */}
      <div
        className="absolute bottom-0 w-full"
        style={{
          height: '30%',
          background: bg.groundGradient,
          borderRadius: '50% 50% 0 0 / 15% 15% 0 0',
        }}
      />

      {/* Ambient particles */}
      <AmbientParticles />

      {/* Character */}
      <Character
        type={scene.character.type as CharacterType}
        state={characterState}
        position={scene.character.position}
      />

      {/* Magic animation on success */}
      <MagicAnimation
        show={gameState === 'success'}
        type={scene.success_animation as MagicType}
        targetPosition={scene.character.position}
      />

      {/* Success message */}
      <SuccessMessage
        show={gameState === 'success'}
        text={scene.success_text[lang] || scene.success_text.ru}
      />

      {/* Word hint card */}
      <AnimatePresence>
        {gameState !== 'success' && (
          <motion.div
            className="absolute top-6 left-1/2 z-10"
            initial={{ y: -20, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: -20, x: '-50%', opacity: 0 }}
          >
            <div
              className="relative rounded-2xl px-8 py-4 text-center overflow-hidden"
              style={{
                background: 'rgba(15,10,40,0.6)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${island?.accent_color ?? '#a78bfa'}33`,
                boxShadow: `0 0 30px ${island?.accent_color ?? '#a78bfa'}15, 0 8px 20px rgba(0,0,0,0.3)`,
              }}
            >
              <p className="text-purple-300/70 text-sm font-medium">{t('hint_say')}</p>
              <p
                className="text-white text-4xl font-bold mt-1 tracking-wide"
                style={{ textShadow: `0 0 20px ${island?.accent_color ?? '#a78bfa'}66` }}
              >
                {scene.hint_emoji} {word.en}
              </p>
              <p className="text-purple-300/50 text-sm mt-0.5">{word.phonetic}</p>
              <p className="text-purple-300/40 text-xs mt-1">
                {t('hint_means')} {word[lang] || word.ru}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {errorMessage && gameState !== 'success' && (
          <motion.div
            className="absolute top-1/2 left-1/2 z-20"
            initial={{ scale: 0, x: '-50%', y: '-50%', opacity: 0 }}
            animate={{ scale: 1, x: '-50%', y: '-50%', opacity: 1 }}
            exit={{ scale: 0, x: '-50%', y: '-50%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div
              className="text-white px-8 py-4 rounded-2xl text-lg font-semibold text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.85), rgba(185,28,28,0.85))',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 25px rgba(239,68,68,0.3), 0 8px 20px rgba(0,0,0,0.3)',
              }}
            >
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic button / Next button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        {gameState === 'success' ? (
          <motion.button
            className="px-8 py-4 rounded-2xl text-white text-lg font-bold cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${island?.accent_color ?? '#a78bfa'}, ${island?.accent_color ?? '#a78bfa'}cc)`,
              boxShadow: `0 0 20px ${island?.accent_color ?? '#a78bfa'}44, 0 8px 20px rgba(0,0,0,0.3)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNextScene}
          >
            {scene.next_scene_id
              ? (lang === 'kk' ? 'Келесі ➜' : 'Дальше ➜')
              : (lang === 'kk' ? 'Картаға ➜' : 'К карте ➜')
            }
          </motion.button>
        ) : (
          <MicButton
            state={gameState === 'listening' ? 'listening' : 'idle'}
            onPress={handleMicPress}
          />
        )}
      </div>

      {/* Back to map button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white/70 transition cursor-pointer"
        style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}
      >
        ← {lang === 'kk' ? 'Карта' : 'Карта'}
      </button>

      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-10 flex gap-1">
        {(['ru', 'kk'] as const).map((code) => (
          <button
            key={code}
            onClick={() => i18n.changeLanguage(code)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              color: lang === code ? 'white' : 'rgba(255,255,255,0.35)',
              background: lang === code ? 'rgba(167,139,250,0.2)' : 'transparent',
              border: lang === code ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
            }}
          >
            {code === 'ru' ? 'РУС' : 'ҚАЗ'}
          </button>
        ))}
      </div>
    </div>
  )
}
