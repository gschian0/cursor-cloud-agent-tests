'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'

export default function HeaderLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLogo()
  }, [])

  const loadLogo = async () => {
    try {
      const res = await fetch('/api/site-settings')
      if (res.ok) {
        const settings = await res.json()
        if (settings.logoImage) {
          setLogoUrl(settings.logoImage)
        } else {
          // Generate logo based on current theme
          generateLogo()
        }
      }
    } catch (error) {
      console.error('Failed to load logo:', error)
    }
  }

  const generateLogo = async () => {
    setLoading(true)
    try {
      // Get current theme colors
      const root = getComputedStyle(document.documentElement)
      const primaryColor = root.getPropertyValue('--primary-color') || '#3b82f6'
      const secondaryColor = root.getPropertyValue('--secondary-color') || '#8b5cf6'

      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'AI Calendar logo',
          type: 'logo',
          theme: `${primaryColor} and ${secondaryColor}`,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.imageUrl) {
          setLogoUrl(data.imageUrl)
          // Save to database
          await fetch('/api/site-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logoImage: data.imageUrl }),
          })
        }
      }
    } catch (error) {
      console.error('Failed to generate logo:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--header-text)' }}>AI Calendar</h1>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt="AI Calendar Logo" 
          className="w-8 h-8 object-contain"
        />
      ) : (
        <CalendarIcon className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
      )}
      <h1 className="text-2xl font-bold" style={{ color: 'var(--header-text)' }}>AI Calendar</h1>
    </div>
  )
}



