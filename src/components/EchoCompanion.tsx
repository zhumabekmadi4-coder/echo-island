import { motion } from 'framer-motion'
import type { Power } from '@/engine/EchoProgress'
import type { Mood, Anchor } from '@/hooks/useEcho'
import { SpeechBubble } from '@/components/SpeechBubble'

interface PowerPalette {
  core: string
  main: string
  dark: string
  glow: string
  eye: string
}

const POWER_PALETTES: Record<Power, PowerPalette> = {
  dim:     { core: '#94a3b8', main: '#64748b', dark: '#334155', glow: 'rgba(100,116,139,0.25)',  eye: '#1e293b' },
  ember:   { core: '#fde68a', main: '#fb923c', dark: '#9a3412', glow: 'rgba(251,146,60,0.45)',   eye: '#1a1145' },
  burning: { core: '#fef3c7', main: '#f97316', dark: '#7c2d12', glow: 'rgba(249,115,22,0.6)',    eye: '#1a1145' },
  radiant: { core: '#fefce8', main: '#fbbf24', dark: '#b45309', glow: 'rgba(251,191,36,0.75)',   eye: '#1a1145' },
}

const POWER_SCALES: Record<Power, number> = {
  dim: 0.75, ember: 1.0, burning: 1.15, radiant: 1.3,
}

const MOOD_MOTION: Record<Mood, { scale: number[]; rotate: number[]; y: number[]; duration: number }> = {
  idle:        { scale: [1, 1.03, 1],     rotate: [-2, 2, -2],    y: [0, -4, 0],  duration: 3.0 },
  listening:   { scale: [1, 1.08, 1],     rotate: [-4, 4, -4],    y: [0, 0, 0],   duration: 0.55 },
  talking:     { scale: [1, 1.05, 1],     rotate: [-1, 1, -1],    y: [0, -1, 0],  duration: 0.35 },
  celebrating: { scale: [1, 1.25, 0.95],  rotate: [-12, 12, -12], y: [0, -14, 0], duration: 0.6 },
}

interface EchoCompanionProps {
  power: Power
  mood: Mood
  anchor: Anchor
  bubbleText: string | null
}

export function EchoCompanion({ power, mood, anchor, bubbleText }: EchoCompanionProps) {
  const palette = POWER_PALETTES[power]
  const scale = POWER_SCALES[power]
  const motionSpec = MOOD_MOTION[mood]
  const { left, top, right, bottom, bubbleSide } = resolveAnchor(anchor)

  const baseSize = 90
  const size = baseSize * scale

  return (
    <motion.div
      className="fixed z-50"
      style={{ left, top, right, bottom, pointerEvents: 'auto' }}
      layout
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <motion.div
        style={{ position: 'relative', width: size, height: size * (180 / 160) }}
        animate={{
          scale: motionSpec.scale,
          rotate: motionSpec.rotate,
          y: motionSpec.y,
        }}
        transition={{
          duration: motionSpec.duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Outer soft glow halo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 55% at 50% 60%, ${palette.glow} 0%, transparent 70%)`,
            transform: 'scale(1.7)',
            filter: 'blur(6px)',
          }}
        />

        <EchoSVG palette={palette} mood={mood} power={power} />

        <SpeechBubble visible={!!bubbleText} text={bubbleText} side={bubbleSide} />
      </motion.div>
    </motion.div>
  )
}

function EchoSVG({ palette, mood, power }: { palette: PowerPalette; mood: Mood; power: Power }) {
  const uid = `echo-${power}`

  return (
    <svg viewBox="0 0 160 180" width="100%" height="100%" style={{ overflow: 'visible', position: 'relative' }}>
      <defs>
        <radialGradient id={`${uid}-body`} cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor={palette.core} />
          <stop offset="50%" stopColor={palette.main} />
          <stop offset="100%" stopColor={palette.dark} />
        </radialGradient>

        <radialGradient id={`${uid}-sheen`} cx="35%" cy="45%" r="35%">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="70%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${uid}-tuft`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.core} stopOpacity="0" />
          <stop offset="50%" stopColor={palette.core} stopOpacity="0.95" />
          <stop offset="100%" stopColor={palette.main} />
        </linearGradient>
      </defs>

      {/* Top flickering flame tufts */}
      <motion.g
        animate={{ scaleY: [1, 1.18, 0.92, 1.08, 1], y: [0, -2, 1, -1, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '80px 32px' }}
      >
        <path
          d="M 80 8 Q 72 20, 73 34 Q 78 28, 80 34 Q 82 28, 87 34 Q 88 20, 80 8 Z"
          fill={`url(#${uid}-tuft)`}
        />
        <path
          d="M 70 22 Q 66 30, 68 36 Q 72 32, 72 30 Z"
          fill={`url(#${uid}-tuft)`}
          opacity="0.6"
        />
        <path
          d="M 90 22 Q 94 30, 92 36 Q 88 32, 88 30 Z"
          fill={`url(#${uid}-tuft)`}
          opacity="0.6"
        />
      </motion.g>

      {/* Main flame body — teardrop silhouette */}
      <path
        d="
          M 80 22
          C 58 30, 44 58, 44 95
          C 44 132, 56 160, 80 166
          C 104 160, 116 132, 116 95
          C 116 58, 102 30, 80 22
          Z
        "
        fill={`url(#${uid}-body)`}
        stroke={palette.dark}
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />

      {/* Inner sheen highlight */}
      <ellipse
        cx="64"
        cy="78"
        rx="14"
        ry="28"
        fill={`url(#${uid}-sheen)`}
        transform="rotate(-10 64 78)"
      />

      {/* Cheek blush (only ember+) */}
      {power !== 'dim' && (
        <>
          <ellipse cx="58" cy="118" rx="6" ry="4" fill={palette.core} opacity="0.45" />
          <ellipse cx="102" cy="118" rx="6" ry="4" fill={palette.core} opacity="0.45" />
        </>
      )}

      <EchoEyes palette={palette} mood={mood} />
      <EchoMouth mood={mood} palette={palette} />

      {/* Sparkles around radiant Echo */}
      {power === 'radiant' && (
        <>
          <motion.g
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0 }}
            style={{ transformOrigin: '32px 52px' }}
          >
            <Sparkle cx={32} cy={52} size={4} color="#fef3c7" />
          </motion.g>
          <motion.g
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.7 }}
            style={{ transformOrigin: '128px 65px' }}
          >
            <Sparkle cx={128} cy={65} size={3.5} color="#fef3c7" />
          </motion.g>
          <motion.g
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: 1.2 }}
            style={{ transformOrigin: '130px 120px' }}
          >
            <Sparkle cx={130} cy={120} size={4} color="#fef3c7" />
          </motion.g>
        </>
      )}
    </svg>
  )
}

function Sparkle({ cx, cy, size, color }: { cx: number; cy: number; size: number; color: string }) {
  return (
    <path
      d={`M ${cx} ${cy - size} L ${cx + size * 0.3} ${cy - size * 0.3} L ${cx + size} ${cy} L ${cx + size * 0.3} ${cy + size * 0.3} L ${cx} ${cy + size} L ${cx - size * 0.3} ${cy + size * 0.3} L ${cx - size} ${cy} L ${cx - size * 0.3} ${cy - size * 0.3} Z`}
      fill={color}
      style={{ filter: `drop-shadow(0 0 3px ${color})` }}
    />
  )
}

function EchoEyes({ palette, mood }: { palette: PowerPalette; mood: Mood }) {
  const cx1 = 68, cx2 = 92, cy = 95

  if (mood === 'celebrating') {
    return (
      <>
        <path
          d={`M ${cx1 - 8} ${cy + 3} Q ${cx1} ${cy - 7}, ${cx1 + 8} ${cy + 3}`}
          stroke={palette.eye}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx2 - 8} ${cy + 3} Q ${cx2} ${cy - 7}, ${cx2 + 8} ${cy + 3}`}
          stroke={palette.eye}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </>
    )
  }

  const eyeR = mood === 'listening' ? 9.5 : 8
  const pupilR = mood === 'listening' ? 5.5 : 5

  return (
    <>
      <ellipse cx={cx1} cy={cy} rx={eyeR} ry={eyeR * 1.2} fill="white" />
      <ellipse cx={cx2} cy={cy} rx={eyeR} ry={eyeR * 1.2} fill="white" />
      <circle cx={cx1 + 1} cy={cy + 1.5} r={pupilR} fill={palette.eye} />
      <circle cx={cx2 + 1} cy={cy + 1.5} r={pupilR} fill={palette.eye} />
      <circle cx={cx1 + 3} cy={cy - 2} r="2" fill="white" />
      <circle cx={cx2 + 3} cy={cy - 2} r="2" fill="white" />
      <circle cx={cx1 - 2.5} cy={cy + 2.5} r="1" fill="white" opacity="0.85" />
      <circle cx={cx2 - 2.5} cy={cy + 2.5} r="1" fill="white" opacity="0.85" />
    </>
  )
}

function EchoMouth({ mood, palette }: { mood: Mood; palette: PowerPalette }) {
  if (mood === 'celebrating') {
    return (
      <path
        d="M 72 120 Q 80 135, 88 120 Q 80 128, 72 120 Z"
        fill={palette.eye}
      />
    )
  }
  if (mood === 'talking') {
    return <ellipse cx="80" cy="122" rx="4.5" ry="3.5" fill={palette.eye} />
  }
  if (mood === 'listening') {
    return (
      <line
        x1="74"
        y1="122"
        x2="86"
        y2="122"
        stroke={palette.eye}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    )
  }
  return (
    <path
      d="M 72 120 Q 80 127, 88 120"
      stroke={palette.eye}
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
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
