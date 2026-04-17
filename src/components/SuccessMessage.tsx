import { motion, AnimatePresence } from 'framer-motion'

interface SuccessMessageProps {
  show: boolean
  text: string
}

export function SuccessMessage({ show, text }: SuccessMessageProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute top-10 left-1/2 z-30"
          initial={{ y: -60, x: '-50%', opacity: 0, scale: 0.5 }}
          animate={{ y: 0, x: '-50%', opacity: 1, scale: 1 }}
          exit={{ y: -30, x: '-50%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.8 }}
        >
          {/* Glow behind banner */}
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: -30,
              background: 'radial-gradient(ellipse, rgba(255,215,0,0.3) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />

          {/* Banner */}
          <div
            className="relative px-6 sm:px-10 py-4 sm:py-5 rounded-2xl text-lg sm:text-2xl font-bold text-center text-white max-w-[85vw]"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #dc2626 100%)',
              boxShadow: '0 0 30px rgba(245,158,11,0.4), 0 8px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {text}

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{ pointerEvents: 'none' }}
            >
              <motion.div
                className="absolute h-full w-1/3"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  top: 0,
                }}
                animate={{ left: ['-30%', '130%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
            </motion.div>
          </div>

          {/* Floating stars */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const radius = 60 + Math.random() * 30
            return (
              <motion.div
                key={i}
                className="absolute text-lg"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: Math.cos(angle) * radius,
                  y: Math.sin(angle) * radius,
                  opacity: [0, 1, 0.8, 0],
                  scale: [0, 1.2, 1, 0],
                  rotate: [0, 180],
                }}
                transition={{
                  duration: 2,
                  delay: 1 + i * 0.08,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                ✨
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
