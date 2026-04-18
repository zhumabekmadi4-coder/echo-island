// Speech recognition abstraction
// Switches between Web Speech API and Whisper via VITE_SPEECH_ENGINE env var

const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition

export function isSpeechSupported(): boolean {
  return !!SpeechRecognitionAPI
}

export async function recognizeSpeech(): Promise<string> {
  if (import.meta.env.VITE_SPEECH_ENGINE === 'whisper') {
    return await recognizeViaWhisper()
  }
  return await recognizeViaWebSpeech()
}

function recognizeViaWebSpeech(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognitionAPI) {
      reject(new Error('speech_not_supported'))
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 3
    recognition.continuous = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Check all alternatives for a better match
      const results: string[] = []
      for (let i = 0; i < event.results[0].length; i++) {
        results.push(event.results[0][i].transcript.trim().toLowerCase())
      }
      resolve(results.join('|'))
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        reject(new Error('mic_permission_denied'))
      } else if (event.error === 'no-speech') {
        reject(new Error('no_speech_detected'))
      } else {
        reject(new Error(event.error))
      }
    }

    recognition.onnomatch = () => {
      resolve('')
    }

    recognition.start()
  })
}

async function recognizeViaWhisper(): Promise<string> {
  // Stub for future Whisper API integration
  throw new Error('Whisper not implemented yet. Set VITE_SPEECH_ENGINE=webspeech')
}

// Fuzzy word matching — checks if expected word appears in recognized text
export function checkWord(recognized: string, expected: string): boolean {
  const normalizedExpected = expected.toLowerCase().trim()
  const alternatives = recognized.toLowerCase().split('|')

  return alternatives.some((alt) => {
    const normalized = alt.trim()
    // Exact match or contained within
    return normalized === normalizedExpected || normalized.includes(normalizedExpected)
  })
}

// --- Web Speech Synthesis ---

let primed = false

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof globalThis.speechSynthesis !== 'undefined' &&
    typeof globalThis.SpeechSynthesisUtterance !== 'undefined'
  )
}

export function primeSpeechSynthesis(): void {
  if (primed) return
  if (!isSpeechSynthesisSupported()) return
  const u = new SpeechSynthesisUtterance('')
  window.speechSynthesis.speak(u)
  primed = true
}

export function speakEnglish(text: string): Promise<void> {
  return speakInternal(text, 'en-US')
}

export function speakLocalized(text: string, lang: 'ru' | 'kk'): Promise<void> {
  const locale = lang === 'ru' ? 'ru-RU' : 'kk-KZ'
  return speakInternal(text, locale)
}

function speakInternal(text: string, lang: string): Promise<void> {
  if (!isSpeechSynthesisSupported()) return Promise.resolve()
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}
