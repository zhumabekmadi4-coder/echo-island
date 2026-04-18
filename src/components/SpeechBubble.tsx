import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface SpeechBubbleProps {
  visible: boolean
  text: ReactNode
  side?: 'left' | 'right' | 'top'
}

export function SpeechBubble({ visible, text, side = 'top' }: SpeechBubbleProps) {
  const sideStyle = {
    left:  { right: '105%', top: '50%', transform: 'translateY(-50%)' },
    right: { left:  '105%', top: '50%', transform: 'translateY(-50%)' },
    top:   { bottom: '110%', left: '50%', transform: 'translateX(-50%)' },
  }[side]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute z-20 pointer-events-none"
          style={sideStyle}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <div
            className="rounded-2xl px-4 py-2 text-sm font-medium text-white max-w-[240px] text-center"
            style={{
              background: 'rgba(15,10,40,0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(251,191,36,0.35)',
              boxShadow: '0 0 20px rgba(251,191,36,0.15), 0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            {text}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
