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
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${powerStyle.glow} 0%, transparent 70%)`,
            transform: `scale(${powerStyle.scale * 1.4})`,
          }}
        />

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
  return {
    left: `${anchor.x}%`,
    top: `${anchor.y}%`,
    bubbleSide: anchor.x > 50 ? 'left' : 'right',
  }
}
