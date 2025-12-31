'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'

export default function HeaderLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      loadLogo()
    }
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
        <h1 className="header-3d-text" data-text="AI Calendar">AI Calendar</h1>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 group">
      <div className="relative">
        {logoUrl ? (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white/20 shadow-lg transition-all duration-300 group-hover:ring-white/40 group-hover:scale-105">
            <img 
              src={logoUrl} 
              alt="AI Calendar Logo" 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-white/20 shadow-lg transition-all duration-300 group-hover:ring-white/40 group-hover:scale-105">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300"></div>
      </div>
      <h1 className="header-3d-text relative" data-text="AI Calendar">
        <span className="relative z-10">AI Calendar</span>
      </h1>
    </div>
  )
}



