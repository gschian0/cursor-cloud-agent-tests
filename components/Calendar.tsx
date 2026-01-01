'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
  onSelectSlot?: (slotInfo: { start: Date; end: Date }, e?: React.SyntheticEvent) => void
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
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null)
  const [eventTooltipPosition, setEventTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const eventTooltipRef = useRef<HTMLDivElement>(null)

  // Listen for theme updates and force re-render
  useEffect(() => {
    const handleThemeUpdate = () => {
      forceUpdate({})
    }
    
    window.addEventListener('theme-updated', handleThemeUpdate)
    return () => window.removeEventListener('theme-updated', handleThemeUpdate)
  }, [])

  // Prevent clicks on popup overlay from triggering calendar slot selection
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // If clicking on the popup overlay, stop propagation
      if (target.closest('.rbc-overlay') || target.closest('.rbc-popup')) {
        e.stopPropagation()
        e.preventDefault()
      }
    }

    // Use capture phase to catch events before they bubble
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
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
    (slotInfo: { start: Date; end: Date; action?: string }, e?: React.SyntheticEvent) => {
      // Prevent slot selection if clicking on the popup overlay
      if (e && e.target) {
        const target = e.target as HTMLElement
        // Check if click is on the popup overlay or its children
        if (target.closest('.rbc-overlay') || target.closest('.rbc-popup')) {
          e.stopPropagation()
          return
        }
      }
      if (onSelectSlot) {
        onSelectSlot({ start: slotInfo.start, end: slotInfo.end }, e)
      }
    },
    [onSelectSlot]
  )

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      if (onSelectEvent) {
        // If this is a split event (has - in the ID), find the original event
        if (event.id.includes('-') && !isNaN(Number(event.id.split('-').pop()))) {
          const originalId = event.id.split('-')[0]
          const originalEvent = events.find(e => e.id === originalId)
          if (originalEvent) {
            onSelectEvent(originalEvent)
            return
          }
        }
        onSelectEvent(event)
      }
    },
    [onSelectEvent, events]
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

  // Format time for event display
  const formatEventTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }, [])

  // Format time for tooltip display
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }, [])

  // Custom event component to show images inline
  const EventComponent = useCallback((props: any) => {
    const event = props.event as CalendarEvent
    const imageUrl = event.imageUrl || eventImages[event.id]
    // Only show loading spinner if the event is actively being polled for an image
    // This means it was recently created and doesn't have an imageUrl yet
    const isLoading = loadingImages.has(event.id) && !imageUrl
    
    // Filter out non-DOM props that react-big-calendar passes
    const { continuesPrior, continuesAfter, isAllDay, slotStart, slotEnd, ...domProps } = props
    
    // Get time for display (only if not all-day)
    const eventTime = !event.allDay ? formatEventTime(event.start) : null
    
    const handleEventMouseEnter = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setHoveredEvent(event)
      setEventTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      })
    }
    
    const handleEventMouseLeave = () => {
      // Tooltip will close when mouse moves away (handled by global mouse tracking)
    }
    
    return (
      <div 
        {...domProps} 
        onMouseEnter={handleEventMouseEnter}
        onMouseLeave={handleEventMouseLeave}
        style={{ 
          ...domProps.style,
          display: 'flex', 
          alignItems: 'center', 
          gap: '2px',
          padding: '1px 4px',
          margin: '1px 2px',
          width: 'calc(100% - 4px)',
          boxSizing: 'border-box',
        }}
      >
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt={event.title}
              style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '2px', 
                objectFit: 'cover',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.3)',
              }}
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none'
              }}
            />
            {eventTime && (
              <span style={{ 
                color: '#000000', 
                fontSize: '8px', 
                fontWeight: '600',
                flexShrink: 0,
                marginRight: '2px',
              }}>
                {eventTime}
              </span>
            )}
            <span className="rbc-event-content" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.title}
            </span>
          </>
        ) : isLoading ? (
          <>
            <Loader2 
              className="animate-spin" 
              style={{ 
                width: '10px', 
                height: '10px', 
                color: 'white',
                flexShrink: 0,
              }} 
            />
            {eventTime && (
              <span style={{ 
                color: '#000000', 
                fontSize: '8px', 
                fontWeight: '600',
                flexShrink: 0,
                marginRight: '2px',
              }}>
                {eventTime}
              </span>
            )}
            <span className="rbc-event-content" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.title}
            </span>
          </>
        ) : (
          <>
            {eventTime && (
              <span style={{ 
                color: '#000000', 
                fontSize: '8px', 
                fontWeight: '600',
                flexShrink: 0,
                marginRight: '2px',
              }}>
                {eventTime}
              </span>
            )}
            <span className="rbc-event-content" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.title}
            </span>
          </>
        )}
      </div>
    )
  }, [eventImages, loadingImages, formatEventTime])

  const components: Components<CalendarEvent> = useMemo(() => ({
    event: EventComponent,
  }), [EventComponent])

  // Split multi-day events into separate events for each day
  const splitMultiDayEvents = useCallback((events: CalendarEvent[]): CalendarEvent[] => {
    const splitEvents: CalendarEvent[] = []
    
    events.forEach(event => {
      const start = new Date(event.start)
      const end = new Date(event.end)
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      
      // If event spans multiple days, create separate events for each day
      if (startDay.getTime() !== endDay.getTime()) {
        let currentDay = new Date(startDay)
        while (currentDay <= endDay) {
          const dayStart = new Date(currentDay)
          dayStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds())
          
          const dayEnd = new Date(currentDay)
          if (currentDay.getTime() === endDay.getTime()) {
            // Last day - use original end time
            dayEnd.setHours(end.getHours(), end.getMinutes(), end.getSeconds())
          } else {
            // Middle days - full day
            dayEnd.setHours(23, 59, 59)
          }
          
          splitEvents.push({
            ...event,
            id: `${event.id}-${currentDay.getTime()}`,
            start: dayStart,
            end: dayEnd,
          })
          
          // Move to next day
          currentDay.setDate(currentDay.getDate() + 1)
        }
      } else {
        // Single day event - keep as is
        splitEvents.push(event)
      }
    })
    
    return splitEvents
  }, [])

  // Merge event images and split multi-day events
  const eventsWithImages = useMemo(() => {
    const eventsWithImages = events.map(event => ({
      ...event,
      imageUrl: event.imageUrl || eventImages[event.id] || undefined,
    }))
    return splitMultiDayEvents(eventsWithImages)
  }, [events, eventImages, splitMultiDayEvents])

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    const dateStr = date.toDateString()
    return eventsWithImages.filter(event => {
      const eventDate = new Date(event.start).toDateString()
      return eventDate === dateStr
    }).sort((a, b) => {
      // Sort by start time
      return a.start.getTime() - b.start.getTime()
    })
  }, [eventsWithImages])

  // Add hover listeners to date cells
  useEffect(() => {
    if (view !== 'month') return

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Don't show day tooltip if hovering over an event (event has its own tooltip)
      if (target.closest('.rbc-event')) return
      
      const dateCell = target.closest('.rbc-date-cell')
      if (!dateCell) return

      // Get the date from the cell - find the anchor tag with the day number
      const dateLink = dateCell.querySelector('a')
      
      // Check if this is an off-range date (previous/next month)
      const isOffRange = dateCell.classList.contains('rbc-off-range-bg') || 
                         dateCell.classList.contains('rbc-off-range') ||
                         dateCell.closest('.rbc-off-range-bg') !== null
      
      let cellDate: Date | null = null
      
      // Get all cells and cell index first
      const allCells = Array.from(document.querySelectorAll('.rbc-date-cell'))
      const cellIndex = allCells.indexOf(dateCell)
      if (cellIndex === -1) return
      
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const dayOfWeek = firstDayOfMonth.getDay()
      const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      const calculatedDay = cellIndex - dayOfWeek + 1
      
      if (dateLink) {
        // Primary method: Use the day number from the link text (what user sees)
        const dayNumberText = dateLink.textContent?.trim() || dateLink.innerText?.trim() || ''
        // Use regex to match the first number in the text
        const dayNumberMatch = dayNumberText.match(/\d+/)
        let dayNumber: number | null = null
        
        if (dayNumberMatch) {
          dayNumber = parseInt(dayNumberMatch[0], 10)
        }
        
        // Fallback: Try getting from href if text parsing failed
        if (!dayNumber || isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) {
          const href = dateLink.getAttribute('href') || ''
          const hrefMatch = href.match(/\d+/)
          if (hrefMatch) {
            const hrefDay = parseInt(hrefMatch[0], 10)
            if (!isNaN(hrefDay) && hrefDay >= 1 && hrefDay <= 31) {
              dayNumber = hrefDay
            }
          }
        }
        
        if (!dayNumber || isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) return
        
        // Determine month based on off-range detection and cell position
        // Use the day number from link text directly - it's what the user sees
        if (isOffRange) {
          // For off-range dates, determine month from cell position
          // Check if this cell is before the first day of the month
          if (calculatedDay < 1) {
            // Previous month
            cellDate = new Date(date.getFullYear(), date.getMonth() - 1, dayNumber)
          } else {
            // Next month (calculatedDay > lastDayOfMonth)
            cellDate = new Date(date.getFullYear(), date.getMonth() + 1, dayNumber)
          }
        } else {
          // Current month - use the day number directly from the link
          // Don't use calculatedDay at all - just trust the day number from the link
          cellDate = new Date(date.getFullYear(), date.getMonth(), dayNumber)
        }
      } else {
        // Fallback: Calculate from cell position when no link (empty space)
        const allCells = Array.from(document.querySelectorAll('.rbc-date-cell'))
        const cellIndex = allCells.indexOf(dateCell)
        if (cellIndex === -1) return
        
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const dayOfWeek = firstDayOfMonth.getDay()
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
        const calculatedDay = cellIndex - dayOfWeek + 1
        
        if (calculatedDay < 1) {
          // Previous month
          const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 0)
          const prevMonthLastDay = prevMonth.getDate()
          cellDate = new Date(date.getFullYear(), date.getMonth() - 1, prevMonthLastDay + calculatedDay)
        } else if (calculatedDay > lastDayOfMonth) {
          // Next month
          cellDate = new Date(date.getFullYear(), date.getMonth() + 1, calculatedDay - lastDayOfMonth)
        } else {
          // Current month
          cellDate = new Date(date.getFullYear(), date.getMonth(), calculatedDay)
        }
      }
      
      if (!cellDate) return
      
      const dayEvents = getEventsForDate(cellDate)
      
      if (dayEvents.length > 0) {
        const rect = dateCell.getBoundingClientRect()
        setHoveredDate(cellDate)
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height
        })
      }
    }

    const handleMouseLeave = () => {
      // Tooltip will close when mouse moves away (handled by global mouse tracking)
    }

    // Wait for calendar to render, then add listeners
    const timeout = setTimeout(() => {
      const dateCells = document.querySelectorAll('.rbc-date-cell')
      dateCells.forEach(cell => {
        cell.addEventListener('mouseenter', handleMouseEnter)
        cell.addEventListener('mouseleave', handleMouseLeave)
      })
    }, 100)

    return () => {
      clearTimeout(timeout)
      const dateCells = document.querySelectorAll('.rbc-date-cell')
      dateCells.forEach(cell => {
        cell.removeEventListener('mouseenter', handleMouseEnter)
        cell.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [view, date, getEventsForDate])

  const hoveredDayEvents = hoveredDate ? getEventsForDate(hoveredDate) : []

  // Track mouse position globally to detect when it leaves tooltips
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      // Check if mouse is over day tooltip
      if (tooltipRef.current) {
        const rect = tooltipRef.current.getBoundingClientRect()
        const isOverTooltip = 
          e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom
        
        if (!isOverTooltip) {
          // Check if mouse is over the date cell that triggered it
          const dateCells = document.querySelectorAll('.rbc-date-cell')
          let isOverDateCell = false
          dateCells.forEach(cell => {
            const cellRect = cell.getBoundingClientRect()
            if (
              e.clientX >= cellRect.left && 
              e.clientX <= cellRect.right && 
              e.clientY >= cellRect.top && 
              e.clientY <= cellRect.bottom
            ) {
              isOverDateCell = true
            }
          })
          
          if (!isOverDateCell) {
            setHoveredDate(null)
            setTooltipPosition(null)
          }
        }
      }
      
      // Check if mouse is over event tooltip
      if (eventTooltipRef.current) {
        const rect = eventTooltipRef.current.getBoundingClientRect()
        const isOverTooltip = 
          e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom
        
        if (!isOverTooltip) {
          // Check if mouse is over any event
          const events = document.querySelectorAll('.rbc-event')
          let isOverEvent = false
          events.forEach(eventEl => {
            const eventRect = eventEl.getBoundingClientRect()
            if (
              e.clientX >= eventRect.left && 
              e.clientX <= eventRect.right && 
              e.clientY >= eventRect.top && 
              e.clientY <= eventRect.bottom
            ) {
              isOverEvent = true
            }
          })
          
          if (!isOverEvent) {
            setHoveredEvent(null)
            setEventTooltipPosition(null)
          }
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="h-[calc(100vh-300px)] min-h-[400px] p-4 relative">
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
        popupOffset={{ x: 10, y: 10 }}
        eventLimit={2}
      />
      
      {/* Hover tooltip showing events in time grid */}
      {hoveredDate && tooltipPosition && hoveredDayEvents.length > 0 && (
        <div
          ref={tooltipRef}
          className="calendar-day-tooltip fixed z-50 bg-white rounded-lg shadow-2xl border p-4 max-h-96 overflow-y-auto"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y + 10}px`,
            transform: 'translateX(-50%)',
            minWidth: '280px',
            maxWidth: '400px',
            backgroundColor: 'var(--background-color)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            {hoveredDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="space-y-2">
            {hoveredDayEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 py-2 border-b last:border-b-0"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--text-secondary)', minWidth: '70px' }}>
                  {event.allDay ? 'All Day' : formatTime(event.start)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {event.title}
                  </div>
                  {event.location && (
                    <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                      📍 {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event hover tooltip */}
      {hoveredEvent && eventTooltipPosition && (
        <div
          ref={eventTooltipRef}
          className="calendar-event-tooltip fixed z-50 bg-white rounded-lg shadow-2xl border p-4"
          style={{
            left: `${eventTooltipPosition.x}px`,
            top: `${eventTooltipPosition.y - 10}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            minWidth: '250px',
            maxWidth: '350px',
            backgroundColor: 'var(--background-color)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {hoveredEvent.title}
          </div>
          <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Time:</span>
              <span>
                {hoveredEvent.allDay 
                  ? 'All Day' 
                  : `${formatTime(hoveredEvent.start)} - ${formatTime(hoveredEvent.end)}`}
              </span>
            </div>
            {hoveredEvent.location && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Location:</span>
                <span>{hoveredEvent.location}</span>
              </div>
            )}
            {hoveredEvent.description && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <span className="font-semibold block mb-1">Description:</span>
                <span>{hoveredEvent.description}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
