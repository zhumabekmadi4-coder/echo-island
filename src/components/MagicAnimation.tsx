import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'

export type MagicType = 'fire' | 'water' | 'wind' | 'light' | 'ice' | 'sparkle'

interface MagicAnimationProps {
  show: boolean
  type: MagicType
  targetPosition: { x: number; y: number }
}

const MAGIC_CONFIGS: Record<MagicType, { colors: string[]; screenFlash: string }> = {
  fire: {
    colors: ['#FFD700', '#FF6B35', '#E8453C', '#FF4500', '#FFA500'],
    screenFlash: 'rgba(255,100,0,0.2)',
  },
  water: {
    colors: ['#38bdf8', '#0ea5e9', '#7dd3fc', '#0284c7', '#bae6fd'],
    screenFlash: 'rgba(56,189,248,0.15)',
  },
  wind: {
    colors: ['#86efac', '#4ade80', '#bbf7d0', '#22c55e', '#dcfce7'],
    screenFlash: 'rgba(134,239,172,0.12)',
  },
  light: {
    colors: ['#fcd34d', '#fbbf24', '#fef3c7', '#f59e0b', '#fffbeb'],
    screenFlash: 'rgba(252,211,77,0.2)',
  },
  ice: {
    colors: ['#C5E8FF', '#93c5fd', '#bfdbfe', '#60a5fa', '#dbeafe'],
    screenFlash: 'rgba(147,197,253,0.15)',
  },
  sparkle: {
    colors: ['#c4b5fd', '#a78bfa', '#ddd6fe', '#8b5cf6', '#ede9fe'],
    screenFlash: 'rgba(167,139,250,0.15)',
  },
}

interface ParticleData {
  id: number
  startX: number
  startY: number
  color: string
  size: number
  delay: number
  duration: number
  midX: number
}

function generateParticles(targetX: number, targetY: number, colors: string[]): ParticleData[] {
  return Array.from({ length: 18 }, (_, i) => ({
    id: i,
    startX: 50 + (Math.random() - 0.5) * 40,
    startY: 82 + Math.random() * 12,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 8,
    delay: i * 0.04,
    duration: 0.8 + Math.random() * 0.4,
    midX: targetX + (Math.random() - 0.5) * 20,
  }))
}

export function MagicAnimation({ show, type, targetPosition }: MagicAnimationProps) {
  const config = MAGIC_CONFIGS[type]

  const particles = useMemo(
    () => generateParticles(targetPosition.x, targetPosition.y, config.colors),
    [targetPosition.x, targetPosition.y, config.colors]
  )

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Flying particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.startX}%`,
                top: `${p.startY}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, ${p.color} 0%, ${p.color}88 60%, transparent 100%)`,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size * 4}px ${p.color}66`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                left: [`${p.startX}%`, `${p.midX}%`, `${targetPosition.x}%`],
                top: [`${p.startY}%`, `${(p.startY + targetPosition.y) / 2 - 10}%`, `${targetPosition.y}%`],
                opacity: [0, 1, 1, 0.8],
                scale: [0, 1.5, 1.2, 0],
              }}
              transition={{ duration: p.duration, delay: p.delay, ease: [0.25, 0.1, 0.25, 1] }}
            />
          ))}

          {/* Impact flash */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${targetPosition.x}%`,
              top: `${targetPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 200,
              height: 200,
              background: `radial-gradient(circle, ${config.colors[0]}cc 0%, ${config.colors[1]}66 30%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 2], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          />

          {/* Warm glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${targetPosition.x}%`,
              top: `${targetPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 280,
              height: 280,
              background: `radial-gradient(circle, ${config.colors[0]}33 0%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          />

          {/* Sparkle burst */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const dist = 70 + Math.random() * 40
            return (
              <motion.div
                key={`spark-${i}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${targetPosition.x}%`,
                  top: `${targetPosition.y}%`,
                  background: config.colors[i % config.colors.length],
                  boxShadow: `0 0 6px ${config.colors[i % config.colors.length]}`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.03, ease: 'easeOut' }}
              />
            )
          })}

          {/* Screen flash */}
          <motion.div
            className="absolute inset-0"
            style={{ background: config.screenFlash }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
