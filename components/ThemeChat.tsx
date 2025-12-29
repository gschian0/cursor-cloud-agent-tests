'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Palette, RotateCcw, Save, Trash2, Download } from 'lucide-react'

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

  const applyCSS = (css: string) => {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    // Extract CSS variables from the CSS string
    const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/)
    if (rootMatch && rootMatch[1]) {
      const cssVars = rootMatch[1]
      const varMatches = cssVars.matchAll(/--([\w-]+):\s*([^;]+);/g)
      
      // Apply each CSS variable to the document root globally
      for (const match of varMatches) {
        const varName = `--${match[1]}`
        const varValue = match[2].trim()
        root.style.setProperty(varName, varValue)
      }

      // Also ensure all text styling variables are set if not present
      const computed = getComputedStyle(root)
      if (!computed.getPropertyValue('--text-size-base')) {
        root.style.setProperty('--text-size-base', '16px')
      }
      if (!computed.getPropertyValue('--text-3d-color')) {
        const isDark = localStorage.getItem('color-theme') === 'dark'
        root.style.setProperty('--text-3d-color', isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)')
      }

      // Save to localStorage
      localStorage.setItem('custom-theme', css)
      
      // Force a re-render by dispatching a custom event
      window.dispatchEvent(new Event('theme-updated'))
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
      const saved = localStorage.getItem('custom-theme')
      if (saved) {
        applyCSS(saved)
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
          applyCSS(defaultTheme.css)
        }
      }
    } catch (error) {
      console.error('Failed to load default theme:', error)
    }
  }

  const run = async (userPrompt: string) => {
    if (!userPrompt.trim()) return

    // Add user message to conversation
    const userMessage: Message = {
      role: 'user',
      content: userPrompt,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setPrompt("")
    setLoading(true)
    setError("")

    try {
      // Get current light/dark mode preference
      const colorTheme = localStorage.getItem('color-theme') || 'light'
      
      // Send conversation history along with the new prompt
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          currentTheme: currentTheme,
          colorTheme: colorTheme, // Pass light/dark mode preference
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || "Theme generation failed")
        setLoading(false)
        return
      }

      // Apply the CSS immediately
      if (data.css) {
        applyCSS(data.css)
        // Update current theme state
        setCurrentTheme(data.css)
        // Save to localStorage for persistence
        localStorage.setItem('custom-theme', data.css)
        
        // Auto-save theme with generated name
        const themeName = generateThemeName(userPrompt)
        try {
          await fetch('/api/themes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: themeName,
              css: data.css,
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
        applyCSS(theme.css)
        setCurrentTheme(theme.css)
        localStorage.setItem('custom-theme', theme.css)
        setError("")
      }
    } catch (error) {
      setError('Failed to load theme')
    }
  }

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

  return (
    <div className="rounded-lg shadow-md p-6 flex flex-col h-full" style={{ backgroundColor: 'var(--surface-color)' }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Palette className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
            Theme Designer
          </h2>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Chat with AI to customize your app's theme. Powered by Gemini 3 Pro.
          </p>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <button
              disabled={loading}
              onClick={clearConversation}
              className="px-3 py-2 text-sm rounded-md disabled:opacity-60 flex items-center gap-2 transition-colors"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--surface-color)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--border-color)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-color)'
              }}
            >
              Clear Chat
            </button>
          )}
          <button
            disabled={loading}
            onClick={resetTheme}
            className="px-3 py-2 text-sm rounded-md disabled:opacity-60 flex items-center gap-2 transition-colors"
            style={{
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface-color)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--border-color)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-color)'
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset Theme
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[300px] max-h-[500px] pr-2"
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
                className="max-w-[80%] rounded-lg px-4 py-3"
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
                    color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
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

      {/* Input Area */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  run(prompt)
                }
              }}
              placeholder="Describe your theme... (e.g., 'dark mode', 'ocean blue', 'warm sunset')"
              className="flex-1 min-h-[80px] max-h-[200px] rounded-md p-3 focus:outline-none resize-none"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--background-color)',
                border: `1px solid var(--border-color)`,
              }}
              disabled={loading}
            />
            <button
              disabled={loading || prompt.trim().length === 0}
              onClick={() => run(prompt)}
              className="px-6 py-3 text-white rounded-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 h-fit transition-opacity"
              style={{ backgroundColor: 'var(--primary-color)' }}
              onMouseEnter={(e) => {
                if (!loading && prompt.trim().length > 0) {
                  e.currentTarget.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <Send className="w-4 h-4" />
              {loading ? "Generating..." : "Apply"}
            </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Changes apply instantly. Save themes to your collection for later use.
        </p>
      </div>
    </div>
  )
}

