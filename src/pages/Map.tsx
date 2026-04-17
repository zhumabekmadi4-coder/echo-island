import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import islands from '@/content/islands.json'
import scenes from '@/content/scenes.json'

// Island positions on the map (hand-placed for visual appeal)
const ISLAND_POSITIONS = [
  { x: 25, y: 55 },
  { x: 55, y: 35 },
  { x: 80, y: 60 },
]

export function MapPage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language as 'ru' | 'kk'

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Ocean background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0618 0%, #0f1a3d 25%, #1a2d5c 50%, #1e3a5f 75%, #1a3a5c 100%)',
        }}
      />

      {/* Stars */}
      {Array.from({ length: 40 }, (_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: 1 + Math.random() * 2.5,
            height: 1 + Math.random() * 2.5,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 30}%`,
            boxShadow: `0 0 ${2 + Math.random() * 4}px rgba(255,255,255,0.5)`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + Math.random() * 3, delay: Math.random() * 3, repeat: Infinity }}
        />
      ))}

      {/* Ocean waves */}
      <motion.div
        className="absolute w-[200%] h-full"
        style={{
          top: '40%',
          background: 'repeating-linear-gradient(90deg, transparent, rgba(56,189,248,0.03) 10%, transparent 20%)',
        }}
        animate={{ x: ['-50%', '0%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Title */}
      <motion.div
        className="absolute top-6 left-1/2 z-10 text-center"
        initial={{ y: -30, x: '-50%', opacity: 0 }}
        animate={{ y: 0, x: '-50%', opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h1
          className="text-3xl font-bold text-white"
          style={{ textShadow: '0 0 20px rgba(167,139,250,0.5), 0 2px 10px rgba(0,0,0,0.5)' }}
        >
          {lang === 'kk' ? 'Эхо-арал' : 'Эхо-остров'}
        </h1>
        <p className="text-purple-300/50 text-sm mt-1">
          {lang === 'kk' ? 'Аралды таңда' : 'Выбери остров'}
        </p>
      </motion.div>

      {/* Islands */}
      {islands.map((island, idx) => {
        const pos = ISLAND_POSITIONS[idx]
        const completedScenes = island.scenes.filter((sid) => {
          // TODO: check from Dexie if scene completed
          return false
        }).length
        const totalScenes = island.scenes.length
        const firstSceneId = island.scenes[0]

        return (
          <motion.div
            key={island.id}
            className="absolute cursor-pointer"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + idx * 0.2, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/island/${island.id}/scene/${firstSceneId}`)}
          >
            {/* Island base glow */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 180,
                height: 180,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${island.accent_color}22 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ repeat: Infinity, duration: 3 + idx, ease: 'easeInOut' }}
            />

            {/* Island shape */}
            <div className="relative flex flex-col items-center">
              {/* Island body */}
              <div
                className="relative w-28 h-20 rounded-[50%] flex items-center justify-center"
                style={{
                  background: `linear-gradient(180deg, ${island.background_gradient[2]} 0%, ${island.background_gradient[3]} 100%)`,
                  boxShadow: `0 8px 25px rgba(0,0,0,0.4), 0 0 20px ${island.accent_color}33`,
                  border: `2px solid ${island.accent_color}44`,
                }}
              >
                <span className="text-4xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                  {island.emoji}
                </span>

                {/* Progress ring */}
                <div
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${island.accent_color}, ${island.accent_color}cc)`,
                    color: 'white',
                    boxShadow: `0 0 8px ${island.accent_color}66`,
                  }}
                >
                  {completedScenes}/{totalScenes}
                </div>
              </div>

              {/* Island name */}
              <div
                className="mt-2 px-3 py-1 rounded-lg text-center"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${island.accent_color}33`,
                }}
              >
                <p
                  className="text-sm font-semibold text-white whitespace-nowrap"
                  style={{ textShadow: `0 0 8px ${island.accent_color}55` }}
                >
                  {island.name[lang] || island.name.ru}
                </p>
                <p className="text-xs text-white/40">
                  {island.description[lang] || island.description.ru}
                </p>
              </div>

              {/* Water ripple under island */}
              <motion.div
                className="absolute -bottom-3 rounded-full"
                style={{
                  width: '120%',
                  height: 12,
                  background: `radial-gradient(ellipse, ${island.accent_color}15, transparent)`,
                }}
                animate={{ scaleX: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 + idx * 0.5 }}
              />
            </div>
          </motion.div>
        )
      })}

      {/* Connecting paths between islands */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.15 }}>
        <motion.line
          x1="25%" y1="55%" x2="55%" y2="35%"
          stroke="#a78bfa" strokeWidth="2" strokeDasharray="8 4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1 }}
        />
        <motion.line
          x1="55%" y1="35%" x2="80%" y2="60%"
          stroke="#a78bfa" strokeWidth="2" strokeDasharray="8 4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
        />
      </svg>

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
