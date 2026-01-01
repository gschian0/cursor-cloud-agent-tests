'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (event: EventFormData) => Promise<void>
  initialStart?: Date
  initialEnd?: Date
  initialData?: Partial<EventFormData>
  isEdit?: boolean
}

export interface EventFormData {
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  color: string
  allDay: boolean
  generateImage?: boolean
  imageUrl?: string
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
  initialStart,
  initialEnd,
  initialData,
  isEdit = false,
}: CreateEventModalProps) {
  const [loading, setLoading] = useState(false)
  
  // Get default event color from theme
  const getDefaultEventColor = () => {
    if (typeof window === 'undefined') return '#3b82f6'
    const computed = getComputedStyle(document.documentElement)
    return computed.getPropertyValue('--event-default-color').trim() || 
           computed.getPropertyValue('--primary-color').trim() || 
           '#3b82f6'
  }
  
  // Helper to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    color: '#3b82f6', // Will be updated on mount
    allDay: false,
    generateImage: false,
    imageUrl: '',
  })
  
  // Update default color when theme changes
  useEffect(() => {
    const updateColor = () => {
      if (!isEdit && !initialData?.color) {
        setFormData(prev => ({
          ...prev,
          color: prev.color === '#3b82f6' ? getDefaultEventColor() : prev.color
        }))
      }
    }
    updateColor()
    window.addEventListener('theme-updated', updateColor)
    return () => window.removeEventListener('theme-updated', updateColor)
  }, [isEdit, initialData])

  // Reset form when modal opens/closes or when initial values change
  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        // Edit mode - use initialData
        // Convert ISO dates to local datetime format for datetime-local inputs
        const formatForInput = (dateString: string) => {
          if (!dateString) return ''
          const date = new Date(dateString)
          // Get local date/time components
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          return `${year}-${month}-${day}T${hours}:${minutes}`
        }
        
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          startTime: formatForInput(initialData.startTime || ''),
          endTime: formatForInput(initialData.endTime || ''),
          location: initialData.location || '',
          color: initialData.color || getDefaultEventColor(),
          allDay: initialData.allDay || false,
          generateImage: false,
          imageUrl: initialData.imageUrl || '',
        })
      } else if (initialStart && initialEnd) {
        // New event with selected slot - use initialStart/initialEnd
        setFormData({
          title: '',
          description: '',
          startTime: formatDateTimeLocal(initialStart),
          endTime: formatDateTimeLocal(initialEnd),
          location: '',
          color: getDefaultEventColor(),
          allDay: false,
          generateImage: false,
          imageUrl: '',
        })
      } else {
        // New event without selected slot - reset to empty
        setFormData({
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          location: '',
          color: getDefaultEventColor(),
          allDay: false,
          generateImage: false,
          imageUrl: '',
        })
      }
    }
  }, [isOpen, isEdit, initialData, initialStart, initialEnd])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      // Only close if onSubmit succeeds (doesn't throw)
      onClose()
    } catch (error) {
      console.error('Failed to create event:', error)
      // Keep modal open on error so user can fix and retry
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="modern-modal w-full max-w-2xl mx-auto my-auto max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{isEdit ? 'Edit Event' : 'Create Event'}</h2>
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
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--background-color)',
                border: `1px solid var(--border-color)`,
                focusRingColor: 'var(--primary-color)',
              }}
              placeholder="Team meeting"
            />
          </div>

          <div className="flex-shrink-0">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--background-color)',
                border: `1px solid var(--border-color)`,
              }}
              rows={2}
              placeholder="Event details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime || ''}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="modern-input w-full px-3 py-2 focus:outline-none"
                style={{
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime || ''}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="modern-input w-full px-3 py-2 focus:outline-none"
                style={{
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--background-color)',
                border: `1px solid var(--border-color)`,
              }}
              placeholder="Conference Room A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Color
              </label>
              <input
                type="color"
                value={formData.color || getDefaultEventColor()}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full h-10 px-1 py-1 rounded-md focus:outline-none focus:ring-2"
                style={{
                  border: `1px solid var(--border-color)`,
                }}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay || false}
                onChange={(e) =>
                  setFormData({ ...formData, allDay: e.target.checked })
                }
                className="w-4 h-4 rounded focus:ring-2"
                style={{
                  accentColor: 'var(--primary-color)',
                  borderColor: 'var(--border-color)',
                }}
              />
              <label htmlFor="allDay" className="ml-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                All Day Event
              </label>
            </div>
          </div>

          <div className="flex-shrink-0">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Event Image URL
            </label>
            <input
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--background-color)',
                border: `1px solid var(--border-color)`,
              }}
              placeholder="Leave empty to auto-generate from event info"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {isEdit 
                ? 'Enter an image URL or leave empty to generate a new AI image based on the event details.'
                : 'If left empty, an image will be automatically generated based on the event information.'}
            </p>
            {formData.imageUrl && (
              <div className="mt-2">
                <img 
                  src={formData.imageUrl} 
                  alt="Event preview" 
                  className="w-full max-w-xs rounded-md object-contain"
                  style={{ 
                    border: `1px solid var(--border-color)`,
                    maxHeight: '150px'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="generateImage"
              checked={formData.generateImage || false}
              onChange={(e) =>
                setFormData({ ...formData, generateImage: e.target.checked })
              }
              className="w-4 h-4 rounded focus:ring-2"
              style={{
                accentColor: 'var(--primary-color)',
                borderColor: 'var(--border-color)',
              }}
            />
            <label htmlFor="generateImage" className="ml-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              {isEdit ? 'Generate New AI Image (if no image URL provided)' : 'Generate AI Image for Event'}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 sm:pt-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md transition-colors"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--surface-color)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white rounded-md disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: 'var(--primary-color)' }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
