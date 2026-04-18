import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import islands from '@/content/islands.json'
import scenes from '@/content/scenes.json'
import { useSceneProgress } from '@/hooks/useSceneProgress'

export function MapPage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language as 'ru' | 'kk'

  const { completed } = useSceneProgress()

  const completedByIsland = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of scenes) {
      if (completed.has(s.id)) {
        map[s.island_id] = (map[s.island_id] ?? 0) + 1
      }
    }
    return map
  }, [completed])

  return (
    <div className="relative w-full h-full overflow-y-auto overflow-x-hidden select-none">
      {/* Ocean background — fixed */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(180deg, #0a0618 0%, #0f1a3d 25%, #1a2d5c 50%, #1e3a5f 75%, #1a3a5c 100%)',
        }}
      />

      {/* Stars */}
      {Array.from({ length: 30 }, (_, i) => (
        <motion.div
          key={`star-${i}`}
          className="fixed rounded-full bg-white -z-10"
          style={{
            width: 1 + Math.random() * 2,
            height: 1 + Math.random() * 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 40}%`,
            boxShadow: `0 0 ${2 + Math.random() * 3}px rgba(255,255,255,0.5)`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + Math.random() * 3, delay: Math.random() * 3, repeat: Infinity }}
        />
      ))}

      {/* Content */}
      <div className="relative z-0 flex flex-col items-center px-5 pt-14 pb-10 min-h-full gap-5">
        {/* Title */}
        <motion.div
          className="text-center mb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1
            className="text-2xl font-bold text-white"
            style={{ textShadow: '0 0 20px rgba(167,139,250,0.5), 0 2px 10px rgba(0,0,0,0.5)' }}
          >
            {lang === 'kk' ? 'Эхо-арал' : 'Эхо-остров'}
          </h1>
          <p className="text-purple-300/50 text-sm mt-1">
            {lang === 'kk' ? 'Аралды таңда' : 'Выбери остров'}
          </p>
        </motion.div>

        {/* Island cards */}
        {islands.map((island, idx) => {
          const totalScenes = island.scenes.length
          const firstSceneId = island.scenes[0]

          return (
            <motion.div
              key={island.id}
              className="w-full max-w-sm cursor-pointer"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + idx * 0.15, type: 'spring', stiffness: 150 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/island/${island.id}/scene/${firstSceneId}`)}
            >
              <div
                className="relative rounded-2xl p-4 flex items-center gap-4 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${island.background_gradient[1]}cc, ${island.background_gradient[2]}cc)`,
                  border: `1px solid ${island.accent_color}44`,
                  boxShadow: `0 0 25px ${island.accent_color}15, 0 8px 20px rgba(0,0,0,0.3)`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Island emoji */}
                <div
                  className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${island.background_gradient[2]}, ${island.background_gradient[3]})`,
                    border: `1px solid ${island.accent_color}55`,
                    boxShadow: `0 0 15px ${island.accent_color}22`,
                  }}
                >
                  <span className="text-3xl">{island.emoji}</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-base font-bold text-white leading-tight"
                    style={{ textShadow: `0 0 10px ${island.accent_color}44` }}
                  >
                    {island.name[lang] || island.name.ru}
                  </h2>
                  <p className="text-xs text-white/40 mt-0.5 leading-snug">
                    {island.description[lang] || island.description.ru}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: island.accent_color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${((completedByIsland[island.id] ?? 0) / totalScenes) * 100}%` }}
                        transition={{ delay: 0.5 + idx * 0.2, duration: 0.8 }}
                      />
                    </div>
                    <span className="text-xs text-white/40 font-medium">
                      {completedByIsland[island.id] ?? 0}/{totalScenes}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 text-white/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>

                {/* Subtle glow */}
                <motion.div
                  className="absolute -right-8 -top-8 w-24 h-24 rounded-full"
                  style={{ background: `radial-gradient(circle, ${island.accent_color}15, transparent)` }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ repeat: Infinity, duration: 3 + idx }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Language switcher */}
      <div className="fixed top-3 right-3 z-20 flex gap-1">
        {(['ru', 'kk'] as const).map((code) => (
          <button
            key={code}
            onClick={() => i18n.changeLanguage(code)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
            style={{
              color: lang === code ? 'white' : 'rgba(255,255,255,0.35)',
              background: lang === code ? 'rgba(167,139,250,0.25)' : 'transparent',
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
