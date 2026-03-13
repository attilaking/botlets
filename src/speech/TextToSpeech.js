// Text-to-Speech wrapper — gives each bot a unique voice
const voices = {}
let voicesLoaded = false

// Load available voices
function loadVoices() {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    let available = synth.getVoices()
    
    if (available.length > 0) {
      voicesLoaded = true
      resolve(available)
      return
    }
    
    synth.onvoiceschanged = () => {
      available = synth.getVoices()
      voicesLoaded = true
      resolve(available)
    }
  })
}

// Speak text as a specific bot
export async function speak(text, bot) {
  if (!window.speechSynthesis) return
  
  // Cancel any current speech
  window.speechSynthesis.cancel()
  
  if (!voicesLoaded) {
    await loadVoices()
  }
  
  const utterance = new SpeechSynthesisUtterance(text)
  
  // Set voice characteristics based on bot
  utterance.pitch = bot.voicePitch || 1.0
  utterance.rate = bot.voiceRate || 1.0
  utterance.volume = 0.8
  
  // Try to pick a good voice
  const available = window.speechSynthesis.getVoices()
  const englishVoices = available.filter(v => v.lang.startsWith('en'))
  
  if (englishVoices.length > 0) {
    // Assign consistent voice based on bot id hash
    const hash = bot.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    utterance.voice = englishVoices[hash % englishVoices.length]
  }
  
  window.speechSynthesis.speak(utterance)
}

// Stop speaking
export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
