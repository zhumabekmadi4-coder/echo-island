import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'

interface FireAnimationProps {
  show: boolean
  targetPosition: { x: number; y: number }
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

function generateParticles(targetX: number, targetY: number): ParticleData[] {
  const colors = ['#FFD700', '#FF6B35', '#E8453C', '#FF4500', '#FFA500', '#FFED4E']

  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    startX: 50 + (Math.random() - 0.5) * 30,
    startY: 85 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 8,
    delay: i * 0.04,
    duration: 0.8 + Math.random() * 0.4,
    midX: targetX + (Math.random() - 0.5) * 20,
  }))
}

function FireParticle({ data, targetX, targetY }: { data: ParticleData; targetX: number; targetY: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${data.startX}%`,
        top: `${data.startY}%`,
        width: data.size,
        height: data.size,
        background: `radial-gradient(circle, ${data.color} 0%, ${data.color}88 50%, transparent 100%)`,
        boxShadow: `0 0 ${data.size * 2}px ${data.color}, 0 0 ${data.size * 4}px ${data.color}66`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        left: [`${data.startX}%`, `${data.midX}%`, `${targetX}%`],
        top: [`${data.startY}%`, `${(data.startY + targetY) / 2 - 10}%`, `${targetY}%`],
        opacity: [0, 1, 1, 0.8],
        scale: [0, 1.5, 1.2, 0],
      }}
      transition={{
        duration: data.duration,
        delay: data.delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    />
  )
}

function IceCrack({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2], rotate: Math.random() * 360 }}
      transition={{ duration: 0.8, delay }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M20 5 L22 18 L35 15 L23 22 L30 35 L18 24 L8 32 L16 20 L5 18 L18 16Z"
          fill="none" stroke="#C5E8FF" strokeWidth="1.5" opacity="0.8" />
      </svg>
    </motion.div>
  )
}

export function FireAnimation({ show, targetPosition }: FireAnimationProps) {
  const particles = useMemo(
    () => generateParticles(targetPosition.x, targetPosition.y),
    [targetPosition.x, targetPosition.y]
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
          {/* Fire particles flying to target */}
          {particles.map((p) => (
            <FireParticle
              key={p.id}
              data={p}
              targetX={targetPosition.x}
              targetY={targetPosition.y}
            />
          ))}

          {/* Ice crack effects around target */}
          <IceCrack delay={0.5} x={targetPosition.x - 12} y={targetPosition.y - 8} />
          <IceCrack delay={0.6} x={targetPosition.x + 10} y={targetPosition.y - 5} />
          <IceCrack delay={0.7} x={targetPosition.x - 5} y={targetPosition.y + 10} />
          <IceCrack delay={0.55} x={targetPosition.x + 8} y={targetPosition.y + 8} />

          {/* Central impact flash */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${targetPosition.x}%`,
              top: `${targetPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,107,53,0.4) 30%, rgba(232,69,60,0.1) 60%, transparent 80%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 2], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          />

          {/* Warm glow that stays */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${targetPosition.x}%`,
              top: `${targetPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(255,150,50,0.2) 0%, rgba(255,100,30,0.05) 50%, transparent 70%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1], opacity: [0, 1] }}
            transition={{ duration: 1, delay: 0.6 }}
          />

          {/* Sparkle burst */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const dist = 80 + Math.random() * 40
            return (
              <motion.div
                key={`spark-${i}`}
                className="absolute w-2 h-2 rounded-full bg-yellow-300"
                style={{
                  left: `${targetPosition.x}%`,
                  top: `${targetPosition.y}%`,
                  boxShadow: '0 0 6px #fcd34d, 0 0 12px #fbbf24',
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
            className="absolute inset-0 bg-orange-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
