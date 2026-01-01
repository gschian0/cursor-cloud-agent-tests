'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Palette, RotateCcw, Save, Trash2, Download, Image as ImageIcon, X, Mic, MicOff } from 'lucide-react'
import { extractColorsFromImage, imageFileToDataUrl } from '@/lib/color-extraction'
import { sanitizeCSSForApplication } from '@/lib/css-sanitizer'
import { useSpeechRecognition } from '@/lib/useSpeechRecognition'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  css?: string
}

export default function ThemeChat() {
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load chat history from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-chat-history')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        } catch (e) {
          return []
        }
      }
    }
    return []
  })
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentTheme, setCurrentTheme] = useState<string>("")
  const [savedThemes, setSavedThemes] = useState<Array<{ id: string; name: string; css: string; isDefault: boolean }>>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [themeName, setThemeName] = useState("")
  const [savingTheme, setSavingTheme] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [extractedColors, setExtractedColors] = useState<string[]>([])
  const [extractingColors, setExtractingColors] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isApplyingCSSRef = useRef(false) // Prevent infinite loop
  const [currentThemeMode, setCurrentThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('color-theme') || 'light') as 'light' | 'dark'
    }
    return 'light'
  })

  // Track the prompt before voice input started
  const promptBeforeVoiceRef = useRef('')
  const wasListeningRef = useRef(false)

  // Speech recognition for voice input
  const { isListening, transcript, error: speechError, isSupported: speechSupported, toggleListening } = useSpeechRecognition({
    onResult: (text) => {
      // This is called when final results come in, but we handle everything in the useEffect
      console.log('[ThemeChat] Speech result received:', text)
    },
    onError: (error) => {
      console.error('[ThemeChat] Speech recognition error:', error)
    },
    continuous: true,
    interimResults: true,
  })

  // Update prompt with real-time transcription (like iPhone Notes)
  useEffect(() => {
    // When starting to listen, save the current prompt
    if (isListening && !wasListeningRef.current) {
      // Get current prompt value at the moment we start listening
      setPrompt(current => {
        promptBeforeVoiceRef.current = current
        wasListeningRef.current = true
        return current
      })
    }
  }, [isListening])

  // Update prompt with real-time transcript as you speak
  useEffect(() => {
    if (isListening && wasListeningRef.current) {
      const baseText = promptBeforeVoiceRef.current
      const fullText = baseText + (transcript ? (baseText ? ' ' : '') + transcript : '')
      setPrompt(fullText)
    } 
    // When stopped listening, finalize
    else if (!isListening && wasListeningRef.current) {
      const finalText = promptBeforeVoiceRef.current + (transcript ? (promptBeforeVoiceRef.current ? ' ' : '') + transcript : '')
      setPrompt(finalText.trim())
      promptBeforeVoiceRef.current = ''
      wasListeningRef.current = false
    }
  }, [transcript, isListening])

  // Track current theme mode for timestamp styling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateThemeMode = () => {
        const mode = localStorage.getItem('color-theme') || 'light'
        setCurrentThemeMode(mode as 'light' | 'dark')
      }
      updateThemeMode()
      window.addEventListener('theme-updated', updateThemeMode)
      return () => window.removeEventListener('theme-updated', updateThemeMode)
    }
  }, [])

  // Load current theme from CSS variables
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = getComputedStyle(document.documentElement)
      const theme = `
:root {
  --primary-color: ${root.getPropertyValue('--primary-color') || '#3b82f6'};
  --secondary-color: ${root.getPropertyValue('--secondary-color') || '#8b5cf6'};
  --background-color: ${root.getPropertyValue('--background-color') || '#ffffff'};
  --surface-color: ${root.getPropertyValue('--surface-color') || '#f9fafb'};
  --text-primary: ${root.getPropertyValue('--text-primary') || '#111827'};
  --text-secondary: ${root.getPropertyValue('--text-secondary') || '#6b7280'};
  --border-color: ${root.getPropertyValue('--border-color') || '#e5e7eb'};
  --header-bg: ${root.getPropertyValue('--header-bg') || '#ffffff'};
  --header-text: ${root.getPropertyValue('--header-text') || '#111827'};
  --calendar-bg: ${root.getPropertyValue('--calendar-bg') || '#ffffff'};
  --event-default-color: ${root.getPropertyValue('--event-default-color') || '#3b82f6'};
  --gradient-start: ${root.getPropertyValue('--gradient-start') || '#eff6ff'};
  --gradient-end: ${root.getPropertyValue('--gradient-end') || '#dbeafe'};
  --text-size-base: ${root.getPropertyValue('--text-size-base') || '16px'};
  --text-size-sm: ${root.getPropertyValue('--text-size-sm') || '14px'};
  --text-size-lg: ${root.getPropertyValue('--text-size-lg') || '18px'};
  --text-size-xl: ${root.getPropertyValue('--text-size-xl') || '20px'};
  --text-size-2xl: ${root.getPropertyValue('--text-size-2xl') || '24px'};
  --text-size-3xl: ${root.getPropertyValue('--text-size-3xl') || '30px'};
  --text-weight-normal: ${root.getPropertyValue('--text-weight-normal') || '400'};
  --text-weight-medium: ${root.getPropertyValue('--text-weight-medium') || '500'};
  --text-weight-semibold: ${root.getPropertyValue('--text-weight-semibold') || '600'};
  --text-weight-bold: ${root.getPropertyValue('--text-weight-bold') || '700'};
  --text-3d-color: ${root.getPropertyValue('--text-3d-color') || 'rgba(0, 0, 0, 0.3)'};
}`
      setCurrentTheme(theme)
    }
  }, [])

  // Save chat history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('theme-chat-history', JSON.stringify(messages))
    }
  }, [messages])

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const applyCSS = (css: string, skipEvent = false) => {
    if (typeof window === 'undefined') return
    
    // Prevent infinite loop - if we're already applying CSS, don't do it again
    if (isApplyingCSSRef.current) {
      return
    }
    
    isApplyingCSSRef.current = true

    try {
      const root = document.documentElement
      const currentMode = localStorage.getItem('color-theme') || 'light'
      
      // Handle both :root and [data-theme="dark"] selectors
      let cssVars = ''
      
      if (currentMode === 'dark') {
        // Try to extract dark mode CSS
        const darkMatch = css.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/)
        if (darkMatch && darkMatch[1]) {
          cssVars = darkMatch[1]
        } else {
          // Fallback to :root if no dark mode found
          const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/)
          if (rootMatch && rootMatch[1]) {
            cssVars = rootMatch[1]
          }
        }
      } else {
        // Extract light mode CSS
        const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}(?=\s*\/\*|\s*\[|$)/)
        if (rootMatch && rootMatch[1]) {
          cssVars = rootMatch[1]
        }
      }
      
      if (cssVars) {
        // Sanitize CSS before application to prevent injection attacks
        const sanitizedVars = sanitizeCSSForApplication(cssVars)
        
        // Apply each sanitized CSS variable to the document root globally
        for (const { property, value } of sanitizedVars) {
          root.style.setProperty(property, value)
        }
        
        // Log if any CSS was blocked (for debugging)
        const originalMatches = cssVars.matchAll(/--([\w-]+):\s*([^;]+);/g)
        const originalCount = Array.from(originalMatches).length
        if (sanitizedVars.length < originalCount) {
          console.warn(`[ThemeChat] ${originalCount - sanitizedVars.length} CSS variable(s) were blocked by sanitizer`)
        }

        // Also ensure all text styling variables are set if not present
        const computed = getComputedStyle(root)
        if (!computed.getPropertyValue('--text-size-base')) {
          root.style.setProperty('--text-size-base', '16px')
        }
        if (!computed.getPropertyValue('--text-3d-color')) {
          root.style.setProperty('--text-3d-color', currentMode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)')
        }
        
        // Only dispatch event if not explicitly skipped (to prevent infinite loop)
        if (!skipEvent) {
          // Use setTimeout to ensure this happens after the current call stack
          setTimeout(() => {
            window.dispatchEvent(new Event('theme-updated'))
          }, 0)
        }
      }
    } finally {
      // Reset the flag after a short delay to allow the event to process
      setTimeout(() => {
        isApplyingCSSRef.current = false
      }, 100)
    }
  }

  const resetTheme = () => {
    if (typeof window === 'undefined') return
    
    // Remove custom theme CSS variables (but keep light/dark mode theme)
    localStorage.removeItem('custom-theme')
    
    // Reload theme based on current light/dark mode preference
    const colorTheme = localStorage.getItem('color-theme') || 'light'
    const root = document.documentElement
    
    if (colorTheme === 'dark') {
      // Reset to dark mode defaults
      root.style.setProperty('--primary-color', '#60a5fa')
      root.style.setProperty('--secondary-color', '#a78bfa')
      root.style.setProperty('--background-color', '#0f172a')
      root.style.setProperty('--surface-color', '#1e293b')
      root.style.setProperty('--text-primary', '#f1f5f9')
      root.style.setProperty('--text-secondary', '#cbd5e1')
      root.style.setProperty('--border-color', '#334155')
      root.style.setProperty('--header-bg', '#1e293b')
      root.style.setProperty('--header-text', '#f1f5f9')
      root.style.setProperty('--calendar-bg', '#1e293b')
      root.style.setProperty('--event-default-color', '#60a5fa')
      root.style.setProperty('--gradient-start', '#1e293b')
      root.style.setProperty('--gradient-end', '#0f172a')
      root.style.setProperty('--text-size-base', '16px')
      root.style.setProperty('--text-size-sm', '14px')
      root.style.setProperty('--text-size-lg', '18px')
      root.style.setProperty('--text-size-xl', '20px')
      root.style.setProperty('--text-size-2xl', '24px')
      root.style.setProperty('--text-size-3xl', '30px')
      root.style.setProperty('--text-weight-normal', '400')
      root.style.setProperty('--text-weight-medium', '500')
      root.style.setProperty('--text-weight-semibold', '600')
      root.style.setProperty('--text-weight-bold', '700')
      root.style.setProperty('--text-3d-color', 'rgba(0, 0, 0, 0.5)')
    } else {
      // Reset to light mode defaults
      root.style.setProperty('--primary-color', '#3b82f6')
      root.style.setProperty('--secondary-color', '#8b5cf6')
      root.style.setProperty('--background-color', '#ffffff')
      root.style.setProperty('--surface-color', '#f9fafb')
      root.style.setProperty('--text-primary', '#111827')
      root.style.setProperty('--text-secondary', '#6b7280')
      root.style.setProperty('--border-color', '#e5e7eb')
      root.style.setProperty('--header-bg', '#ffffff')
      root.style.setProperty('--header-text', '#111827')
      root.style.setProperty('--calendar-bg', '#ffffff')
      root.style.setProperty('--event-default-color', '#3b82f6')
      root.style.setProperty('--gradient-start', '#eff6ff')
      root.style.setProperty('--gradient-end', '#dbeafe')
      root.style.setProperty('--text-size-base', '16px')
      root.style.setProperty('--text-size-sm', '14px')
      root.style.setProperty('--text-size-lg', '18px')
      root.style.setProperty('--text-size-xl', '20px')
      root.style.setProperty('--text-size-2xl', '24px')
      root.style.setProperty('--text-size-3xl', '30px')
      root.style.setProperty('--text-weight-normal', '400')
      root.style.setProperty('--text-weight-medium', '500')
      root.style.setProperty('--text-weight-semibold', '600')
      root.style.setProperty('--text-weight-bold', '700')
      root.style.setProperty('--text-3d-color', 'rgba(0, 0, 0, 0.3)')
    }
    
    // Reload current theme state
    const computed = getComputedStyle(document.documentElement)
    const theme = `
:root {
  --primary-color: ${computed.getPropertyValue('--primary-color') || '#3b82f6'};
  --secondary-color: ${computed.getPropertyValue('--secondary-color') || '#8b5cf6'};
  --background-color: ${computed.getPropertyValue('--background-color') || '#ffffff'};
  --surface-color: ${computed.getPropertyValue('--surface-color') || '#f9fafb'};
  --text-primary: ${computed.getPropertyValue('--text-primary') || '#111827'};
  --text-secondary: ${computed.getPropertyValue('--text-secondary') || '#6b7280'};
  --border-color: ${computed.getPropertyValue('--border-color') || '#e5e7eb'};
  --header-bg: ${computed.getPropertyValue('--header-bg') || '#ffffff'};
  --header-text: ${computed.getPropertyValue('--header-text') || '#111827'};
  --calendar-bg: ${computed.getPropertyValue('--calendar-bg') || '#ffffff'};
  --event-default-color: ${computed.getPropertyValue('--event-default-color') || '#3b82f6'};
  --gradient-start: ${computed.getPropertyValue('--gradient-start') || '#eff6ff'};
  --gradient-end: ${computed.getPropertyValue('--gradient-end') || '#dbeafe'};
  --text-size-base: ${computed.getPropertyValue('--text-size-base') || '16px'};
  --text-size-sm: ${computed.getPropertyValue('--text-size-sm') || '14px'};
  --text-size-lg: ${computed.getPropertyValue('--text-size-lg') || '18px'};
  --text-size-xl: ${computed.getPropertyValue('--text-size-xl') || '20px'};
  --text-size-2xl: ${computed.getPropertyValue('--text-size-2xl') || '24px'};
  --text-size-3xl: ${computed.getPropertyValue('--text-size-3xl') || '30px'};
  --text-weight-normal: ${computed.getPropertyValue('--text-weight-normal') || '400'};
  --text-weight-medium: ${computed.getPropertyValue('--text-weight-medium') || '500'};
  --text-weight-semibold: ${computed.getPropertyValue('--text-weight-semibold') || '600'};
  --text-weight-bold: ${computed.getPropertyValue('--text-weight-bold') || '700'};
  --text-3d-color: ${computed.getPropertyValue('--text-3d-color') || 'rgba(0, 0, 0, 0.3)'};
}`
    setCurrentTheme(theme)
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('theme-updated'))
  }

  // Load saved themes from database
  useEffect(() => {
    loadSavedThemes()
  }, [])

  // Load saved theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentMode = localStorage.getItem('color-theme') || 'light'
      
      // Try new format first (JSON with both versions)
      const savedJson = localStorage.getItem('custom-theme')
      if (savedJson) {
        try {
          const themeData = JSON.parse(savedJson)
          if (themeData.light || themeData.dark) {
            const cssToApply = currentMode === 'dark' && themeData.dark 
              ? themeData.dark 
              : (themeData.light || themeData.dark || '')
            if (cssToApply) {
              applyCSS(cssToApply)
              // Also save individual versions for backward compatibility
              if (themeData.light) localStorage.setItem('custom-theme-light', themeData.light)
              if (themeData.dark) localStorage.setItem('custom-theme-dark', themeData.dark)
            }
            return
          }
        } catch (e) {
          // Not JSON, try old format
        }
      }
      
      // Try individual version files
      const savedLight = localStorage.getItem('custom-theme-light')
      const savedDark = localStorage.getItem('custom-theme-dark')
      if (savedLight || savedDark) {
        const cssToApply = currentMode === 'dark' && savedDark 
          ? savedDark 
          : (savedLight || savedDark || '')
        if (cssToApply) {
          applyCSS(cssToApply)
        }
      } else {
        // Load default theme from database if available
        loadDefaultTheme()
      }
    }
  }, [])

  const loadSavedThemes = async () => {
    try {
      const res = await fetch('/api/themes')
      if (res.ok) {
        const themes = await res.json()
        setSavedThemes(themes)
      }
    } catch (error) {
      console.error('Failed to load saved themes:', error)
    }
  }

  const loadDefaultTheme = async () => {
    try {
      const res = await fetch('/api/themes')
      if (res.ok) {
        const themes = await res.json()
        const defaultTheme = themes.find((t: any) => t.isDefault)
        if (defaultTheme) {
          const currentMode = localStorage.getItem('color-theme') || 'light'
          
          // Try to parse as JSON (new format with both versions)
          let themeData
          try {
            themeData = JSON.parse(defaultTheme.css)
            if (themeData.light || themeData.dark) {
              const cssToApply = currentMode === 'dark' && themeData.dark 
                ? themeData.dark 
                : (themeData.light || themeData.dark || '')
              if (cssToApply) {
                applyCSS(cssToApply)
                // Save to localStorage
                localStorage.setItem('custom-theme', JSON.stringify(themeData))
                if (themeData.light) localStorage.setItem('custom-theme-light', themeData.light)
                if (themeData.dark) localStorage.setItem('custom-theme-dark', themeData.dark)
              }
              return
            }
          } catch (e) {
            // Not JSON, use as single CSS string
          }
          
          // Old format - single CSS string
          applyCSS(defaultTheme.css)
        }
      }
    } catch (error) {
      console.error('Failed to load default theme:', error)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    try {
      setExtractingColors(true)
      setError("")
      
      // Convert to data URL
      const imageUrl = await imageFileToDataUrl(file)
      setUploadedImage(imageUrl)
      
      // Extract colors
      const colors = await extractColorsFromImage(imageUrl, 5)
      setExtractedColors(colors)
      
      // Auto-generate theme from image
      const colorDescription = colors.join(', ')
      const imagePrompt = `Create a theme based on these colors extracted from an uploaded image: ${colorDescription}. Use these colors as the primary palette and create a cohesive, modern theme that works in both light and dark modes.`
      
      // Automatically run theme generation
      await run(imagePrompt, imageUrl, colors)
    } catch (error) {
      console.error('Failed to process image:', error)
      setError('Failed to extract colors from image')
      setExtractingColors(false)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const clearUploadedImage = () => {
    setUploadedImage(null)
    setExtractedColors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const run = async (userPrompt: string, imageUrl?: string, colors?: string[]) => {
    if (!userPrompt.trim() && !imageUrl) return

    // Add user message to conversation
    const userMessage: Message = {
      role: 'user',
      content: imageUrl ? `Generate theme from uploaded image with colors: ${colors?.join(', ')}` : userPrompt,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setPrompt("")
    setLoading(true)
    setError("")
    setExtractingColors(false)

    try {
      // Get current light/dark mode preference
      const colorTheme = localStorage.getItem('color-theme') || 'light'
      
      // Prepare request body
      const requestBody: any = {
        prompt: userPrompt || `Create a theme based on colors extracted from an uploaded image: ${colors?.join(', ')}`,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        currentTheme: currentTheme,
        colorTheme: colorTheme,
      }

      // Add image data if available
      if (imageUrl && colors && colors.length > 0) {
        requestBody.imageUrl = imageUrl
        requestBody.extractedColors = colors
      }
      
      // Send conversation history along with the new prompt
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || "Theme generation failed")
        setLoading(false)
        return
      }

      // Apply the CSS immediately - use light or dark version based on current mode
      if (data.cssLight || data.css) {
        const currentMode = localStorage.getItem('color-theme') || 'light'
        const cssToApply = currentMode === 'dark' && data.cssDark ? data.cssDark : (data.cssLight || data.css)
        
        applyCSS(cssToApply)
        
        // Store both versions in a structured format
        const themeData = {
          light: data.cssLight || data.css,
          dark: data.cssDark || data.css,
        }
        
        // Update current theme state
        setCurrentTheme(cssToApply)
        
        // Save both versions to localStorage
        localStorage.setItem('custom-theme', JSON.stringify(themeData))
        localStorage.setItem('custom-theme-light', data.cssLight || data.css)
        localStorage.setItem('custom-theme-dark', data.cssDark || data.css)
        
        // Auto-save theme with generated name (save both versions)
        const themeName = generateThemeName(userPrompt)
        try {
          // Store both versions in the CSS field as JSON
          const themeCss = JSON.stringify(themeData)
          await fetch('/api/themes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: themeName,
              css: themeCss, // Store both versions as JSON
              isDefault: false,
            }),
          })
          // Reload themes list
          await loadSavedThemes()
          // Dispatch event to update theme selector
          window.dispatchEvent(new Event('theme-updated'))
        } catch (error) {
          console.error('Failed to auto-save theme:', error)
        }
      }

      // Add assistant response to conversation
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.explanation || data.fullResponse || 'Theme updated!',
        timestamp: new Date(),
        css: data.css
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (e) {
      console.error(e)
      setError("Theme generation failed")
    } finally {
      setLoading(false)
    }
  }

  const generateThemeName = (prompt: string): string => {
    // Generate a theme name from the prompt
    const words = prompt.toLowerCase().split(/\s+/).slice(0, 3)
    const name = words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim()
    
    if (name.length > 0) {
      return name.length > 30 ? name.substring(0, 30) : name
    }
    
    // Fallback to timestamp-based name
    return `Theme ${new Date().toLocaleDateString()}`
  }

  const clearConversation = () => {
    setMessages([])
    setError("")
    setPrompt("")
    if (typeof window !== 'undefined') {
      localStorage.removeItem('theme-chat-history')
    }
  }

  const handleSaveTheme = async () => {
    if (!themeName.trim() || !currentTheme) {
      setError('Please provide a theme name')
      return
    }

    setSavingTheme(true)
    try {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: themeName.trim(),
          css: currentTheme,
          isDefault: false,
        }),
      })

      if (res.ok) {
        await loadSavedThemes()
        setShowSaveDialog(false)
        setThemeName("")
        setError("")
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save theme')
      }
    } catch (error) {
      setError('Failed to save theme')
    } finally {
      setSavingTheme(false)
    }
  }

  const handleLoadTheme = async (themeId: string) => {
    try {
      const res = await fetch(`/api/themes/${themeId}`)
      if (res.ok) {
        const theme = await res.json()
        const currentMode = localStorage.getItem('color-theme') || 'light'
        
        // Try to parse as JSON (new format with both versions)
        let themeData
        try {
          themeData = JSON.parse(theme.css)
          if (themeData.light || themeData.dark) {
            const cssToApply = currentMode === 'dark' && themeData.dark 
              ? themeData.dark 
              : (themeData.light || themeData.dark || '')
            if (cssToApply) {
              applyCSS(cssToApply)
              setCurrentTheme(cssToApply)
              // Save both versions
              localStorage.setItem('custom-theme', JSON.stringify(themeData))
              if (themeData.light) localStorage.setItem('custom-theme-light', themeData.light)
              if (themeData.dark) localStorage.setItem('custom-theme-dark', themeData.dark)
            }
            setError("")
            return
          }
        } catch (e) {
          // Not JSON, use as single CSS string
        }
        
        // Old format - single CSS string
        applyCSS(theme.css)
        setCurrentTheme(theme.css)
        localStorage.setItem('custom-theme', theme.css)
        setError("")
      }
    } catch (error) {
      setError('Failed to load theme')
    }
  }
  
  // Listen for theme changes to switch between light/dark versions
  useEffect(() => {
    const handleThemeChange = () => {
      // Skip if we're already applying CSS to prevent infinite loop
      if (isApplyingCSSRef.current) {
        return
      }
      
      const currentMode = localStorage.getItem('color-theme') || 'light'
      const savedLight = localStorage.getItem('custom-theme-light')
      const savedDark = localStorage.getItem('custom-theme-dark')
      
      if (savedLight || savedDark) {
        const cssToApply = currentMode === 'dark' && savedDark 
          ? savedDark 
          : (savedLight || savedDark || '')
        if (cssToApply) {
          // Pass skipEvent=true to prevent dispatching another event
          applyCSS(cssToApply, true)
          setCurrentTheme(cssToApply)
        }
      }
    }
    
    window.addEventListener('theme-updated', handleThemeChange)
    return () => window.removeEventListener('theme-updated', handleThemeChange)
  }, [])

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return

    try {
      const res = await fetch(`/api/themes/${themeId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadSavedThemes()
        setError("")
      } else {
        setError('Failed to delete theme')
      }
    } catch (error) {
      setError('Failed to delete theme')
    }
  }

  const handleSetDefault = async (themeId: string) => {
    try {
      const res = await fetch(`/api/themes/${themeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (res.ok) {
        await loadSavedThemes()
        setError("")
      }
    } catch (error) {
      setError('Failed to set default theme')
    }
  }

  // Helper function to get contrasting text color
  const getContrastColor = (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '')
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  return (
    <div className="rounded-lg shadow-md p-3 sm:p-6 flex flex-col min-h-0 theme-chat-container" style={{ backgroundColor: 'var(--surface-color)', height: '100%', maxHeight: 'calc(100vh - 200px)' }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Palette className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" style={{ color: 'var(--primary-color)' }} />
            <span className="truncate">Theme Designer</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            Chat with AI to customize your app's theme. Powered by Gemini 3 Pro.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {messages.length > 0 && (
            <button
              disabled={loading}
              onClick={clearConversation}
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md disabled:opacity-60 flex items-center gap-1 sm:gap-2 transition-colors touch-manipulation"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--surface-color)',
                minHeight: '44px', // iOS touch target
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--border-color)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-color)'
              }}
            >
              <span className="hidden sm:inline">Clear Chat</span>
              <span className="sm:hidden">Clear</span>
            </button>
          )}
          <button
            disabled={loading}
            onClick={resetTheme}
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md disabled:opacity-60 flex items-center gap-1 sm:gap-2 transition-colors touch-manipulation"
            style={{
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface-color)',
              minHeight: '44px', // iOS touch target
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--border-color)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-color)'
            }}
          >
            <RotateCcw className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Reset Theme</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[200px] sm:min-h-[300px] max-h-[calc(100vh-500px)] sm:max-h-[500px] pr-2 scrollbar-hide"
        style={{ 
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          overflowY: 'auto',
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            <Palette className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Start customizing your theme</p>
            <p className="text-sm mt-2">Try: "dark mode", "ocean blue theme", "warm sunset colors"</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.2 }}>
                  <Bot className="w-5 h-5" style={{ color: 'var(--primary-color)' }} />
                </div>
              )}
              <div
                className="max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 break-words"
                style={{
                  backgroundColor: message.role === 'user' ? 'var(--primary-color)' : 'var(--surface-color)',
                  color: message.role === 'user' ? 'white' : 'var(--text-primary)',
                }}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                {message.css && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                      View CSS
                    </summary>
                    <pre className="mt-2 text-xs p-2 rounded overflow-x-auto" style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-primary)' }}>
                      <code>{message.css}</code>
                    </pre>
                  </details>
                )}
                <div
                  className="text-xs mt-1"
                  style={{
                    // Always use bright white on dark backgrounds for legibility
                    // Check both state and document attribute for dark mode
                    color: (() => {
                      if (typeof window === 'undefined') {
                        return message.role === 'user' ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)'
                      }
                      
                      // Check multiple sources for dark mode
                      const storedMode = localStorage.getItem('color-theme') || 'light'
                      const docMode = document.documentElement.getAttribute('data-theme')
                      const isDark = storedMode === 'dark' || docMode === 'dark' || currentThemeMode === 'dark'
                      
                      // In dark mode, always use white for legibility
                      if (isDark) {
                        return '#ffffff'
                      }
                      
                      // In light mode, user messages always white, assistant uses secondary
                      return message.role === 'user' 
                        ? 'rgba(255,255,255,0.9)' 
                        : 'var(--text-secondary)'
                    })(),
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-color)' }}>
                  <User className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </div>
              )}
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.2 }}>
              <Bot className="w-5 h-5" style={{ color: 'var(--primary-color)' }} />
            </div>
            <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--surface-color)' }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-secondary)', animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-secondary)', animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-secondary)', animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm rounded-md p-3 mb-4" style={{ color: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
          {error}
        </div>
      )}
      {speechError && (
        <div className="text-sm rounded-md p-3 mb-4" style={{ color: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
          Voice Input Error: {speechError}
        </div>
      )}

      {/* Uploaded Image Preview */}
      {uploadedImage && (
        <div className="mb-4 p-3 sm:p-4 rounded-lg border flex-shrink-0" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="relative flex-shrink-0">
              <img 
                src={uploadedImage} 
                alt="Uploaded for theme generation" 
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg"
                style={{ border: `1px solid var(--border-color)` }}
              />
              <button
                onClick={clearUploadedImage}
                className="absolute -top-2 -right-2 w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center touch-manipulation"
                style={{ 
                  backgroundColor: 'var(--background-color)',
                  border: `1px solid var(--border-color)`,
                  color: 'var(--text-primary)',
                  minWidth: '28px',
                  minHeight: '28px',
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <p className="text-xs sm:text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Extracted Colors:
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {extractedColors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs"
                    style={{ 
                      backgroundColor: color,
                      color: getContrastColor(color),
                      minHeight: '32px', // Touch-friendly
                    }}
                  >
                    <div 
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex-shrink-0"
                      style={{ 
                        backgroundColor: color,
                        borderColor: getContrastColor(color) === '#000' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
                      }}
                    />
                    <span className="font-mono font-semibold text-xs">{color}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Theme will be generated from these colors. You can add a text description to refine it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-2 border-t pt-3 sm:pt-4 flex-shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={loading || extractingColors}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || extractingColors}
            className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity border touch-manipulation"
            style={{
              color: 'var(--text-primary)',
              backgroundColor: 'var(--background-color)',
              borderColor: 'var(--border-color)',
              minHeight: '44px', // iOS touch target
            }}
            onMouseEnter={(e) => {
              if (!loading && !extractingColors) {
                e.currentTarget.style.backgroundColor = 'var(--surface-color)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--background-color)'
            }}
          >
            <ImageIcon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{extractingColors ? 'Extracting...' : 'Upload Image'}</span>
          </button>
          <div className="flex-1 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  run(prompt, uploadedImage || undefined, extractedColors.length > 0 ? extractedColors : undefined)
                }
              }}
              placeholder={uploadedImage ? "Optionally add a description to refine the theme..." : "Describe your theme... (e.g., 'dark mode', 'ocean blue', 'warm sunset') or upload an image"}
              className="w-full min-h-[80px] sm:min-h-[80px] max-h-[120px] sm:max-h-[200px] rounded-md p-3 pr-10 focus:outline-none resize-none text-sm sm:text-base"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--background-color)',
                border: `1px solid var(--border-color)`,
                fontSize: '16px', // Prevents zoom on iOS
              }}
              disabled={loading || extractingColors}
            />
            {speechSupported && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleListening()
                }}
                disabled={loading || extractingColors}
                className={`absolute right-2 bottom-2 p-2 rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  isListening ? 'animate-pulse' : ''
                }`}
                style={{
                  color: isListening ? '#ef4444' : 'var(--text-secondary)',
                  backgroundColor: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  border: isListening ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!loading && !extractingColors) {
                    e.currentTarget.style.backgroundColor = isListening ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-color)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isListening) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
                title={isListening ? 'Stop recording (click again)' : 'Start voice input (click to record)'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <button
            disabled={loading || extractingColors || (prompt.trim().length === 0 && !uploadedImage)}
            onClick={() => run(prompt, uploadedImage || undefined, extractedColors.length > 0 ? extractedColors : undefined)}
            className="px-4 sm:px-6 py-3 text-white rounded-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity touch-manipulation whitespace-nowrap"
            style={{ 
              backgroundColor: 'var(--primary-color)',
              minHeight: '44px', // iOS touch target
            }}
            onMouseEnter={(e) => {
              if (!loading && !extractingColors && (prompt.trim().length > 0 || uploadedImage)) {
                e.currentTarget.style.opacity = '0.9'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            <Send className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm sm:text-base">
              {loading ? "Generating..." : extractingColors ? "Extracting..." : "Apply"}
            </span>
          </button>
        </div>
        <p className="text-xs px-1" style={{ color: 'var(--text-secondary)' }}>
          {uploadedImage ? 'Theme generated from image colors. Add text to refine.' : 'Upload an image to extract colors, or describe your theme. Changes apply instantly.'}
        </p>
      </div>
    </div>
  )
}

