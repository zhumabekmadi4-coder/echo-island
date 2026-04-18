import { createContext, useContext } from 'react'
import type { Power } from '@/engine/EchoProgress'

export type Mood = 'idle' | 'listening' | 'talking' | 'celebrating'

export type Anchor =
  | { mode: 'corner' }
  | { mode: 'center-top' }
  | { mode: 'scene'; x: number; y: number }

export interface SpeakInput {
  ru: string
  kk: string
  en?: string
}

export interface EchoContextValue {
  power: Power
  mood: Mood
  bubbleText: string | null
  anchor: Anchor
  speak: (input: SpeakInput, opts?: { mood?: Mood; duration?: number }) => Promise<void>
  setMood: (m: Mood) => void
  setAnchor: (a: Anchor) => void
  levelUpFlash: Power | null
}

export const EchoContext = createContext<EchoContextValue | null>(null)

export function useEcho(): EchoContextValue {
  const ctx = useContext(EchoContext)
  if (!ctx) throw new Error('useEcho must be used inside <EchoLayout>')
  return ctx
}
