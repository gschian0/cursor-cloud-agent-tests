/**
 * Custom hook for speech recognition (voice-to-text)
 * Uses the Web Speech API
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseSpeechRecognitionOptions {
  onResult?: (text: string) => void
  onError?: (error: string) => void
  continuous?: boolean
  interimResults?: boolean
  lang?: string
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    onResult,
    onError,
    continuous = false,
    interimResults = false,
    lang = 'en-US',
  } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const shouldKeepListeningRef = useRef(false)
  const hasErrorRef = useRef(false)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if browser supports speech recognition
  const isSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser')
      return
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = lang

    recognition.onstart = () => {
      console.log('[Speech Recognition] Started listening')
      setIsListening(true)
      setError(null)
      setTranscript('')
      shouldKeepListeningRef.current = true
      hasErrorRef.current = false // Reset error flag on successful start
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      // Build up all results (both final and interim)
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      // Combine final and interim for real-time display
      const fullTranscript = (finalTranscript + interimTranscript).trim()
      
      // Always update transcript for real-time display
      if (fullTranscript) {
        setTranscript(fullTranscript)
        console.log('[Speech Recognition] Transcript update:', fullTranscript)
      }
      
      // Call onResult when we have final results (but don't stop listening)
      if (finalTranscript && onResult) {
        console.log('[Speech Recognition] Final result:', finalTranscript.trim())
        onResult(finalTranscript.trim())
      }
    }

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error'
      let shouldStop = true
      
      switch (event.error) {
        case 'no-speech':
          // "no-speech" is a normal timeout, not a real error - don't stop listening
          errorMessage = 'No speech detected. Please try again.'
          shouldStop = false // Don't stop on no-speech, let it auto-restart
          break
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone.'
          hasErrorRef.current = true // Stop auto-restart
          break
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.'
          hasErrorRef.current = true // Stop auto-restart
          break
        case 'network':
          errorMessage = 'Network error. Please check your connection.'
          hasErrorRef.current = true // Stop auto-restart
          break
        case 'aborted':
          // Aborted is normal when stopping manually - don't treat as error
          return
        default:
          errorMessage = `Speech recognition error: ${event.error}`
          hasErrorRef.current = true // Stop auto-restart on unknown errors
      }
      
      if (shouldStop) {
        setError(errorMessage)
        setIsListening(false)
        shouldKeepListeningRef.current = false
        
        if (onError) {
          onError(errorMessage)
        }
      } else {
        // For "no-speech", just log it but don't stop or show error
        console.log('[Speech Recognition] No speech detected (this is normal)')
      }
    }

    recognition.onend = () => {
      console.log('[Speech Recognition] Recognition ended')
      
      // Clear any pending restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = null
      }
      
      // Only auto-restart if:
      // 1. Continuous mode is enabled
      // 2. We should keep listening (user hasn't manually stopped)
      // 3. We haven't had a real error that should stop us
      if (continuous && shouldKeepListeningRef.current && !hasErrorRef.current) {
        // Keep isListening true while we restart - don't set to false
        // Add a very short delay before restarting
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldKeepListeningRef.current && !hasErrorRef.current && recognitionRef.current) {
            try {
              console.log('[Speech Recognition] Auto-restarting...')
              recognitionRef.current.start()
              // Keep isListening true - onstart will confirm it's started
            } catch (e: any) {
              // Already started or error
              if (e.name === 'InvalidStateError') {
                // Already started - that's fine, keep listening state
                console.log('[Speech Recognition] Already started (restart)')
              } else {
                console.log('[Speech Recognition] Could not restart:', e)
                setIsListening(false)
                shouldKeepListeningRef.current = false
              }
            }
          }
        }, 50) // Very short delay for faster restart
      } else {
        // Not continuous or user stopped - actually stop
        setIsListening(false)
        shouldKeepListeningRef.current = false
      }
    }

    recognitionRef.current = recognition

    return () => {
      // Clear any pending restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = null
      }
      
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isSupported, continuous, interimResults, lang, onResult, onError])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser')
      return
    }

    if (recognitionRef.current) {
      // If already listening, don't try to start again
      if (isListening) {
        return
      }
      
      try {
        setTranscript('')
        setError(null)
        shouldKeepListeningRef.current = true
        hasErrorRef.current = false // Reset error flag when manually starting
        
        // Clear any pending restart timeout
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
          restartTimeoutRef.current = null
        }
        
        recognitionRef.current.start()
        console.log('[Speech Recognition] Starting recognition...')
      } catch (error: any) {
        // If it's already started, that's okay - just update state
        if (error.name === 'InvalidStateError') {
          console.log('[Speech Recognition] Already started')
          setIsListening(true)
          shouldKeepListeningRef.current = true
        } else {
          setError('Failed to start speech recognition')
          console.error('Speech recognition start error:', error)
          shouldKeepListeningRef.current = false
          hasErrorRef.current = true
        }
      }
    }
  }, [isSupported, isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      console.log('[Speech Recognition] Stopping manually')
      shouldKeepListeningRef.current = false
      hasErrorRef.current = false // Reset error flag when manually stopping
      
      // Clear any pending restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = null
      }
      
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

