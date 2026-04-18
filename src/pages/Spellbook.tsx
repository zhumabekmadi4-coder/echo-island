import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import words from '@/content/words.json'
import scenes from '@/content/scenes.json'
import islands from '@/content/islands.json'
import { db } from '@/db/schema'
import { WordCard, type WordStatus } from '@/components/WordCard'
import { useSceneProgress } from '@/hooks/useSceneProgress'
import { speakEnglish } from '@/engine/SpeechEngine'

type Topic = 'magic_elements' | 'animals' | 'sky'

const TOPICS: { id: Topic; labelKey: string; islandId: string }[] = [
  { id: 'magic_elements', labelKey: 'spellbook_tab_magic_elements', islandId: 'crystal_caves' },
  { id: 'animals',        labelKey: 'spellbook_tab_animals',        islandId: 'enchanted_forest' },
  { id: 'sky',            labelKey: 'spellbook_tab_sky',            islandId: 'star_beach' },
]

export function Spellbook() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language as 'ru' | 'kk'
  const { completed } = useSceneProgress()

  const wordProgress = useLiveQuery(() => db.wordProgress.toArray(), [], [])
  const wpMap = useMemo(() => {
    const m = new Map<string, (typeof wordProgress)[number]>()
    for (const wp of wordProgress ?? []) m.set(wp.wordId, wp)
    return m
  }, [wordProgress])

  const [activeTab, setActiveTab] = useState<Topic>('magic_elements')
  const [selected, setSelected] = useState<string | null>(null)

  const totalLearned = (wordProgress ?? []).filter((w) => w.learned).length
  const activeIsland = islands.find((i) => i.id === TOPICS.find((tp) => tp.id === activeTab)!.islandId)!
  const topicWords = words.filter((w) => w.topic === activeTab)

  function statusFor(wordId: string, sceneId: string): WordStatus {
    const sceneDone = completed.has(sceneId)
    if (!sceneDone) return 'locked'
    const wp = wpMap.get(wordId)
    if (!wp || wp.successCount === 0) return 'seen'
    if (wp.learned) return 'mastered'
    return 'learning'
  }

  const selectedWord = selected ? words.find((w) => w.id === selected) : null
  const selectedScene = selectedWord ? scenes.find((s) => s.trigger_word_id === selectedWord.id) : null

  return (
    <div className="relative w-full min-h-full overflow-y-auto overflow-x-hidden select-none">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(180deg, #0a0618 0%, #0f1a3d 25%, #1a2d5c 50%, #1e3a5f 100%)',
        }}
      />

      <div className="px-5 pt-14 pb-20">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/80 bg-black/30"
        >
          ← {t('nav_back_to_map')}
        </button>

        <h1 className="text-center text-2xl font-bold text-white mb-1">{t('spellbook_title')}</h1>
        <p className="text-center text-purple-300/60 text-sm mb-6">
          {t('spellbook_progress', { learned: totalLearned, total: words.length })}
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {TOPICS.map((tp) => {
            const island = islands.find((i) => i.id === tp.islandId)!
            const active = activeTab === tp.id
            return (
              <button
                key={tp.id}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  color: active ? 'white' : 'rgba(255,255,255,0.5)',
                  background: active ? `${island.accent_color}33` : 'transparent',
                  border: active ? `1px solid ${island.accent_color}88` : '1px solid rgba(255,255,255,0.1)',
                }}
                onClick={() => setActiveTab(tp.id)}
              >
                {t(tp.labelKey)}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {topicWords.map((w) => {
            const scene = scenes.find((s) => s.trigger_word_id === w.id)!
            const st = statusFor(w.id, scene.id)
            return (
              <WordCard
                key={w.id}
                emoji={scene.hint_emoji}
                en={w.en}
                phonetic={w.phonetic}
                translation={w[lang] ?? w.ru}
                status={st}
                successCount={wpMap.get(w.id)?.successCount ?? 0}
                onClick={() => setSelected(w.id)}
              />
            )
          })}
        </div>
      </div>

      {selectedWord && selectedScene && (
        <WordDetailSheet
          word={selectedWord}
          scene={selectedScene}
          status={statusFor(selectedWord.id, selectedScene.id)}
          accentColor={activeIsland.accent_color}
          lang={lang}
          onClose={() => setSelected(null)}
          onListen={() => speakEnglish(selectedWord.en)}
          onReturnToScene={() => navigate(`/island/${selectedScene.island_id}/scene/${selectedScene.id}`)}
          lockedLabel={t('locked_tooltip_prefix')}
          listenLabel={t('spellbook_listen')}
          returnLabel={t('spellbook_return_to_scene')}
        />
      )}
    </div>
  )
}

interface DetailSheetProps {
  word: typeof words[number]
  scene: typeof scenes[number]
  status: WordStatus
  accentColor: string
  lang: 'ru' | 'kk'
  onClose: () => void
  onListen: () => void
  onReturnToScene: () => void
  lockedLabel: string
  listenLabel: string
  returnLabel: string
}

function WordDetailSheet({
  word, status, accentColor, lang,
  onClose, onListen, onReturnToScene,
  lockedLabel, listenLabel, returnLabel,
}: DetailSheetProps) {
  const locked = status === 'locked'
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(15,10,40,0.95), rgba(30,20,80,0.95))',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${accentColor}55`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {locked ? (
          <p className="text-white/60 text-sm">{lockedLabel} 💎</p>
        ) : (
          <>
            <p className="text-white text-4xl font-bold uppercase">{word.en}</p>
            <p className="text-purple-300/70 text-sm mt-1">{word.phonetic}</p>
            <p className="text-purple-300/50 text-sm mt-0.5">{word[lang] ?? word.ru}</p>
            <div className="flex justify-center gap-3 mt-5">
              <button
                onClick={onListen}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: `${accentColor}44`, border: `1px solid ${accentColor}88` }}
              >
                🔊 {listenLabel}
              </button>
              <button
                onClick={onReturnToScene}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: `${accentColor}44`, border: `1px solid ${accentColor}88` }}
              >
                ↩ {returnLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
