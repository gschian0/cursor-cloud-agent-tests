'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, View, Components } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  color?: string
  allDay?: boolean
  imageUrl?: string
  createdAt?: string // ISO date string
}

interface CalendarComponentProps {
  events: CalendarEvent[]
  onSelectEvent?: (event: CalendarEvent) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
}

export default function CalendarComponent({
  events,
  onSelectEvent,
  onSelectSlot,
}: CalendarComponentProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [, forceUpdate] = useState({})
  const [eventImages, setEventImages] = useState<Record<string, string>>({})
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  // Listen for theme updates and force re-render
  useEffect(() => {
    const handleThemeUpdate = () => {
      forceUpdate({})
    }
    
    window.addEventListener('theme-updated', handleThemeUpdate)
    return () => window.removeEventListener('theme-updated', handleThemeUpdate)
  }, [])

  // Poll for images for events that don't have them yet and were recently created
  // Only show loading spinner for events created within the last 5 minutes
  // This ensures we only show spinners for events that are actively generating images
  useEffect(() => {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    
    const eventsNeedingImages = events.filter(e => {
      // Only poll for events that:
      // 1. Don't have an imageUrl
      // 2. Are not already being polled
      // 3. Were created recently (within last 5 minutes) - this indicates they might be generating an image
      if (e.imageUrl || loadingImages.has(e.id)) return false
      
      // If we have createdAt, check if it's recent
      if (e.createdAt) {
        const createdDate = new Date(e.createdAt)
        // Only poll if created within last 5 minutes
        return createdDate > fiveMinutesAgo
      }
      
      // If no createdAt, don't poll (likely an old event without image)
      // We only want to poll for events we know are new
      return false
    })
    
    if (eventsNeedingImages.length === 0) {
      // Clean up loading state for events that are no longer recent
      setLoadingImages(prev => {
        const next = new Set(prev)
        let changed = false
        prev.forEach(eventId => {
          const event = events.find(e => e.id === eventId)
          if (event) {
            if (event.imageUrl) {
              // Event has image now, remove from loading
              next.delete(eventId)
              changed = true
            } else if (event.createdAt) {
              const createdDate = new Date(event.createdAt)
              if (createdDate <= fiveMinutesAgo) {
                // Event is too old, stop showing loading
                next.delete(eventId)
                changed = true
              }
            }
          }
        })
        return changed ? next : prev
      })
      return
    }

    // Mark events as loading
    setLoadingImages(prev => {
      const next = new Set(prev)
      eventsNeedingImages.forEach(e => next.add(e.id))
      return next
    })

    const pollForImages = async () => {
      for (const event of eventsNeedingImages) {
        try {
          const response = await fetch(`/api/events/${event.id}`)
          if (response.ok) {
            const updatedEvent = await response.json()
            if (updatedEvent.imageUrl) {
              setEventImages(prev => ({ ...prev, [event.id]: updatedEvent.imageUrl }))
              setLoadingImages(prev => {
                const next = new Set(prev)
                next.delete(event.id)
                return next
              })
            }
          }
        } catch (error) {
          console.error(`Failed to poll for event ${event.id} image:`, error)
        }
      }
    }

    // Poll immediately, then every 3 seconds for up to 2 minutes
    // This gives enough time for image generation while not polling forever
    pollForImages()
    const interval = setInterval(pollForImages, 3000)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      // Remove from loading set after timeout
      setLoadingImages(prev => {
        const next = new Set(prev)
        eventsNeedingImages.forEach(e => next.delete(e.id))
        return next
      })
    }, 120000) // 2 minutes max

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [events, loadingImages])

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      if (onSelectSlot) {
        onSelectSlot(slotInfo)
      }
    },
    [onSelectSlot]
  )

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      if (onSelectEvent) {
        onSelectEvent(event)
      }
    },
    [onSelectEvent]
  )

  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      // Get theme color from CSS variable - always use current theme value
      let defaultColor = '#3b82f6'
      if (typeof window !== 'undefined') {
        const computed = getComputedStyle(document.documentElement)
        defaultColor = computed.getPropertyValue('--event-default-color').trim() || 
                      computed.getPropertyValue('--primary-color').trim() || 
                      '#3b82f6'
      }
      
      // Use event color if set, otherwise use theme default
      const eventColor = event.color && event.color !== '#3b82f6' ? event.color : defaultColor
      
      const style = {
        backgroundColor: eventColor,
        borderRadius: '5px',
        opacity: 1,
        color: 'white',
        border: '0px',
        display: 'block',
        fontWeight: '500',
        fontSize: '13px',
        padding: '4px 8px',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
      }
      return {
        style,
      }
    },
    [forceUpdate] // Re-compute when theme updates
  )

  // Custom event component to show images inline
  const EventComponent = useCallback((props: any) => {
    const event = props.event as CalendarEvent
    const imageUrl = event.imageUrl || eventImages[event.id]
    // Only show loading spinner if the event is actively being polled for an image
    // This means it was recently created and doesn't have an imageUrl yet
    const isLoading = loadingImages.has(event.id) && !imageUrl
    
    // Filter out non-DOM props that react-big-calendar passes
    const { continuesPrior, continuesAfter, isAllDay, slotStart, slotEnd, ...domProps } = props
    
    return (
      <div 
        {...domProps} 
        style={{ 
          ...domProps.style,
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          padding: '2px 4px',
        }}
      >
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt={event.title}
              style={{ 
                width: '18px', 
                height: '18px', 
                borderRadius: '3px', 
                objectFit: 'cover',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.3)',
              }}
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none'
              }}
            />
            <span className="rbc-event-content" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.title}
            </span>
          </>
        ) : isLoading ? (
          <>
            <Loader2 
              className="animate-spin" 
              style={{ 
                width: '14px', 
                height: '14px', 
                color: 'white',
                flexShrink: 0,
              }} 
            />
            <span className="rbc-event-content" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.title}
            </span>
          </>
        ) : (
          <span className="rbc-event-content" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {event.title}
          </span>
        )}
      </div>
    )
  }, [eventImages, loadingImages])

  const components: Components<CalendarEvent> = useMemo(() => ({
    event: EventComponent,
  }), [EventComponent])

  // Merge event images into events
  const eventsWithImages = useMemo(() => {
    return events.map(event => ({
      ...event,
      imageUrl: event.imageUrl || eventImages[event.id] || undefined,
    }))
  }, [events, eventImages])

  return (
    <div className="h-[calc(100vh-200px)] p-4">
      <BigCalendar
        localizer={localizer}
        events={eventsWithImages}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        components={components}
        popup
      />
    </div>
  )
}
