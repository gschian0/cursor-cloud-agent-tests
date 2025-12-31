'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'

interface ClockTimePickerProps {
  isOpen: boolean
  initialTime: Date
  onClose: () => void
  onTimeSelect: (time: Date) => void
  position?: { x: number; y: number }
}

export default function ClockTimePicker({
  isOpen,
  initialTime,
  onClose,
  onTimeSelect,
  position,
}: ClockTimePickerProps) {
  const [selectedTime, setSelectedTime] = useState(initialTime)
  const [step, setStep] = useState<'hour' | 'minute' | 'ampm'>('hour')
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const clockRef = useRef<HTMLDivElement>(null)
  const [clockCenter, setClockCenter] = useState({ x: 0, y: 0 })
  const [radius, setRadius] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setSelectedTime(initialTime)
      setStep('hour')
      setMousePosition(null)
    }
  }, [initialTime, isOpen])

  useEffect(() => {
    if (clockRef.current && isOpen) {
      const rect = clockRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const r = Math.min(rect.width, rect.height) / 2 - 20
      setClockCenter({ x: centerX, y: centerY })
      setRadius(r)
    }
  }, [isOpen])

  const getAngleFromMouse = useCallback((clientX: number, clientY: number, snapToMarkers: boolean = false, isHour: boolean = false) => {
    const dx = clientX - clockCenter.x
    const dy = clientY - clockCenter.y
    // Calculate angle in radians, then convert to degrees
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    // Adjust so 0° is at top (12 o'clock)
    // atan2 gives -180 to 180, we want 0 to 360 with 0 at top
    angle = angle + 90
    // Normalize to 0-360 range with proper wrap-around
    if (angle < 0) angle += 360
    if (angle >= 360) angle -= 360
    
    // Snap to nearest marker if enabled
    if (snapToMarkers) {
      if (isHour) {
        // Snap to nearest hour (every 30 degrees)
        const hourAngle = (angle / 360) * 12
        const nearestHour = Math.round(hourAngle) % 12
        angle = (nearestHour / 12) * 360
      } else {
        // Snap to nearest 5-minute marker (every 30 degrees) or every minute (every 6 degrees)
        // For better UX, snap to 5-minute intervals
        const minuteAngle = (angle / 360) * 60
        const nearest5Min = Math.round(minuteAngle / 5) * 5
        angle = (nearest5Min / 60) * 360
      }
    }
    
    return angle
  }, [clockCenter])

  const getTimeFromAngle = useCallback((angle: number, isHour: boolean) => {
    if (isHour) {
      // 12-hour format - each hour is 30 degrees (360/12)
      // Handle wrap-around smoothly for 12 o'clock (0° and 360°)
      let hourValue = (angle / 360) * 12
      // Normalize to 0-12 range with proper wrap-around
      hourValue = hourValue % 12
      if (hourValue < 0) hourValue += 12
      // For values very close to 12 (near 0° or 360°), treat as 12
      if (hourValue < 0.5 || hourValue >= 11.5) {
        return 12
      }
      // Otherwise round to nearest hour
      return Math.round(hourValue) || 12
    } else {
      // Minutes - each minute is 6 degrees (360/60)
      let minuteValue = (angle / 360) * 60
      // Normalize to 0-60 range with proper wrap-around
      minuteValue = minuteValue % 60
      if (minuteValue < 0) minuteValue += 60
      // Round to nearest minute
      return Math.round(minuteValue) % 60
    }
  }, [])

  // Track mouse movement when in hour or minute step
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isOpen || !clockRef.current) return
    
    if (step === 'hour' || step === 'minute') {
      const rect = clockRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      setClockCenter({ x: centerX, y: centerY })
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      // Get angle directly from mouse position - instant following, no snapping
      const angle = getAngleFromMouse(e.clientX, e.clientY, false, false)
      
      const newTime = new Date(selectedTime)
      
      if (step === 'hour') {
        const hourValue = getTimeFromAngle(angle, true)
        // hourValue is 1-12, convert to 0-11 for setHours (0 = 12, 1-11 = 1-11)
        const hour24 = hourValue === 12 ? 0 : hourValue
        newTime.setHours(hour24, selectedTime.getMinutes(), 0, 0)
      } else if (step === 'minute') {
        const minuteValue = getTimeFromAngle(angle, false)
        newTime.setHours(selectedTime.getHours(), minuteValue, 0, 0)
      }
      
      setSelectedTime(newTime)
    }
  }, [isOpen, step, selectedTime, getAngleFromMouse, getTimeFromAngle])

  useEffect(() => {
    if (isOpen && (step === 'hour' || step === 'minute')) {
      window.addEventListener('mousemove', handleMouseMove)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [isOpen, step, handleMouseMove])

  const handleClockClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (step === 'hour') {
      setStep('minute')
    } else if (step === 'minute') {
      setStep('ampm')
    }
  }

  // Handle clicks anywhere in the modal (not just clock face)
  const handleModalClick = (e: React.MouseEvent) => {
    // Only handle clicks if we're in hour or minute step
    if (step === 'hour' || step === 'minute') {
      e.stopPropagation()
      if (step === 'hour') {
        setStep('minute')
      } else if (step === 'minute') {
        setStep('ampm')
      }
    }
  }

  const handleAmPmSelect = (isPM: boolean) => {
    const newTime = new Date(selectedTime)
    const currentHour12 = newTime.getHours() % 12 // 0-11
    const displayHour = currentHour12 === 0 ? 12 : currentHour12 // 1-12 for display
    
    if (isPM) {
      // PM: 12 PM = 12, 1-11 PM = 13-23
      newTime.setHours(displayHour === 12 ? 12 : displayHour + 12, newTime.getMinutes(), 0, 0)
    } else {
      // AM: 12 AM = 0, 1-11 AM = 1-11
      newTime.setHours(displayHour === 12 ? 0 : displayHour, newTime.getMinutes(), 0, 0)
    }
    setSelectedTime(newTime)
  }

  const getHourAngle = () => {
    if (step === 'hour' && mousePosition) {
      // Follow mouse instantly - no snapping, no delays
      return getAngleFromMouse(mousePosition.x, mousePosition.y, false, false)
    }
    // When locked, show the selected hour
    const hours = selectedTime.getHours() % 12
    if (hours === 0) return -90 // 12 o'clock
    return (hours / 12) * 360 - 90
  }

  const getMinuteAngle = () => {
    if (step === 'minute' && mousePosition) {
      // Follow mouse instantly - no snapping, no delays
      return getAngleFromMouse(mousePosition.x, mousePosition.y, false, false)
    }
    // When locked, show the selected minute
    const minutes = selectedTime.getMinutes()
    return (minutes / 60) * 360 - 90
  }

  const formatTime = () => {
    const hours = selectedTime.getHours()
    const minutes = selectedTime.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
  }

  if (!isOpen) return null

  const hourAngle = getHourAngle()
  const minuteAngle = getMinuteAngle()
  const hourHandLength = radius * 0.5
  const minuteHandLength = radius * 0.7

  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      }
    : {
        // Center on screen when position is undefined
        position: 'relative',
      }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={clockRef}
        className="modern-modal p-6"
        style={{
          ...style,
          width: '300px',
          height: '300px',
          position: 'relative',
        }}
        onClick={handleModalClick}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Set Time
          </h3>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          {/* Step indicator */}
          <div className="mb-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {step === 'hour' && 'Move mouse to set hour, then click to lock'}
            {step === 'minute' && 'Move mouse to set minute, then click to lock'}
            {step === 'ampm' && 'Select AM or PM'}
          </div>

          {/* Clock Face */}
          <div
            className="relative rounded-full border-4 cursor-pointer"
            style={{
              width: '240px',
              height: '240px',
              borderColor: step === 'hour' || step === 'minute' ? 'var(--primary-color)' : 'var(--border-color)',
              backgroundColor: 'var(--surface-color)',
            }}
          >
            {/* Hour markers */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180)
              const markerRadius = 100
              const x = 120 + Math.cos(angle) * markerRadius
              const y = 120 + Math.sin(angle) * markerRadius
              return (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'var(--text-primary)',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )
            })}

            {/* Hour numbers */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180)
              const numberRadius = 85
              const x = 120 + Math.cos(angle) * numberRadius
              const y = 120 + Math.sin(angle) * numberRadius
              const hour = i === 0 ? 12 : i
              return (
                <div
                  key={i}
                  className="absolute text-sm font-bold"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    color: 'var(--text-primary)',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {hour}
                </div>
              )
            })}

            {/* Hour hand */}
            <div
              className="absolute origin-bottom"
              style={{
                left: '50%',
                top: '50%',
                width: '4px',
                height: `${hourHandLength}px`,
                backgroundColor: step === 'hour' ? 'var(--primary-color)' : 'var(--text-secondary)',
                opacity: step === 'hour' ? 1 : 0.5,
                transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
                transformOrigin: 'bottom center',
                zIndex: 2,
                borderRadius: '2px',
                pointerEvents: 'none',
                transition: step === 'hour' ? 'none' : 'transform 0.2s ease',
              }}
            />

            {/* Minute hand */}
            <div
              className="absolute origin-bottom"
              style={{
                left: '50%',
                top: '50%',
                width: '3px',
                height: `${minuteHandLength}px`,
                backgroundColor: step === 'minute' ? 'var(--secondary-color)' : 'var(--text-secondary)',
                opacity: step === 'minute' ? 1 : (step === 'hour' ? 0.3 : 0.5),
                transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
                transformOrigin: 'bottom center',
                zIndex: 3,
                borderRadius: '2px',
                pointerEvents: 'none',
                transition: step === 'minute' ? 'none' : 'transform 0.2s ease',
              }}
            />

            {/* Center dot */}
            <div
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: '12px',
                height: '12px',
                backgroundColor: 'var(--primary-color)',
                transform: 'translate(-50%, -50%)',
                zIndex: 4,
              }}
            />
          </div>

          {/* Time display */}
          <div className="mt-4 text-center">
            <div 
              className="text-2xl font-bold" 
              style={{ 
                color: (() => {
                  // Ensure time is always legible - use dark color in light mode, white in dark mode
                  if (typeof window !== 'undefined') {
                    const storedMode = localStorage.getItem('color-theme') || 'light'
                    const docMode = document.documentElement.getAttribute('data-theme')
                    const isDark = storedMode === 'dark' || docMode === 'dark'
                    return isDark ? '#ffffff' : '#111827' // White in dark mode, dark in light mode
                  }
                  return 'var(--text-primary)'
                })(),
                textShadow: (() => {
                  // Add subtle shadow for better legibility
                  if (typeof window !== 'undefined') {
                    const storedMode = localStorage.getItem('color-theme') || 'light'
                    const docMode = document.documentElement.getAttribute('data-theme')
                    const isDark = storedMode === 'dark' || docMode === 'dark'
                    return isDark ? '0 2px 4px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
                  }
                  return 'none'
                })(),
              }}
            >
              {formatTime()}
            </div>
          </div>

          {/* AM/PM Selection */}
          {step === 'ampm' && (
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={() => handleAmPmSelect(false)}
                className="px-6 py-2 rounded-md transition-opacity font-semibold"
                style={{
                  backgroundColor: selectedTime.getHours() < 12 ? 'var(--primary-color)' : 'var(--surface-color)',
                  color: selectedTime.getHours() < 12 ? 'white' : 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  if (selectedTime.getHours() >= 12) {
                    e.currentTarget.style.opacity = '0.8'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                AM
              </button>
              <button
                onClick={() => handleAmPmSelect(true)}
                className="px-6 py-2 rounded-md transition-opacity font-semibold"
                style={{
                  backgroundColor: selectedTime.getHours() >= 12 ? 'var(--primary-color)' : 'var(--surface-color)',
                  color: selectedTime.getHours() >= 12 ? 'white' : 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  if (selectedTime.getHours() < 12) {
                    e.currentTarget.style.opacity = '0.8'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                PM
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md transition-colors"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--surface-color)',
              }}
            >
              Cancel
            </button>
            {step === 'ampm' && (
              <button
                onClick={() => {
                  onTimeSelect(selectedTime)
                  onClose()
                }}
                className="px-4 py-2 rounded-md text-white transition-opacity"
                style={{ backgroundColor: 'var(--primary-color)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Set Time
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

