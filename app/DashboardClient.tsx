'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar as CalendarIcon, Users, Plus, LogOut, Sparkles, Palette, Image as ImageIcon } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import HeaderLogo from '@/components/HeaderLogo'
import HeaderBackground from '@/components/HeaderBackground'
import SaveThemeButton from '@/components/SaveThemeButton'
import ThemeSelector from '@/components/ThemeSelector'
import { signOut, useSession } from 'next-auth/react'
import CalendarComponent from '@/components/Calendar'
import CreateEventModal, { type EventFormData } from '@/components/CreateEventModal'
import EventDetailsModal from '@/components/EventDetailsModal'
import CreateContactModal, { type ContactFormData } from '@/components/CreateContactModal'
import ContactDetailsModal from '@/components/ContactDetailsModal'
import ContactsList from '@/components/ContactsList'
import AiAssistant from '@/components/AiAssistant'
import ThemeChat from '@/components/ThemeChat'
import ImageGenerator from '@/components/ImageGenerator'
import ClockTimePicker from '@/components/ClockTimePicker'

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

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  tags: string[]
  imageUrl?: string
}

export default function DashboardClient() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<'calendar' | 'contacts' | 'ai' | 'theme' | 'image'>('calendar')
  const [events, setEvents] = useState<Event[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showContactDetailsModal, setShowContactDetailsModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [showClockPicker, setShowClockPicker] = useState(false)
  const [clockPickerPosition, setClockPickerPosition] = useState<{ x: number; y: number } | undefined>()
  const [clockPickerDate, setClockPickerDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [eventsRes, contactsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/contacts'),
      ])

      if (eventsRes.status === 401 || contactsRes.status === 401) {
        window.location.href = '/auth/signin'
        return
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData || [])
      } else {
        const errorData = await eventsRes.json().catch(() => ({}))
        console.error('Failed to fetch events:', errorData)
        setEvents([])
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        setContacts(contactsData || [])
      } else {
        const errorData = await contactsRes.json().catch(() => ({}))
        console.error('Failed to fetch contacts:', errorData)
        setContacts([])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setEvents([])
      setContacts([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Silent refresh that doesn't show loading state
  const refreshData = useCallback(async () => {
    try {
      const [eventsRes, contactsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/contacts'),
      ])

      if (eventsRes.status === 401 || contactsRes.status === 401) {
        return // Don't redirect on silent refresh
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        console.log('Refreshed events:', eventsData?.length || 0, 'events')
        setEvents(eventsData || [])
      } else {
        const errorData = await eventsRes.json().catch(() => ({}))
        console.error('Failed to fetch events during refresh:', eventsRes.status, errorData)
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        console.log('Refreshed contacts:', contactsData?.length || 0, 'contacts')
        setContacts(contactsData || [])
      } else {
        const errorData = await contactsRes.json().catch(() => ({}))
        console.error('Failed to fetch contacts during refresh:', contactsRes.status, errorData)
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      window.location.href = '/auth/signin'
      return
    }
    loadData()
  }, [status, loadData])

  useEffect(() => {
    // Check dark mode
    const checkDarkMode = () => {
      const theme = localStorage.getItem('color-theme')
      setIsDarkMode(theme === 'dark')
    }
    checkDarkMode()
    
    // Listen for theme changes
    window.addEventListener('theme-updated', checkDarkMode)
    return () => window.removeEventListener('theme-updated', checkDarkMode)
  }, [])

  const handleCreateEvent = async (eventData: EventFormData) => {
    console.log('[DashboardClient] handleCreateEvent called', { 
      eventData: {
        ...eventData,
        generateImage: eventData.generateImage || false
      }
    })
    
    try {
      const requestBody = {
        ...eventData,
        generateImage: eventData.generateImage || false,
      }
      
      console.log('[DashboardClient] Sending POST to /api/events', { requestBody })
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      console.log('[DashboardClient] Response received', { 
        status: response.status, 
        ok: response.ok 
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create event' }))
        console.error('[DashboardClient] Failed to create event:', errorData)
        throw new Error(errorData.error || 'Failed to create event')
      }

      // Success - refresh data
      const newEvent = await response.json()
      console.log('[DashboardClient] Event created successfully:', { 
        eventId: newEvent.id,
        title: newEvent.title,
        hasImageUrl: !!newEvent.imageUrl,
        generateImage: requestBody.generateImage
      })
      
      // Refresh events list
      console.log('[DashboardClient] Refreshing data...')
      await refreshData()
      setSelectedSlot(null)
      console.log('[DashboardClient] Event creation flow complete')
    } catch (error) {
      console.error('[DashboardClient] Failed to create event:', error)
      if (error instanceof Error) {
        console.error('[DashboardClient] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      }
      throw error // Re-throw so modal can handle it
    }
  }

  const handleUpdateEvent = async (eventId: string, eventData: EventFormData) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        await loadData() // Reload to get fresh data
      } else {
        throw new Error('Failed to update event')
      }
    } catch (error) {
      console.error('Failed to update event:', error)
      throw error
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadData() // Reload to get fresh data
      } else {
        throw new Error('Failed to delete event')
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
      throw error
    }
  }

  const handleSelectEvent = (event: { id: string; title: string; start: Date; end: Date; description?: string; location?: string; color?: string; allDay?: boolean }) => {
    console.log('[DashboardClient] handleSelectEvent called', { eventId: event.id })
    
    // Open modal instantly with cached event data
    const fullEvent = events.find(e => e.id === event.id)
    if (fullEvent) {
      console.log('[DashboardClient] Opening modal instantly with cached event data', { 
        eventId: fullEvent.id,
        hasImageUrl: !!fullEvent.imageUrl 
      })
      setSelectedEvent(fullEvent)
      setShowEventDetailsModal(true)
    } else {
      // If event not found in cache, use the provided event data
      const eventData: Event = {
        id: event.id,
        title: event.title,
        startTime: event.start.toISOString(),
        endTime: event.end.toISOString(),
        description: event.description || undefined,
        location: event.location || undefined,
        color: event.color || '#3b82f6',
        allDay: event.allDay || false,
      }
      setSelectedEvent(eventData)
      setShowEventDetailsModal(true)
    }
    
    // Fetch latest event data in the background and update if different
    fetch(`/api/events/${event.id}`)
      .then(response => {
        if (response.ok) {
          return response.json()
        }
        throw new Error('Failed to fetch event')
      })
      .then(latestEvent => {
        console.log('[DashboardClient] Fetched latest event data in background', { 
          eventId: latestEvent.id,
          hasImageUrl: !!latestEvent.imageUrl 
        })
        // Only update if modal is still open and event is still selected
        setSelectedEvent(prev => {
          if (prev && prev.id === latestEvent.id) {
            return latestEvent
          }
          return prev
        })
      })
      .catch(error => {
        console.warn('[DashboardClient] Failed to fetch latest event in background', error)
        // Modal is already open with cached data, so this is fine
      })
  }

  const handleCreateContact = async (contactData: ContactFormData) => {
    console.log('[DashboardClient] handleCreateContact called', { contactData })
    
    try {
      // Clean up empty strings to null for optional fields
      const cleanedData = {
        ...contactData,
        phone: contactData.phone || null,
        company: contactData.company || null,
        position: contactData.position || null,
        notes: contactData.notes || null,
        imageUrl: contactData.imageUrl || null,
      }
      
      console.log('[DashboardClient] Sending POST to /api/contacts', { cleanedData })
      
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      })

      console.log('[DashboardClient] Contact creation response', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText
      })

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to create contact'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            console.error('[DashboardClient] Error response data:', errorData)
            errorMessage = errorData.error || errorData.message || errorMessage
          } else {
            const text = await response.text()
            console.error('[DashboardClient] Error response text:', text)
            errorMessage = text || errorMessage
          }
        } catch (parseError) {
          console.error('[DashboardClient] Failed to parse error response:', parseError)
          errorMessage = `Failed to create contact (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }

      // Success - get the new contact
      const newContact = await response.json()
      console.log('[DashboardClient] Contact created successfully:', { 
        contactId: newContact.id,
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        hasImageUrl: !!newContact.imageUrl
      })
      
      // Optimistically add to contacts list immediately
      setContacts(prevContacts => [newContact, ...prevContacts])
      
      // Then refresh to get any generated image or updated data
      console.log('[DashboardClient] Refreshing data to get full contact details...')
      await refreshData()
      console.log('[DashboardClient] Contact creation flow complete')
    } catch (error) {
      console.error('[DashboardClient] Failed to create contact:', error)
      if (error instanceof Error) {
        console.error('[DashboardClient] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      }
      // On error, refresh to ensure we have the correct state
      await refreshData()
      throw error // Re-throw so modal can handle it
    }
  }

  const handleUpdateContact = async (contactId: string, contactData: ContactFormData) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      })

      if (response.ok) {
        await refreshData() // Refresh to get fresh data
      } else {
        throw new Error('Failed to update contact')
      }
    } catch (error) {
      console.error('Failed to update contact:', error)
      throw error
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await refreshData() // Refresh to get fresh data
      } else {
        throw new Error('Failed to delete contact')
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
      throw error
    }
  }

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    setShowContactDetailsModal(true)
  }

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }, e?: React.SyntheticEvent) => {
    const start = new Date(slotInfo.start)
    const end = new Date(slotInfo.end || slotInfo.start)
    
    // If clicking on a day without specific time (month view), show clock picker
    if (start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0) {
      // Center the clock picker on screen
      setClockPickerPosition(undefined) // undefined = center
      setClockPickerDate(start)
      setShowClockPicker(true)
    } else {
      // If time is already set, proceed directly to event modal
      if (start.getTime() === end.getTime() || !slotInfo.end) {
        end.setTime(start.getTime())
        end.setHours(start.getHours() + 1)
      }
      setSelectedSlot({ start, end })
      setShowEventModal(true)
    }
  }

  const handleClockTimeSelect = (time: Date) => {
    const start = new Date(clockPickerDate)
    start.setHours(time.getHours(), time.getMinutes(), 0, 0)
    const end = new Date(start)
    end.setHours(start.getHours() + 1)
    
    setSelectedSlot({ start, end })
    setShowEventModal(true)
    setShowClockPicker(false)
  }

  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    description: event.description,
    location: event.location,
    color: event.color,
    allDay: event.allDay,
    imageUrl: event.imageUrl,
    createdAt: (event as any).createdAt, // Include createdAt for polling logic
  }))

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ 
      background: `linear-gradient(to bottom right, var(--gradient-start, #eff6ff), var(--gradient-end, #dbeafe))`,
      backgroundColor: 'var(--background-color, #ffffff)'
    }}>
      {/* Header */}
      <HeaderBackground>
        <header 
          className={`modern-header ${isDarkMode ? 'modern-header-dark' : ''} relative z-10`}
          style={{ 
            color: 'var(--header-text)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <HeaderLogo />
              </div>
              <div className="flex items-center gap-2.5">
                {session?.user?.email ? (
                  <div className="modern-user-badge" style={{ color: 'var(--text-primary)' }}>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="hidden sm:inline">{session.user.email}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <ThemeSelector />
                  <SaveThemeButton />
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleSignOut}
                  className="modern-header-button flex items-center gap-2"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      </HeaderBackground>

      {/* Navigation */}
      <nav 
        className={`modern-nav ${isDarkMode ? 'modern-nav-dark' : ''}`}
        style={{ color: 'var(--header-text)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`modern-nav-button ${activeTab === 'calendar' ? 'active' : ''}`}
              style={{
                color: activeTab === 'calendar' ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
            >
              <CalendarIcon className="inline w-4 h-4 mr-2" style={{ color: 'inherit' }} />
              <span className="whitespace-nowrap">Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`modern-nav-button ${activeTab === 'contacts' ? 'active' : ''}`}
              style={{
                color: activeTab === 'contacts' ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
            >
              <Users className="inline w-4 h-4 mr-2" style={{ color: 'inherit' }} />
              <span className="whitespace-nowrap">Contacts ({contacts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`modern-nav-button ${activeTab === 'ai' ? 'active' : ''}`}
              style={{
                color: activeTab === 'ai' ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
            >
              <Sparkles className="inline w-4 h-4 mr-2" style={{ color: 'inherit' }} />
              <span className="whitespace-nowrap">AI</span>
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`modern-nav-button ${activeTab === 'theme' ? 'active' : ''}`}
              style={{
                color: activeTab === 'theme' ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
            >
              <Palette className="inline w-4 h-4 mr-2" style={{ color: 'inherit' }} />
              <span className="whitespace-nowrap">Theme</span>
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`modern-nav-button ${activeTab === 'image' ? 'active' : ''}`}
              style={{
                color: activeTab === 'image' ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
            >
              <ImageIcon className="inline w-4 h-4 mr-2" style={{ color: 'inherit' }} />
              <span className="whitespace-nowrap">Image</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calendar' ? (
          <div className="embossed p-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                <CalendarIcon className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
                Your Calendar
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Manage your events and schedule. Click on any day to create an event or click on an event to view details.
              </p>
            </div>
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowEventModal(true)}
                className="modern-button flex items-center gap-2 px-4 py-2 text-white"
              >
                <Plus className="w-4 h-4" />
                New Event
              </button>
            </div>
            <CalendarComponent
              events={calendarEvents}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
            />
          </div>
        ) : activeTab === 'contacts' ? (
          <div className="embossed p-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                <Users className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
                Your Contacts
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Manage your contacts and relationships. Keep track of important people in your network!
              </p>
            </div>
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowContactModal(true)}
                className="modern-button flex items-center gap-2 px-4 py-2 text-white"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>
            <ContactsList 
              contacts={contacts} 
              onContactSelect={handleSelectContact}
            />
          </div>
        ) : activeTab === 'theme' ? (
          <div className="embossed p-3 sm:p-6" style={{ height: 'calc(100vh - 250px)', maxHeight: 'calc(100vh - 250px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ThemeChat />
          </div>
        ) : activeTab === 'image' ? (
          <div className="embossed p-6">
            <ImageGenerator />
          </div>
        ) : (
          <div className="embossed p-6">
            <AiAssistant 
              events={events} 
              contacts={contacts} 
              onDataChange={refreshData}
              onEventSelect={(event) => {
                // Convert EventLike to format expected by handleSelectEvent
                handleSelectEvent({
                  id: event.id,
                  title: event.title,
                  start: new Date(event.startTime),
                  end: new Date(event.endTime),
                  description: event.description,
                  location: event.location,
                  color: event.color,
                  allDay: event.allDay,
                })
                setActiveTab('calendar')
              }}
              onContactSelect={(contact) => {
                // Convert ContactLike to Contact format
                handleSelectContact({
                  ...contact,
                  tags: contact.tags || []
                })
                setActiveTab('contacts')
              }}
            />
          </div>
        )}'
      </main>

      {/* Modals */}
      <ClockTimePicker
        isOpen={showClockPicker}
        initialTime={clockPickerDate}
        onClose={() => setShowClockPicker(false)}
        onTimeSelect={handleClockTimeSelect}
        position={clockPickerPosition}
      />

      <CreateEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false)
          setSelectedSlot(null)
        }}
        onSubmit={handleCreateEvent}
        initialStart={selectedSlot?.start}
        initialEnd={selectedSlot?.end}
      />

      <EventDetailsModal
        isOpen={showEventDetailsModal}
        event={selectedEvent}
        onClose={() => {
          setShowEventDetailsModal(false)
          setSelectedEvent(null)
        }}
        onEdit={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />

      <CreateContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSubmit={handleCreateContact}
      />

      <ContactDetailsModal
        isOpen={showContactDetailsModal}
        contact={selectedContact}
        onClose={() => {
          setShowContactDetailsModal(false)
          setSelectedContact(null)
        }}
        onEdit={handleUpdateContact}
        onDelete={handleDeleteContact}
      />
    </div>
  )
}
