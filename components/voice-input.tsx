"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface VoiceInputProps {
  onTranscript: (transcript: string) => void
  isListening: boolean
  setIsListening: (listening: boolean) => void
  disabled?: boolean
  className?: string
}

export default function VoiceInput({
  onTranscript,
  isListening,
  setIsListening,
  disabled = false,
  className = ""
}: VoiceInputProps) {
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if Web Speech API is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true)
      initializeSpeechRecognition()
    } else {
      setError("Voice recognition is not supported in this browser")
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const initializeSpeechRecognition = () => {
    try {
      // Use the appropriate SpeechRecognition constructor
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setError(null)
        setTranscript("")
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        const fullTranscript = finalTranscript + interimTranscript
        setTranscript(fullTranscript)

        // If we have a final result, send it to the parent
        if (finalTranscript) {
          onTranscript(finalTranscript.trim())
          setTranscript("")
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setError(`Voice recognition error: ${event.error}`)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } catch (err) {
      console.error('Error initializing speech recognition:', err)
      setError("Failed to initialize voice recognition")
    }
  }

  const toggleListening = () => {
    if (!isSupported || disabled) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (err) {
        console.error('Error starting speech recognition:', err)
        setError("Failed to start voice recognition")
      }
    }
  }

  if (!isSupported) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Badge variant="secondary" className="text-xs">
          Voice input not supported
        </Badge>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Voice Input Button */}
      <Button
        onClick={toggleListening}
        disabled={disabled || !isSupported}
        variant={isListening ? "destructive" : "outline"}
        size="lg"
        className={`relative w-16 h-16 rounded-full transition-all duration-300 ${
          isListening 
            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
            : "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300"
        }`}
      >
        {isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
        
        {/* Animated ring when listening */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
        )}
      </Button>

      {/* Status and Transcript */}
      <div className="text-center space-y-2">
        {isListening && (
          <div className="flex items-center justify-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-gray-600">Listening...</span>
          </div>
        )}

        {transcript && (
          <div className="max-w-xs p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 italic">"{transcript}"</p>
          </div>
        )}

        {error && (
          <Badge variant="destructive" className="text-xs">
            {error}
          </Badge>
        )}

        {/* Instructions */}
        {!isListening && !error && (
          <p className="text-xs text-gray-500 max-w-xs">
            Tap the microphone to start voice input
          </p>
        )}
      </div>
    </div>
  )
} 