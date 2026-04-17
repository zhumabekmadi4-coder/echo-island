import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
  delay: number
  driftX: number
  driftY: number
}

function generateParticles(count: number): Particle[] {
  const colors = [
    '#a78bfa', // purple
    '#7dd3fc', // cyan
    '#38bdf8', // sky
    '#fcd34d', // amber (fireflies)
    '#86efac', // green
    '#c4b5fd', // light purple
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 5,
    driftX: (Math.random() - 0.5) * 30,
    driftY: -10 - Math.random() * 30,
  }))
}

export function AmbientParticles() {
  const particles = useMemo(() => generateParticles(25), [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{
            y: [0, p.driftY, 0],
            x: [0, p.driftX, 0],
            opacity: [0, 0.8, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Fireflies — larger, brighter, slower */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={`firefly-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${15 + i * 18}%`,
            top: `${50 + (i % 3) * 15}%`,
            width: 5,
            height: 5,
            background: '#fcd34d',
            boxShadow: '0 0 10px #fcd34d, 0 0 20px rgba(252,211,77,0.3)',
          }}
          animate={{
            y: [0, -20 - Math.random() * 15, 5, -10, 0],
            x: [0, 10 + Math.random() * 10, -15, 5, 0],
            opacity: [0.3, 1, 0.5, 0.9, 0.3],
          }}
          transition={{
            duration: 6 + i * 1.5,
            delay: i * 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
