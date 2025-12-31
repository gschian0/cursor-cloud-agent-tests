'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

type Theme = 'light' | 'dark'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('color-theme') as Theme
      return saved || 'light'
    }
    return 'light'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for theme changes from other components (like ThemeSelector)
  useEffect(() => {
    const handleThemeUpdate = () => {
      const savedTheme = localStorage.getItem('color-theme') as Theme
      if (savedTheme && savedTheme !== theme) {
        setTheme(savedTheme)
      }
    }

    window.addEventListener('theme-updated', handleThemeUpdate)
    return () => window.removeEventListener('theme-updated', handleThemeUpdate)
  }, [theme])

  const applyTheme = (newTheme: Theme) => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    
    // Check if there's a custom theme saved (new format with both versions)
    let customThemeLight = localStorage.getItem('custom-theme-light')
    let customThemeDark = localStorage.getItem('custom-theme-dark')
    
    // Try to load from new JSON format
    const customThemeJson = localStorage.getItem('custom-theme')
    if (customThemeJson) {
      try {
        const themeData = JSON.parse(customThemeJson)
        if (themeData.light) customThemeLight = themeData.light
        if (themeData.dark) customThemeDark = themeData.dark
      } catch (e) {
        // If not JSON, treat as old format (single CSS string)
        const oldTheme = customThemeJson
        if (oldTheme && !oldTheme.startsWith('{')) {
          customThemeLight = oldTheme
          customThemeDark = oldTheme
        }
      }
    }
    
    // If custom theme exists, apply the appropriate version
    if (customThemeLight || customThemeDark) {
      try {
        const cssToApply = newTheme === 'dark' && customThemeDark 
          ? customThemeDark 
          : (customThemeLight || customThemeDark || '')
        
        if (cssToApply) {
          // Extract CSS variables based on selector
          let cssVars = ''
          
          if (newTheme === 'dark') {
            const darkMatch = cssToApply.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/)
            if (darkMatch && darkMatch[1]) {
              cssVars = darkMatch[1]
            } else {
              // Fallback to :root
              const rootMatch = cssToApply.match(/:root\s*\{([\s\S]*?)\}/)
              if (rootMatch && rootMatch[1]) {
                cssVars = rootMatch[1]
              }
            }
          } else {
            const rootMatch = cssToApply.match(/:root\s*\{([\s\S]*?)\}(?=\s*\/\*|\s*\[|$)/)
            if (rootMatch && rootMatch[1]) {
              cssVars = rootMatch[1]
            }
          }
          
          if (cssVars) {
            const varMatches = cssVars.matchAll(/--([\w-]+):\s*([^;]+);/g)
            
            // Apply custom theme variables
            for (const match of varMatches) {
              const varName = `--${match[1]}`
              const varValue = match[2].trim()
              root.style.setProperty(varName, varValue)
            }
            
            // Update text-3d-color based on light/dark mode
            if (newTheme === 'dark') {
              root.style.setProperty('--text-3d-color', 'rgba(0, 0, 0, 0.5)')
            } else {
              root.style.setProperty('--text-3d-color', 'rgba(0, 0, 0, 0.3)')
            }
            
            // Set data-theme attribute for dark mode
            if (newTheme === 'dark') {
              root.setAttribute('data-theme', 'dark')
            } else {
              root.removeAttribute('data-theme')
            }
            
            localStorage.setItem('color-theme', newTheme)
            window.dispatchEvent(new Event('theme-updated'))
            return
          }
        }
      } catch (error) {
        console.error('Failed to apply custom theme:', error)
      }
    }

    // No custom theme - apply default light/dark theme
    if (newTheme === 'dark') {
      // Dark mode colors
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
      // Text styling for dark mode
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
      root.setAttribute('data-theme', 'dark')
    } else {
      // Light mode colors
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
      // Text styling for light mode
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
      root.removeAttribute('data-theme')
    }

    localStorage.setItem('color-theme', newTheme)
    
    // Dispatch event to notify other components of theme change
    window.dispatchEvent(new Event('theme-updated'))
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
      style={{
        color: 'var(--text-primary)',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--surface-color)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
      ) : (
        <Sun className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
      )}
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {theme === 'light' ? 'Dark' : 'Light'}
      </span>
    </button>
  )
}

