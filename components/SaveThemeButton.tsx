'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'

export default function SaveThemeButton() {
  const [showDialog, setShowDialog] = useState(false)
  const [themeName, setThemeName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [hasCustomTheme, setHasCustomTheme] = useState(false)

  useEffect(() => {
    // Check if there's a custom theme
    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        const customTheme = localStorage.getItem('custom-theme')
        setHasCustomTheme(!!customTheme)
      }
    }
    
    checkTheme()
    window.addEventListener('theme-updated', checkTheme)
    return () => window.removeEventListener('theme-updated', checkTheme)
  }, [])

  const handleSave = async () => {
    if (!themeName.trim()) {
      setError('Please provide a theme name')
      return
    }

    setSaving(true)
    setError("")
    
    try {
      // Get current theme CSS
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

      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: themeName.trim(),
          css: theme,
          isDefault: false,
        }),
      })

      if (res.ok) {
        setShowDialog(false)
        setThemeName("")
        setError("")
        setHasCustomTheme(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save theme')
      }
    } catch (error) {
      setError('Failed to save theme')
    } finally {
      setSaving(false)
    }
  }

  if (!hasCustomTheme) return null

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
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
        title="Save current theme"
      >
        <Save className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Save Theme
        </span>
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDialog(false)}>
          <div
            className="modern-modal w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Save Theme</h3>
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="Theme name..."
              className="w-full px-3 py-2 rounded-md mb-4"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--background-color)',
                border: `1px solid var(--border-color)`,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                } else if (e.key === 'Escape') {
                  setShowDialog(false)
                }
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm mb-4" style={{ color: '#dc2626' }}>{error}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-md transition-colors"
                style={{
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--border-color)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !themeName.trim()}
                className="px-4 py-2 rounded-md text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

