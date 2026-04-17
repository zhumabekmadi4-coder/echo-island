import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

type MicState = 'idle' | 'listening' | 'processing'

interface MicButtonProps {
  state: MicState
  onPress: () => void
  disabled?: boolean
}

export function MicButton({ state, onPress, disabled }: MicButtonProps) {
  const { t } = useTranslation()

  const label =
    state === 'listening'
      ? t('mic_button_listening')
      : state === 'processing'
        ? t('mic_button_processing')
        : t('mic_button_speak')

  const isListening = state === 'listening'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Outer orbit ring 1 */}
        <motion.div
          className="absolute rounded-full border border-purple-400/30"
          style={{ inset: -20 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-purple-400 top-0 left-1/2 -translate-x-1/2"
            style={{ boxShadow: '0 0 8px #a78bfa' }}
            animate={isListening ? { scale: [1, 2, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </motion.div>

        {/* Outer orbit ring 2 */}
        <motion.div
          className="absolute rounded-full border border-sky-400/20"
          style={{ inset: -35 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="absolute w-1 h-1 rounded-full bg-sky-400 bottom-0 left-1/2 -translate-x-1/2"
            style={{ boxShadow: '0 0 6px #38bdf8' }}
          />
        </motion.div>

        {/* Orbit ring 3 — fast, only when listening */}
        {isListening && (
          <motion.div
            className="absolute rounded-full border border-amber-400/30"
            style={{ inset: -28 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-amber-400 top-0 right-0"
              style={{ boxShadow: '0 0 10px #fbbf24' }}
            />
          </motion.div>
        )}

        {/* Glow behind orb */}
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: -10,
            background: isListening
              ? 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          }}
          animate={isListening
            ? { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }
            : { scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }
          }
          transition={{ duration: isListening ? 0.8 : 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Main orb button */}
        <motion.button
          onClick={onPress}
          disabled={disabled || state !== 'idle'}
          className="relative flex items-center justify-center w-24 h-24 rounded-full cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: isListening
              ? 'radial-gradient(circle at 35% 35%, #fde68a, #f59e0b 50%, #b45309)'
              : 'radial-gradient(circle at 35% 35%, #c4b5fd, #7c3aed 50%, #4c1d95)',
            boxShadow: isListening
              ? '0 0 30px rgba(245,158,11,0.5), 0 0 60px rgba(245,158,11,0.2), inset 0 -5px 15px rgba(0,0,0,0.3)'
              : '0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.15), inset 0 -5px 15px rgba(0,0,0,0.3)',
          }}
          whileTap={{ scale: 0.9 }}
          animate={
            isListening
              ? { scale: [1, 1.08, 1], transition: { repeat: Infinity, duration: 0.8 } }
              : {}
          }
        >
          {/* Mic icon */}
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }}
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>

          {/* Shine highlight */}
          <div
            className="absolute rounded-full"
            style={{
              top: 12,
              left: 16,
              width: 22,
              height: 14,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              transform: 'rotate(-30deg)',
            }}
          />

          {/* Pulse ring when listening */}
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-amber-400/60"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-amber-300/40"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
              />
            </>
          )}
        </motion.button>
      </div>

      <motion.span
        className="text-lg font-medium"
        style={{
          color: 'rgba(255,255,255,0.75)',
          textShadow: isListening
            ? '0 0 12px rgba(251,191,36,0.5)'
            : '0 0 10px rgba(167,139,250,0.4)',
        }}
        animate={isListening ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.75 }}
        transition={isListening ? { repeat: Infinity, duration: 1.2 } : {}}
      >
        {label}
      </motion.span>
    </div>
  )
}
