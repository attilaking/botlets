// Speech-to-Text wrapper — browser native speech recognition

let recognition = null

export function startListening(onResult, onEnd) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported in this browser')
    onEnd?.()
    return false
  }
  
  // Stop any existing session
  stopListening()
  
  recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = 'en-US'
  recognition.maxAlternatives = 1
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    const confidence = event.results[0][0].confidence
    onResult?.(transcript, confidence)
  }
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error)
    onEnd?.()
  }
  
  recognition.onend = () => {
    onEnd?.()
  }
  
  recognition.start()
  return true
}

export function stopListening() {
  if (recognition) {
    try {
      recognition.stop()
    } catch (e) {
      // Ignore errors during stop
    }
    recognition = null
  }
}

export function isSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}
