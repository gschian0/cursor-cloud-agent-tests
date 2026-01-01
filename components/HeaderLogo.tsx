'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'

export default function HeaderLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const loadedRef = useRef(false)
  const h1Ref = useRef<HTMLHeadingElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

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
        }
        // Don't auto-generate logo - it takes too long
        // Logo can be generated manually if needed
      }
    } catch (error) {
      console.error('Failed to load logo:', error)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = h1Ref.current?.getBoundingClientRect()
      if (rect) {
        // Map mouse position on the page to position relative to text
        // Treat the entire page as if it's the text area
        const pageWidth = window.innerWidth
        const pageHeight = window.innerHeight
        
        // Calculate what position on the text the mouse would be at
        // if we mapped the page coordinates to text coordinates
        const textCenterX = rect.left + rect.width / 2
        const textCenterY = rect.top + rect.height / 2
        
        // Map page mouse position to text-relative position
        // Scale the page coordinates to text dimensions
        const relativeX = ((e.clientX / pageWidth) * rect.width) - (rect.width / 2)
        const relativeY = ((e.clientY / pageHeight) * rect.height) - (rect.height / 2)
        
        // Normalize to -1 to 1 range
        // X controls left/right movement (invert for opposite)
        // Y controls zoom (negative = zoom out, positive = zoom in)
        const x = -(relativeX / (rect.width / 2))
        const y = relativeY / (rect.height / 2) // Positive Y = zoom in
        
        // Clamp values - very subtle
        const clampedX = Math.max(-0.15, Math.min(0.15, x)) // Very subtle horizontal movement
        const clampedY = Math.max(-0.1, Math.min(0.1, y)) // Very subtle zoom range
        
        setMousePosition({ x: clampedX, y: clampedY })
      }
    }

    // Track mouse globally across the entire page
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="flex items-center gap-4 group">
      <div className="relative">
        {logoUrl ? (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white/20 shadow-lg transition-all duration-300 group-hover:ring-white/40 group-hover:scale-105">
            <img 
              src={logoUrl} 
              alt="Smart Calendar Logo" 
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
      <h1 
        ref={h1Ref}
        className="header-3d-text relative" 
        data-text="Smart Calendar"
        style={{
          ['--positionX' as string]: mousePosition.x,
          ['--positionY' as string]: mousePosition.y,
        } as React.CSSProperties}
      >
        Smart Calendar
      </h1>
    </div>
  )
}



