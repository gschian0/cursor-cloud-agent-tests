'use client'

import { useState, useEffect } from 'react'

export default function HeaderBackground({ children }: { children: React.ReactNode }) {
  const [headerImage, setHeaderImage] = useState<string | null>(null)

  useEffect(() => {
    loadHeaderImage()
  }, [])

  const loadHeaderImage = async () => {
    try {
      const res = await fetch('/api/site-settings')
      if (res.ok) {
        const settings = await res.json()
        if (settings.headerImage) {
          setHeaderImage(settings.headerImage)
        } else {
          // Generate header based on current theme
          generateHeader()
        }
      }
    } catch (error) {
      console.error('Failed to load header image:', error)
    }
  }

  const generateHeader = async () => {
    try {
      // Get current theme colors
      const root = getComputedStyle(document.documentElement)
      const primaryColor = root.getPropertyValue('--primary-color') || '#3b82f6'
      const secondaryColor = root.getPropertyValue('--secondary-color') || '#8b5cf6'

      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'AI Calendar header banner',
          type: 'header',
          theme: `${primaryColor} and ${secondaryColor} gradient`,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.imageUrl) {
          setHeaderImage(data.imageUrl)
          // Save to database
          await fetch('/api/site-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ headerImage: data.imageUrl }),
          })
        }
      }
    } catch (error) {
      console.error('Failed to generate header:', error)
    }
  }

  return (
    <div className="relative">
      {headerImage && (
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${headerImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      {children}
    </div>
  )
}



