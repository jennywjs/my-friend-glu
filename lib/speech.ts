// Speech synthesis utility for text-to-speech functionality

interface SpeechOptions {
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
}

class SpeechService {
  private synthesis: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private isSupported: boolean = false

  constructor() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
      this.isSupported = true
      this.loadVoices()
    }
  }

  private loadVoices() {
    if (!this.synthesis) return

    // Load voices when they become available
    const loadVoicesHandler = () => {
      this.voices = this.synthesis!.getVoices()
    }

    this.synthesis.addEventListener('voiceschanged', loadVoicesHandler)
    
    // Try to load voices immediately
    this.voices = this.synthesis.getVoices()
  }

  private getPreferredVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length) return null

    // Prefer English voices, especially female ones for a more friendly tone
    const preferredVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Female') || voice.name.includes('female') || voice.name.includes('Samantha'))
    )

    if (preferredVoices.length > 0) {
      return preferredVoices[0]
    }

    // Fallback to any English voice
    const englishVoices = this.voices.filter(voice => voice.lang.startsWith('en'))
    return englishVoices.length > 0 ? englishVoices[0] : this.voices[0]
  }

  speak(text: string, options: SpeechOptions = {}) {
    if (!this.isSupported || !this.synthesis) {
      console.warn('Speech synthesis not supported')
      return
    }

    // Stop any current speech
    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Set voice
    const preferredVoice = this.getPreferredVoice()
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    // Set options
    utterance.rate = options.rate || 0.9 // Slightly slower for clarity
    utterance.pitch = options.pitch || 1.0
    utterance.volume = options.volume || 0.8

    // Add event listeners for debugging
    utterance.onstart = () => {
      console.log('Speech started:', text.substring(0, 50) + '...')
    }

    utterance.onend = () => {
      console.log('Speech ended')
    }

    utterance.onerror = (event) => {
      console.error('Speech error:', event.error)
    }

    this.synthesis.speak(utterance)
  }

  stop() {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  pause() {
    if (this.synthesis) {
      this.synthesis.pause()
    }
  }

  resume() {
    if (this.synthesis) {
      this.synthesis.resume()
    }
  }

  isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false
  }

  getSupportedVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  getSupported(): boolean {
    return this.isSupported
  }
}

// Create singleton instance
export const speechService = new SpeechService()

// Helper function to speak AI responses
export const speakAIResponse = (text: string, autoSpeak: boolean = true) => {
  if (!autoSpeak) return

  // Clean up the text for speech (remove emojis and formatting)
  const cleanText = text
    .replace(/[^\w\s.,!?-]/g, '') // Remove emojis and special characters
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()

  if (cleanText) {
    speechService.speak(cleanText)
  }
}

// Helper function to stop speech
export const stopSpeech = () => {
  speechService.stop()
} 