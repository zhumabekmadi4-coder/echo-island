import { motion, AnimatePresence } from 'framer-motion'

export type CharacterType = 'dragon' | 'fish' | 'owl' | 'fairy' | 'fox' | 'cat' | 'dog' | 'bird' | 'bear' | 'rabbit' | 'turtle' | 'wolf' | 'tree_spirit' | 'penguin' | 'flower_fairy'

interface CharacterProps {
  type: CharacterType
  state: 'before' | 'after'
  position: { x: number; y: number }
}

export function Character({ type, state, position }: CharacterProps) {
  const isAfter = state === 'after'

  return (
    <motion.div
      className="absolute select-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      animate={
        !isAfter
          ? { x: [0, -2, 2, -1, 1, 0] }
          : { y: [0, -12, 0], scale: [1, 1.05, 1] }
      }
      transition={
        !isAfter
          ? { repeat: Infinity, duration: 0.5, ease: 'easeInOut' }
          : { repeat: Infinity, duration: 2, ease: 'easeInOut' }
      }
    >
      {/* Aura glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 240,
          height: 240,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: isAfter
            ? 'radial-gradient(circle, rgba(255,200,100,0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(100,180,255,0.12) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: isAfter ? 2 : 3, ease: 'easeInOut' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <CharacterSVG type={type} isAfter={isAfter} />
      </div>

      {/* Ice/sad particles when before */}
      <AnimatePresence>
        {!isAfter && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: '#C5E8FF',
                  boxShadow: '0 0 6px #C5E8FF',
                  left: `${30 + i * 25}%`,
                  top: `${10 + i * 15}%`,
                }}
                animate={{ y: [0, -8, 0], opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 + i * 0.5, delay: i * 0.3 }}
              />
            ))}
          </motion.g>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CharacterSVG({ type, isAfter }: { type: CharacterType; isAfter: boolean }) {
  const w = 160
  const h = 180

  switch (type) {
    case 'dragon': return <DragonSVG w={w} h={h} isAfter={isAfter} />
    case 'fish': return <FishSVG w={w} h={h} isAfter={isAfter} />
    case 'owl': return <OwlSVG w={w} h={h} isAfter={isAfter} />
    case 'fairy':
    case 'flower_fairy': return <FairySVG w={w} h={h} isAfter={isAfter} />
    case 'fox': return <FoxSVG w={w} h={h} isAfter={isAfter} />
    case 'cat': return <CatSVG w={w} h={h} isAfter={isAfter} />
    case 'dog': return <DogSVG w={w} h={h} isAfter={isAfter} />
    case 'bird': return <BirdSVG w={w} h={h} isAfter={isAfter} />
    case 'bear': return <BearSVG w={w} h={h} isAfter={isAfter} />
    case 'rabbit': return <RabbitSVG w={w} h={h} isAfter={isAfter} />
    case 'turtle': return <TurtleSVG w={w} h={h} isAfter={isAfter} />
    case 'wolf': return <WolfSVG w={w} h={h} isAfter={isAfter} />
    case 'penguin': return <PenguinSVG w={w} h={h} isAfter={isAfter} />
    case 'tree_spirit': return <TreeSpiritSVG w={w} h={h} isAfter={isAfter} />
    default: return <DragonSVG w={w} h={h} isAfter={isAfter} />
  }
}

interface SVGProps { w: number; h: number; isAfter: boolean }

// Chibi eye pair helper
function ChibiEyes({ cx, cy, gap, r, isAfter, sadColor }: { cx: number; cy: number; gap: number; r: number; isAfter: boolean; sadColor: string }) {
  return (
    <>
      <ellipse cx={cx - gap} cy={cy} rx={r} ry={r * 1.15} fill="white" />
      <ellipse cx={cx + gap} cy={cy} rx={r} ry={r * 1.15} fill="white" />
      <circle cx={cx - gap + 2} cy={cy + 2} r={r * 0.6} fill={isAfter ? '#1a1145' : sadColor} />
      <circle cx={cx + gap + 2} cy={cy + 2} r={r * 0.6} fill={isAfter ? '#1a1145' : sadColor} />
      <circle cx={cx - gap + 4} cy={cy - 2} r={r * 0.25} fill="white" opacity="0.9" />
      <circle cx={cx + gap + 4} cy={cy - 2} r={r * 0.25} fill="white" opacity="0.9" />
    </>
  )
}

function ChibiMouth({ cx, cy, isAfter }: { cx: number; cy: number; isAfter: boolean }) {
  return isAfter
    ? <path d={`M${cx - 10} ${cy} Q${cx} ${cy + 10} ${cx + 10} ${cy}`} stroke="#1a1145" strokeWidth="2" fill="none" strokeLinecap="round" />
    : <path d={`M${cx - 6} ${cy + 3} Q${cx} ${cy - 2} ${cx + 6} ${cy + 3}`} stroke="#4A6A8A" strokeWidth="2" fill="none" strokeLinecap="round" />
}

function DragonSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#E8453C' : '#6CB4EE'
  const head = isAfter ? '#D63B32' : '#5DA3DD'
  const belly = isAfter ? '#ffb499' : '#a5d8ff'
  const horn = isAfter ? '#B8322A' : '#4A90C4'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="125" rx="32" ry="28" fill={body} />
      <ellipse cx="80" cy="132" rx="20" ry="18" fill={belly} opacity="0.9" />
      <path d="M48 108 Q22 78 34 92 Q14 58 38 80 L48 105" fill={head} opacity="0.7" />
      <path d="M112 108 Q138 78 126 92 Q146 58 122 80 L112 105" fill={head} opacity="0.7" />
      <circle cx="80" cy="68" r="40" fill={head} />
      <circle cx="50" cy="78" r="9" fill={isAfter ? '#ff8a75' : '#7eb8e0'} opacity="0.3" />
      <circle cx="110" cy="78" r="9" fill={isAfter ? '#ff8a75' : '#7eb8e0'} opacity="0.3" />
      <ChibiEyes cx={80} cy={64} gap={16} r={12} isAfter={isAfter} sadColor="#334155" />
      <ChibiMouth cx={80} cy={82} isAfter={isAfter} />
      <path d="M52 38 L44 16 L60 34" fill={horn} />
      <path d="M108 38 L116 16 L100 34" fill={horn} />
      <ellipse cx="65" cy="155" rx="12" ry="8" fill={head} />
      <ellipse cx="95" cy="155" rx="12" ry="8" fill={head} />
      <path d="M80 153 Q110 168 125 158 Q135 152 140 158" stroke={body} strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function FishSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#38bdf8' : '#94a3b8'
  const fin = isAfter ? '#0ea5e9' : '#64748b'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="90" rx="45" ry="30" fill={body} />
      <ellipse cx="80" cy="95" rx="30" ry="18" fill={isAfter ? '#7dd3fc' : '#cbd5e1'} opacity="0.6" />
      <path d="M125 90 L150 65 L150 115Z" fill={fin} />
      <path d="M80 60 Q90 45 100 60" fill={fin} opacity="0.7" />
      <ChibiEyes cx={65} cy={85} gap={12} r={10} isAfter={isAfter} sadColor="#475569" />
      <ChibiMouth cx={60} cy={100} isAfter={isAfter} />
      {isAfter && <>
        <motion.circle cx="45" cy="75" r="3" fill="#7dd3fc" opacity="0.5" animate={{ y: [0, -15, -30], opacity: [0.5, 0.3, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
        <motion.circle cx="55" cy="70" r="2" fill="#7dd3fc" opacity="0.4" animate={{ y: [0, -20, -35], opacity: [0.4, 0.2, 0] }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }} />
      </>}
    </svg>
  )
}

function OwlSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#f59e0b' : '#6b7280'
  const belly = isAfter ? '#fde68a' : '#9ca3af'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="110" rx="35" ry="40" fill={body} />
      <ellipse cx="80" cy="118" rx="22" ry="25" fill={belly} opacity="0.7" />
      <circle cx="80" cy="65" r="35" fill={body} />
      <path d="M50 40 L42 20 L60 38" fill={isAfter ? '#d97706' : '#4b5563'} />
      <path d="M110 40 L118 20 L100 38" fill={isAfter ? '#d97706' : '#4b5563'} />
      {isAfter ? (
        <ChibiEyes cx={80} cy={60} gap={16} r={14} isAfter={true} sadColor="" />
      ) : (
        <>
          <ellipse cx={64} cy={60} rx={14} ry={3} fill="#4b5563" />
          <ellipse cx={96} cy={60} rx={14} ry={3} fill="#4b5563" />
        </>
      )}
      <polygon points="80,72 76,80 84,80" fill={isAfter ? '#92400e' : '#4b5563'} />
      <path d="M55 140 L50 158 L65 155" fill={isAfter ? '#d97706' : '#4b5563'} />
      <path d="M105 140 L110 158 L95 155" fill={isAfter ? '#d97706' : '#4b5563'} />
    </svg>
  )
}

function FairySVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#86efac' : '#6b7280'
  const wing = isAfter ? '#bbf7d0' : '#9ca3af'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="110" rx="18" ry="25" fill={body} />
      <circle cx="80" cy="70" r="25" fill={isAfter ? '#a7f3d0' : '#9ca3af'} />
      <ChibiEyes cx={80} cy={66} gap={10} r={8} isAfter={isAfter} sadColor="#475569" />
      <ChibiMouth cx={80} cy={78} isAfter={isAfter} />
      <ellipse cx="55" cy="95" rx="20" ry="35" fill={wing} opacity="0.5" transform="rotate(-15, 55, 95)" />
      <ellipse cx="105" cy="95" rx="20" ry="35" fill={wing} opacity="0.5" transform="rotate(15, 105, 95)" />
      {isAfter && (
        <motion.circle cx="80" cy="55" r="4" fill="#fcd34d" opacity="0.8"
          animate={{ y: [0, -5, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ filter: 'drop-shadow(0 0 4px #fcd34d)' } as React.CSSProperties}
        />
      )}
    </svg>
  )
}

function FoxSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#fb923c' : '#94a3b8'
  const belly = isAfter ? '#fed7aa' : '#cbd5e1'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="115" rx="30" ry="28" fill={body} />
      <ellipse cx="80" cy="122" rx="18" ry="16" fill={belly} opacity="0.8" />
      <circle cx="80" cy="70" r="32" fill={body} />
      <polygon points="55,48 42,18 62,42" fill={isAfter ? '#ea580c' : '#64748b'} />
      <polygon points="105,48 118,18 98,42" fill={isAfter ? '#ea580c' : '#64748b'} />
      <polygon points="55,48 48,25 58,42" fill={isAfter ? '#fed7aa' : '#cbd5e1'} />
      <polygon points="105,48 112,25 102,42" fill={isAfter ? '#fed7aa' : '#cbd5e1'} />
      <ChibiEyes cx={80} cy={65} gap={14} r={10} isAfter={isAfter} sadColor="#475569" />
      <polygon points="80,76 76,82 84,82" fill={isAfter ? '#1a1145' : '#475569'} />
      <path d="M80 145 Q105 160 120 150 Q130 145 135 150" stroke={body} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M130 146 Q138 142 140 150" fill="white" opacity="0.8" />
    </svg>
  )
}

function CatSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#a78bfa' : '#6b7280'
  const belly = isAfter ? '#ddd6fe' : '#9ca3af'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="115" rx="28" ry="30" fill={body} />
      <ellipse cx="80" cy="122" rx="17" ry="18" fill={belly} opacity="0.7" />
      <circle cx="80" cy="68" r="30" fill={body} />
      <polygon points="55,48 48,18 65,42" fill={isAfter ? '#7c3aed' : '#4b5563'} />
      <polygon points="105,48 112,18 95,42" fill={isAfter ? '#7c3aed' : '#4b5563'} />
      <polygon points="57,46 52,25 62,42" fill={isAfter ? '#ddd6fe' : '#9ca3af'} />
      <polygon points="103,46 108,25 98,42" fill={isAfter ? '#ddd6fe' : '#9ca3af'} />
      <ChibiEyes cx={80} cy={63} gap={13} r={10} isAfter={isAfter} sadColor="#475569" />
      <ellipse cx="80" cy="74" rx="3" ry="2" fill={isAfter ? '#ec4899' : '#6b7280'} />
      <line x1="50" y1="68" x2="30" y2="65" stroke={body} strokeWidth="1.5" />
      <line x1="50" y1="72" x2="30" y2="74" stroke={body} strokeWidth="1.5" />
      <line x1="110" y1="68" x2="130" y2="65" stroke={body} strokeWidth="1.5" />
      <line x1="110" y1="72" x2="130" y2="74" stroke={body} strokeWidth="1.5" />
      <ChibiMouth cx={80} cy={80} isAfter={isAfter} />
      <path d="M80 145 Q95 160 110 155 Q118 148 115 158" stroke={body} strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function DogSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#fbbf24' : '#94a3b8'
  const belly = isAfter ? '#fef3c7' : '#cbd5e1'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="115" rx="30" ry="30" fill={body} />
      <ellipse cx="80" cy="122" rx="18" ry="18" fill={belly} opacity="0.7" />
      <circle cx="80" cy="68" r="32" fill={body} />
      <ellipse cx="52" cy="52" rx="14" ry="20" fill={isAfter ? '#d97706' : '#64748b'} transform="rotate(-15, 52, 52)" />
      <ellipse cx="108" cy="52" rx="14" ry="20" fill={isAfter ? '#d97706' : '#64748b'} transform="rotate(15, 108, 52)" />
      <ChibiEyes cx={80} cy={63} gap={14} r={11} isAfter={isAfter} sadColor="#475569" />
      <ellipse cx="80" cy="76" rx="5" ry="4" fill={isAfter ? '#1a1145' : '#475569'} />
      <ChibiMouth cx={80} cy={84} isAfter={isAfter} />
      {isAfter && (
        <motion.path d="M95 82 Q110 100 105 110" stroke="#ec4899" strokeWidth="3" fill="none" strokeLinecap="round"
          animate={{ rotate: [0, 10, -5, 10, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          style={{ transformOrigin: '95px 82px' }}
        />
      )}
      <path d="M80 145 Q100 158 110 148" stroke={body} strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function BirdSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#38bdf8' : '#d4d4d8'
  const wing = isAfter ? '#0284c7' : '#a1a1aa'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      {isAfter ? (
        <>
          <ellipse cx="80" cy="100" rx="25" ry="30" fill={body} />
          <ellipse cx="80" cy="108" rx="15" ry="18" fill="#bae6fd" opacity="0.7" />
          <circle cx="80" cy="62" r="24" fill={body} />
          <ChibiEyes cx={80} cy={58} gap={10} r={8} isAfter={true} sadColor="" />
          <polygon points="80,68 75,76 85,76" fill="#f59e0b" />
          <path d="M55 90 Q35 75 40 100 L55 95" fill={wing} opacity="0.7" />
          <path d="M105 90 Q125 75 120 100 L105 95" fill={wing} opacity="0.7" />
        </>
      ) : (
        <>
          <ellipse cx="80" cy="95" rx="30" ry="28" fill="#e5e7eb" />
          <ellipse cx="80" cy="90" rx="25" ry="22" fill="#f3f4f6" />
          <path d="M65 82 Q80 70 95 82" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
          <circle cx="80" cy="78" r="3" fill="#d1d5db" />
        </>
      )}
    </svg>
  )
}

function BearSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#92400e' : '#6b7280'
  const belly = isAfter ? '#d4a574' : '#9ca3af'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="118" rx="35" ry="35" fill={body} />
      <ellipse cx="80" cy="125" rx="22" ry="22" fill={belly} opacity="0.7" />
      <circle cx="80" cy="68" r="35" fill={body} />
      <circle cx="55" cy="42" r="12" fill={body} />
      <circle cx="55" cy="42" r="7" fill={belly} />
      <circle cx="105" cy="42" r="12" fill={body} />
      <circle cx="105" cy="42" r="7" fill={belly} />
      {isAfter ? (
        <ChibiEyes cx={80} cy={63} gap={14} r={10} isAfter={true} sadColor="" />
      ) : (
        <>
          <ellipse cx={66} cy={63} rx={10} ry={3} fill="#4b5563" />
          <ellipse cx={94} cy={63} rx={10} ry={3} fill="#4b5563" />
        </>
      )}
      <ellipse cx="80" cy="76" rx="5" ry="4" fill={isAfter ? '#1a1145' : '#4b5563'} />
      <ChibiMouth cx={80} cy={82} isAfter={isAfter} />
    </svg>
  )
}

function RabbitSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#e2e8f0' : '#94a3b8'
  const inner = isAfter ? '#fda4af' : '#94a3b8'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="120" rx="26" ry="30" fill={body} />
      <ellipse cx="80" cy="128" rx="16" ry="18" fill={isAfter ? '#f8fafc' : '#cbd5e1'} opacity="0.7" />
      <circle cx="80" cy="72" r="28" fill={body} />
      <ellipse cx="65" cy="30" rx="8" ry="28" fill={body} />
      <ellipse cx="65" cy="30" rx="4" ry="20" fill={inner} opacity="0.5" />
      <ellipse cx="95" cy="30" rx="8" ry="28" fill={body} />
      <ellipse cx="95" cy="30" rx="4" ry="20" fill={inner} opacity="0.5" />
      <ChibiEyes cx={80} cy={67} gap={12} r={9} isAfter={isAfter} sadColor="#475569" />
      <ellipse cx="80" cy="78" rx="3" ry="2" fill={isAfter ? '#ec4899' : '#6b7280'} />
      <line x1="55" y1="75" x2="35" y2="72" stroke={body} strokeWidth="1" />
      <line x1="55" y1="78" x2="35" y2="80" stroke={body} strokeWidth="1" />
      <line x1="105" y1="75" x2="125" y2="72" stroke={body} strokeWidth="1" />
      <line x1="105" y1="78" x2="125" y2="80" stroke={body} strokeWidth="1" />
      <circle cx="80" cy="150" r="8" fill={body} />
    </svg>
  )
}

function TurtleSVG({ w, h, isAfter }: SVGProps) {
  const shell = isAfter ? '#22c55e' : '#6b7280'
  const skin = isAfter ? '#86efac' : '#9ca3af'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="105" rx="45" ry="30" fill={shell} />
      <ellipse cx="80" cy="100" rx="38" ry="22" fill={isAfter ? '#15803d' : '#4b5563'} opacity="0.5" />
      <path d="M60 95 L80 80 L100 95" stroke={isAfter ? '#166534' : '#374151'} strokeWidth="2" fill="none" />
      <path d="M55 105 L80 95 L105 105" stroke={isAfter ? '#166534' : '#374151'} strokeWidth="2" fill="none" />
      <circle cx="80" cy="72" r="20" fill={skin} />
      <ChibiEyes cx={80} cy={68} gap={8} r={7} isAfter={isAfter} sadColor="#475569" />
      <ChibiMouth cx={80} cy={78} isAfter={isAfter} />
      <ellipse cx="45" cy="120" rx="10" ry="6" fill={skin} />
      <ellipse cx="115" cy="120" rx="10" ry="6" fill={skin} />
      <ellipse cx="55" cy="130" rx="8" ry="5" fill={skin} />
      <ellipse cx="105" cy="130" rx="8" ry="5" fill={skin} />
      <path d="M120 110 Q135 112 130 118" stroke={skin} strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function WolfSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#6b7280' : '#4b5563'
  const belly = isAfter ? '#d1d5db' : '#6b7280'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="118" rx="30" ry="30" fill={body} />
      <ellipse cx="80" cy="125" rx="18" ry="18" fill={belly} opacity="0.7" />
      <circle cx="80" cy="68" r="32" fill={body} />
      <polygon points="55,46 45,15 65,40" fill={isAfter ? '#374151' : '#374151'} />
      <polygon points="105,46 115,15 95,40" fill={isAfter ? '#374151' : '#374151'} />
      <ChibiEyes cx={80} cy={63} gap={14} r={10} isAfter={isAfter} sadColor="#1f2937" />
      <polygon points="80,74 76,80 84,80" fill={isAfter ? '#1a1145' : '#374151'} />
      {isAfter ? (
        <ChibiMouth cx={80} cy={85} isAfter={true} />
      ) : (
        <path d="M74 85 Q80 82 86 85" stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      <path d="M80 148 Q100 160 115 152 Q122 148 120 155" stroke={body} strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function PenguinSVG({ w, h, isAfter }: SVGProps) {
  const body = isAfter ? '#1e293b' : '#1e293b'
  const belly = isAfter ? '#f0f9ff' : '#fecaca'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <ellipse cx="80" cy="115" rx="30" ry="38" fill={body} />
      <ellipse cx="80" cy="122" rx="20" ry="28" fill={belly} />
      <circle cx="80" cy="65" r="28" fill={body} />
      <circle cx="80" cy="65" r="20" fill="white" />
      <ChibiEyes cx={80} cy={62} gap={10} r={8} isAfter={isAfter} sadColor="#475569" />
      <polygon points="80,70 74,78 86,78" fill="#f59e0b" />
      <path d="M50 100 Q35 115 45 135" fill={body} />
      <path d="M110 100 Q125 115 115 135" fill={body} />
      <ellipse cx="70" cy="153" rx="10" ry="5" fill="#f59e0b" />
      <ellipse cx="90" cy="153" rx="10" ry="5" fill="#f59e0b" />
      {!isAfter && (
        <>
          <circle cx="65" cy="55" r="3" fill="#ef4444" opacity="0.4" />
          <circle cx="95" cy="55" r="3" fill="#ef4444" opacity="0.4" />
          <motion.path d="M70 48 Q80 42 90 48" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.4"
            animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} />
        </>
      )}
    </svg>
  )
}

function TreeSpiritSVG({ w, h, isAfter }: SVGProps) {
  const trunk = isAfter ? '#92400e' : '#4b5563'
  const leaves = isAfter ? '#22c55e' : '#6b7280'
  return (
    <svg width={w} height={h} viewBox="0 0 160 180" fill="none">
      <rect x="68" y="100" width="24" height="60" rx="6" fill={trunk} />
      <circle cx="80" cy="70" r="40" fill={leaves} />
      <circle cx="60" cy="55" r="25" fill={leaves} />
      <circle cx="100" cy="55" r="25" fill={leaves} />
      <circle cx="80" cy="45" r="20" fill={isAfter ? '#16a34a' : '#4b5563'} />
      <ChibiEyes cx={80} cy={72} gap={12} r={8} isAfter={isAfter} sadColor="#374151" />
      <ChibiMouth cx={80} cy={84} isAfter={isAfter} />
      {isAfter && (
        <>
          <circle cx="55" cy="50" r="4" fill="#fbbf24" opacity="0.6" style={{ filter: 'drop-shadow(0 0 3px #fbbf24)' }} />
          <circle cx="100" cy="45" r="3" fill="#fbbf24" opacity="0.5" style={{ filter: 'drop-shadow(0 0 3px #fbbf24)' }} />
          <circle cx="85" cy="38" r="3" fill="#fbbf24" opacity="0.4" style={{ filter: 'drop-shadow(0 0 3px #fbbf24)' }} />
        </>
      )}
    </svg>
  )
}
