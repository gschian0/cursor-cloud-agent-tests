'use client'

import { useState, useEffect } from 'react'
import { X, Edit2, Trash2, Calendar, MapPin, Clock, FileText } from 'lucide-react'
import CreateEventModal, { type EventFormData } from './CreateEventModal'

interface Event {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  color?: string
  allDay?: boolean
  imageUrl?: string
  contact?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface EventDetailsModalProps {
  isOpen: boolean
  event: Event | null
  onClose: () => void
  onEdit: (eventId: string, eventData: EventFormData) => Promise<void>
  onDelete: (eventId: string) => Promise<void>
}

export default function EventDetailsModal({
  isOpen,
  event,
  onClose,
  onEdit,
  onDelete,
}: EventDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Event | null>(event)

  // Update current event when event prop changes
  useEffect(() => {
    console.log('[EventDetailsModal] Event prop changed', { 
      eventId: event?.id,
      hasImageUrl: !!event?.imageUrl 
    })
    setCurrentEvent(event)
  }, [event])
  
  // Also fetch latest event data when modal opens
  useEffect(() => {
    if (isOpen && currentEvent && !currentEvent.imageUrl) {
      console.log('[EventDetailsModal] Modal opened, fetching latest event data', { eventId: currentEvent.id })
      const fetchLatest = async () => {
        try {
          const response = await fetch(`/api/events/${currentEvent.id}`)
          if (response.ok) {
            const latestEvent = await response.json()
            console.log('[EventDetailsModal] Latest event data fetched', { 
              eventId: latestEvent.id,
              hasImageUrl: !!latestEvent.imageUrl 
            })
            if (latestEvent.imageUrl || latestEvent.id !== currentEvent.id) {
              setCurrentEvent(latestEvent)
            }
          }
        } catch (error) {
          console.error('[EventDetailsModal] Failed to fetch latest event:', error)
        }
      }
      fetchLatest()
    }
  }, [isOpen, currentEvent?.id])

  // Poll for image if event doesn't have one yet
  useEffect(() => {
    // Don't poll if modal is closed, no event, or event already has image
    if (!isOpen || !currentEvent || currentEvent.imageUrl) {
      return
    }

    console.log('[EventDetailsModal] Starting image polling', { eventId: currentEvent.id })

    let pollCount = 0
    const maxPolls = 30 // Poll for up to 60 seconds (30 * 2s)
    let intervalId: NodeJS.Timeout | null = null
    let timeoutId: NodeJS.Timeout | null = null
    let isPolling = true // Flag to track if polling should continue

    const pollForImage = async (): Promise<boolean> => {
      // Check if we should stop polling
      if (!isPolling || !isOpen) {
        return true // Return true to stop
      }

      pollCount++
      console.log(`[EventDetailsModal] Polling for image (attempt ${pollCount}/${maxPolls})`, { eventId: currentEvent.id })
      
      try {
        const response = await fetch(`/api/events/${currentEvent.id}`)
        if (response.ok) {
          const updatedEvent = await response.json()
          
          // Check if event now has image
          if (updatedEvent.imageUrl) {
            console.log('[EventDetailsModal] Image found! Updating event and stopping poll', { eventId: updatedEvent.id })
            isPolling = false
            setCurrentEvent(updatedEvent)
            return true // Stop polling
          }
        } else {
          console.warn('[EventDetailsModal] Poll request failed', { 
            status: response.status,
            eventId: currentEvent.id 
          })
        }
      } catch (error) {
        console.error('[EventDetailsModal] Failed to poll for event image:', error)
      }
      
      // Check if we've exceeded max polls
      if (pollCount >= maxPolls) {
        console.log('[EventDetailsModal] Max polls reached, stopping', { eventId: currentEvent.id })
        isPolling = false
        return true // Stop polling
      }
      
      return false // Continue polling
    }

    // Initial poll
    pollForImage().then((shouldStop) => {
      if (shouldStop) {
        isPolling = false
        return
      }

      // Set up interval polling
      intervalId = setInterval(async () => {
        if (!isPolling || !isOpen) {
          if (intervalId) clearInterval(intervalId)
          return
        }
        
        const shouldStop = await pollForImage()
        if (shouldStop && intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }, 2000)

      // Set up timeout
      timeoutId = setTimeout(() => {
        console.log('[EventDetailsModal] Poll timeout reached, stopping', { eventId: currentEvent.id })
        isPolling = false
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }, 60000) // 60 seconds max
    })

    // Cleanup function
    return () => {
      console.log('[EventDetailsModal] Cleaning up poll', { eventId: currentEvent.id })
      isPolling = false
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }
  }, [isOpen, currentEvent?.id]) // Removed currentEvent?.imageUrl from deps to prevent re-triggering

  if (!isOpen || !currentEvent) return null

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return
    
    setIsDeleting(true)
    try {
      await onDelete(currentEvent.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete event:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async (eventData: EventFormData) => {
    try {
      await onEdit(currentEvent.id, eventData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update event:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (isEditing) {
    return (
      <CreateEventModal
        isOpen={true}
        onClose={() => setIsEditing(false)}
        onSubmit={handleEdit}
        initialStart={new Date(currentEvent.startTime)}
        initialEnd={new Date(currentEvent.endTime)}
        initialData={{
          title: currentEvent.title,
          description: currentEvent.description || '',
          startTime: currentEvent.startTime,
          endTime: currentEvent.endTime,
          location: currentEvent.location || '',
          color: currentEvent.color || '#3b82f6',
          allDay: currentEvent.allDay || false,
          imageUrl: currentEvent.imageUrl || '',
        }}
        isEdit={true}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="modern-modal w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-6 py-3 flex justify-between items-center flex-shrink-0" style={{ backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Event Details</h2>
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

        {/* Content */}
        <div className="p-4 space-y-4 flex-1 min-h-0 overflow-hidden">
          {/* Event Image */}
          <div className="w-full rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--surface-color)', minHeight: '200px', maxHeight: '320px' }}>
            {currentEvent.imageUrl ? (
              <img 
                src={currentEvent.imageUrl} 
                alt={currentEvent.title}
                className="w-full h-full max-h-[320px] object-contain"
                onError={(e) => {
                  // Show placeholder if image fails to load
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const placeholder = target.nextElementSibling as HTMLElement
                  if (placeholder) placeholder.style.display = 'flex'
                }}
              />
            ) : null}
            <div 
              className={`w-full h-full flex items-center justify-center ${currentEvent.imageUrl ? 'hidden' : ''}`}
              style={{ 
                backgroundColor: currentEvent.color || 'var(--primary-color)',
                opacity: 0.1,
              }}
            >
              <div className="text-center p-4">
                <div 
                  className="text-4xl font-bold mb-2"
                  style={{ color: currentEvent.color || 'var(--primary-color)' }}
                >
                  {currentEvent.title.substring(0, 2).toUpperCase()}
                </div>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {currentEvent.imageUrl ? 'Loading image...' : 'AI Image Placeholder'}
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <div 
              className="inline-block px-2 py-0.5 rounded-md text-white text-xs font-semibold mb-2"
              style={{ backgroundColor: currentEvent.color || '#3b82f6' }}
            >
              {currentEvent.allDay ? 'All Day' : ''}
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{currentEvent.title}</h3>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Date</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{formatDate(currentEvent.startTime)}</p>
              </div>
            </div>

            {!currentEvent.allDay && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Time</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>
                    {formatTime(currentEvent.startTime)} - {formatTime(currentEvent.endTime)}
                  </p>
                </div>
              </div>
            )}

            {currentEvent.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Location</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{currentEvent.location}</p>
                </div>
              </div>
            )}

            {currentEvent.description && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Description</p>
                  <p className="text-base whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{currentEvent.description}</p>
                </div>
              </div>
            )}

            {currentEvent.contact && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Contact</p>
                  <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {currentEvent.contact.firstName} {currentEvent.contact.lastName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t px-4 py-3 flex justify-end gap-3 flex-shrink-0" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-md disabled:opacity-50 transition-colors"
            style={{
              color: '#dc2626',
              backgroundColor: 'rgba(254, 242, 242, 0.8)',
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.backgroundColor = 'rgba(254, 242, 242, 1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(254, 242, 242, 0.8)'
            }}
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-md transition-opacity"
            style={{ backgroundColor: 'var(--primary-color)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            <Edit2 className="w-4 h-4" />
            Edit Event
          </button>
        </div>
      </div>
    </div>
  )
}

