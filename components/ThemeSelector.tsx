'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'

interface Theme {
  id: string
  name: string
  css: string
  isDefault: boolean
}

export default function ThemeSelector() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('default')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(false)

  const loadThemes = useCallback(async () => {
    // Prevent concurrent calls
    if (loadingRef.current) return
    loadingRef.current = true
    
    try {
      const res = await fetch('/api/themes')
      if (res.ok) {
        const themesData = await res.json()
        setThemes(themesData)
        
        // Check which theme is currently active
        const customTheme = localStorage.getItem('custom-theme')
        if (customTheme) {
          // Try to parse as JSON first (new format)
          let themeMatch = false
          try {
            const themeData = JSON.parse(customTheme)
            // Check if any theme matches the JSON structure
            for (const theme of themesData) {
              try {
                const themeCssData = JSON.parse(theme.css)
                if (JSON.stringify(themeCssData) === JSON.stringify(themeData)) {
                  setSelectedTheme(theme.id)
                  themeMatch = true
                  break
                }
              } catch (e) {
                // Not JSON format, skip
              }
            }
          } catch (e) {
            // Not JSON, try old format
          }
          
          if (!themeMatch) {
            // Find matching theme (old format)
            const activeTheme = themesData.find((t: Theme) => {
              try {
                // Try parsing as JSON
                const themeCss = JSON.parse(t.css)
                return false // JSON themes won't match string custom-theme
              } catch (e) {
                // Old format - direct CSS string comparison
                return t.css === customTheme
              }
            })
            if (activeTheme) {
              setSelectedTheme(activeTheme.id)
            } else {
              setSelectedTheme('custom')
            }
          }
        } else {
          setSelectedTheme('default')
        }
      }
    } catch (error) {
      console.error('Failed to load themes:', error)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    loadThemes()
    window.addEventListener('theme-updated', loadThemes)
    return () => window.removeEventListener('theme-updated', loadThemes)
  }, [loadThemes])

  const handleSelectTheme = async (themeId: string) => {
    if (themeId === 'default') {
      // Reset to default theme
      localStorage.removeItem('custom-theme')
      const colorTheme = localStorage.getItem('color-theme') || 'light'
      const root = document.documentElement
      
      if (colorTheme === 'dark') {
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
      } else {
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
      }
      
      window.dispatchEvent(new Event('theme-updated'))
    } else {
      // Load selected theme
      const theme = themes.find(t => t.id === themeId)
      if (theme) {
        const root = document.documentElement
        const currentMode = localStorage.getItem('color-theme') || 'light'
        
        // Try to parse as JSON (new format with both versions)
        let themeData
        try {
          themeData = JSON.parse(theme.css)
          if (themeData.light || themeData.dark) {
            // Apply the appropriate version based on current mode
            const cssToApply = currentMode === 'dark' && themeData.dark 
              ? themeData.dark 
              : (themeData.light || themeData.dark || '')
            
            if (cssToApply) {
              // Extract and apply CSS variables
              let cssVars = ''
              if (currentMode === 'dark') {
                const darkMatch = cssToApply.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/)
                if (darkMatch && darkMatch[1]) {
                  cssVars = darkMatch[1]
                } else {
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
                for (const match of varMatches) {
                  const varName = `--${match[1]}`
                  const varValue = match[2].trim()
                  root.style.setProperty(varName, varValue)
                }
              }
              
              // Save both versions
              localStorage.setItem('custom-theme', JSON.stringify(themeData))
              if (themeData.light) localStorage.setItem('custom-theme-light', themeData.light)
              if (themeData.dark) localStorage.setItem('custom-theme-dark', themeData.dark)
              
              // Detect if theme is light or dark based on background color
              // Wait a tick for styles to be applied
              setTimeout(() => {
                const bgColor = root.style.getPropertyValue('--background-color') || 
                               getComputedStyle(root).getPropertyValue('--background-color')
                const textColor = root.style.getPropertyValue('--text-primary') || 
                                 getComputedStyle(root).getPropertyValue('--text-primary')
                
                // More accurate detection: check if background is dark
                const isDarkTheme = bgColor && (
                  bgColor.includes('#0') || 
                  bgColor.includes('#1') || 
                  bgColor.includes('#2') ||
                  bgColor.includes('rgb(15') ||
                  bgColor.includes('rgb(30') ||
                  bgColor.includes('rgb(31') ||
                  bgColor.toLowerCase().includes('dark') ||
                  (textColor && (
                    textColor.includes('#f') ||
                    textColor.includes('#e') ||
                    textColor.includes('rgb(241') ||
                    textColor.includes('rgb(255')
                  ))
                )
                
                // Update color-theme if needed
                const newMode = isDarkTheme ? 'dark' : 'light'
                if (newMode !== currentMode) {
                  localStorage.setItem('color-theme', newMode)
                  if (newMode === 'dark') {
                    root.setAttribute('data-theme', 'dark')
                  } else {
                    root.removeAttribute('data-theme')
                  }
                  window.dispatchEvent(new Event('theme-updated'))
                } else {
                  window.dispatchEvent(new Event('theme-updated'))
                }
              }, 0)
            }
            return
          }
        } catch (e) {
          // Not JSON, use as single CSS string
        }
        
        // Old format - single CSS string
        const rootMatch = theme.css.match(/:root\s*\{([\s\S]*?)\}/)
        if (rootMatch && rootMatch[1]) {
          const cssVars = rootMatch[1]
          const varMatches = cssVars.matchAll(/--([\w-]+):\s*([^;]+);/g)
          
          for (const match of varMatches) {
            const varName = `--${match[1]}`
            const varValue = match[2].trim()
            root.style.setProperty(varName, varValue)
          }
          
          localStorage.setItem('custom-theme', theme.css)
          
          // Detect if theme is light or dark based on background color
          // Wait a tick for styles to be applied
          setTimeout(() => {
            const bgColor = root.style.getPropertyValue('--background-color') || 
                           getComputedStyle(root).getPropertyValue('--background-color')
            const textColor = root.style.getPropertyValue('--text-primary') || 
                             getComputedStyle(root).getPropertyValue('--text-primary')
            
            // More accurate detection: check if background is dark
            const isDarkTheme = bgColor && (
              bgColor.includes('#0') || 
              bgColor.includes('#1') || 
              bgColor.includes('#2') ||
              bgColor.includes('rgb(15') ||
              bgColor.includes('rgb(30') ||
              bgColor.includes('rgb(31') ||
              bgColor.toLowerCase().includes('dark') ||
              (textColor && (
                textColor.includes('#f') ||
                textColor.includes('#e') ||
                textColor.includes('rgb(241') ||
                textColor.includes('rgb(255')
              ))
            )
            
            // Update color-theme if needed
            const currentMode = localStorage.getItem('color-theme') || 'light'
            const newMode = isDarkTheme ? 'dark' : 'light'
            if (newMode !== currentMode) {
              localStorage.setItem('color-theme', newMode)
              if (newMode === 'dark') {
                root.setAttribute('data-theme', 'dark')
              } else {
                root.removeAttribute('data-theme')
              }
            }
            window.dispatchEvent(new Event('theme-updated'))
          }, 0)
        }
      }
    }
    
    setSelectedTheme(themeId)
    setIsOpen(false)
  }

  const getDisplayName = (themeId: string) => {
    if (themeId === 'default') return 'Default'
    if (themeId === 'custom') return 'Custom'
    const theme = themes.find(t => t.id === themeId)
    return theme?.name || 'Unknown'
  }

  const handleDeleteTheme = async (e: React.MouseEvent, themeId: string) => {
    e.stopPropagation() // Prevent theme selection when clicking delete
    
    if (!confirm(`Are you sure you want to delete this theme?`)) {
      return
    }

    try {
      const res = await fetch(`/api/themes/${themeId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        // If we deleted the currently selected theme, reset to default
        if (selectedTheme === themeId) {
          handleSelectTheme('default')
        }
        // Reload themes list
        await loadThemes()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete theme')
      }
    } catch (error) {
      console.error('Failed to delete theme:', error)
      alert('Failed to delete theme')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors min-w-[120px] justify-between"
        style={{
          color: 'var(--text-primary)',
          backgroundColor: 'var(--surface-color)',
          border: `1px solid var(--border-color)`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--border-color)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-color)'
        }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {loading ? 'Loading...' : getDisplayName(selectedTheme)}
        </span>
        <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 rounded-md shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto"
            style={{
              backgroundColor: 'var(--surface-color)',
              border: `1px solid var(--border-color)`,
            }}
          >
            <button
              onClick={() => handleSelectTheme('default')}
              className="w-full text-left px-4 py-2 text-sm transition-colors"
              style={{
                color: selectedTheme === 'default' ? 'var(--primary-color)' : 'var(--text-primary)',
                backgroundColor: selectedTheme === 'default' ? 'var(--border-color)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (selectedTheme !== 'default') {
                  e.currentTarget.style.backgroundColor = 'var(--border-color)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTheme !== 'default') {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              Default
            </button>
            {themes.map((theme) => (
              <div
                key={theme.id}
                className="flex items-center justify-between group"
                style={{
                  backgroundColor: selectedTheme === theme.id ? 'var(--border-color)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (selectedTheme !== theme.id) {
                    e.currentTarget.style.backgroundColor = 'var(--border-color)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTheme !== theme.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <button
                  onClick={() => handleSelectTheme(theme.id)}
                  className="flex-1 text-left px-4 py-2 text-sm transition-colors"
                  style={{
                    color: selectedTheme === theme.id ? 'var(--primary-color)' : 'var(--text-primary)',
                  }}
                >
                  {theme.name}
                </button>
                <button
                  onClick={(e) => handleDeleteTheme(e, theme.id)}
                  className="px-2 py-2 transition-colors opacity-0 group-hover:opacity-100"
                  style={{
                    color: '#dc2626',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  title="Delete theme"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}



