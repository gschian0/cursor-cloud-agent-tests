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
  const [loading, setLoading] = useState(true)

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
        setContacts(contactsData)
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

  const handleSelectEvent = async (event: { id: string; title: string; start: Date; end: Date; description?: string; location?: string; color?: string; allDay?: boolean }) => {
    console.log('[DashboardClient] handleSelectEvent called', { eventId: event.id })
    
    // Try to get the latest event data from the server
    try {
      const response = await fetch(`/api/events/${event.id}`)
      if (response.ok) {
        const latestEvent = await response.json()
        console.log('[DashboardClient] Fetched latest event data', { 
          eventId: latestEvent.id,
          hasImageUrl: !!latestEvent.imageUrl 
        })
        setSelectedEvent(latestEvent)
        setShowEventDetailsModal(true)
        return
      }
    } catch (error) {
      console.warn('[DashboardClient] Failed to fetch latest event, using cached data', error)
    }
    
    // Fallback to cached event data
    const fullEvent = events.find(e => e.id === event.id)
    if (fullEvent) {
      console.log('[DashboardClient] Using cached event data', { 
        eventId: fullEvent.id,
        hasImageUrl: !!fullEvent.imageUrl 
      })
      setSelectedEvent(fullEvent)
      setShowEventDetailsModal(true)
    }
  }

  const handleCreateContact = async (contactData: ContactFormData) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      })

      if (response.ok) {
        await refreshData() // Refresh to get fresh data
      }
    } catch (error) {
      console.error('Failed to create contact:', error)
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

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    // When clicking on a day, set start to beginning of day and end to 1 hour later
    const start = new Date(slotInfo.start)
    const end = new Date(slotInfo.end || slotInfo.start)
    
    // If clicking on a day without specific time (month view), set default times
    // Check if it's at midnight (likely a day click rather than time slot click)
    if (start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0) {
      start.setHours(9, 0, 0, 0) // Default to 9 AM
      end.setTime(start.getTime())
      end.setHours(start.getHours() + 1) // Default to 1 hour duration
    } else if (start.getTime() === end.getTime() || !slotInfo.end) {
      // If start and end are the same, add 1 hour
      end.setTime(start.getTime())
      end.setHours(start.getHours() + 1)
    }
    
    setSelectedSlot({ start, end })
    setShowEventModal(true)
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
      background: `linear-gradient(135deg, 
        var(--gradient-start, #eff6ff) 0%,
        var(--gradient-end, #dbeafe) 50%,
        var(--background-color, #ffffff) 100%)`,
      backgroundAttachment: 'fixed'
    }}>
      {/* Header */}
      <HeaderBackground>
        <header style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          color: 'var(--header-text)',
          borderBottom: '1.5px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
        }} className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <HeaderLogo />
              <div className="flex items-center gap-3">
                {session?.user?.email ? (
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{session.user.email}</span>
                ) : null}
                <ThemeSelector />
                <SaveThemeButton />
                <ThemeToggle />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-color)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <LogOut className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      </HeaderBackground>

      {/* Navigation */}
      <nav style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottomColor: 'rgba(255, 255, 255, 0.3)',
        borderBottomWidth: '1.5px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
      }} className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('calendar')}
              className="py-4 px-2 border-b-2 font-medium text-sm transition-colors"
              style={{
                borderBottomColor: activeTab === 'calendar' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'calendar' ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'calendar') {
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'calendar') {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <CalendarIcon className="inline w-4 h-4 mr-2" style={{ color: 'inherit' }} />
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className="py-4 px-2 border-b-2 font-medium text-sm transition-colors"
              style={{
                borderBottomColor: activeTab === 'contacts' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'contacts' ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'contacts') {
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'contacts') {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Users className="inline w-4 h-4 mr-2" style={{ color: 'inherit' }} />
              Contacts ({contacts.length})
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className="py-4 px-2 border-b-2 font-medium text-sm transition-colors"
              style={{
                borderBottomColor: activeTab === 'ai' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'ai' ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'ai') {
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'ai') {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Sparkles className="inline w-4 h-4 mr-2" style={{ color: 'inherit' }} />
              AI
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className="py-4 px-2 border-b-2 font-medium text-sm transition-colors"
              style={{
                borderBottomColor: activeTab === 'theme' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'theme' ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'theme') {
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'theme') {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Palette className="inline w-4 h-4 mr-2" style={{ color: 'inherit' }} />
              Theme
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className="py-4 px-2 border-b-2 font-medium text-sm transition-colors"
              style={{
                borderBottomColor: activeTab === 'image' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'image' ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'image') {
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'image') {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <ImageIcon className="inline w-4 h-4 mr-2" style={{ color: 'inherit' }} />
              Image
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calendar' ? (
          <div className="embossed p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-3d" style={{ color: 'var(--text-primary)' }}>Your Calendar</h2>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-3d" style={{ color: 'var(--text-primary)' }}>Your Contacts</h2>
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
          <div className="embossed p-6">
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
                handleSelectEvent(event)
                setActiveTab('calendar')
              }}
              onContactSelect={(contact) => {
                handleSelectContact(contact)
                setActiveTab('contacts')
              }}
            />
          </div>
        )}
      </main>

      {/* Modals */}
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
