import { motion } from 'framer-motion'

export type WordStatus = 'locked' | 'seen' | 'learning' | 'mastered'

interface WordCardProps {
  emoji: string
  en: string
  phonetic: string
  translation: string
  status: WordStatus
  successCount: number
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
