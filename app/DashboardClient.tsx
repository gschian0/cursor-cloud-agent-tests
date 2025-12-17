'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar as CalendarIcon, Users, Plus, LogOut, Sparkles } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import CalendarComponent from '@/components/Calendar'
import CreateEventModal, { type EventFormData } from '@/components/CreateEventModal'
import EventDetailsModal from '@/components/EventDetailsModal'
import CreateContactModal, { type ContactFormData } from '@/components/CreateContactModal'
import ContactsList from '@/components/ContactsList'
import AiAssistant from '@/components/AiAssistant'

interface Event {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  color?: string
  allDay?: boolean
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
  const [activeTab, setActiveTab] = useState<'calendar' | 'contacts' | 'ai'>('calendar')
  const [events, setEvents] = useState<Event[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
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
        setEvents(eventsData)
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        setContacts(contactsData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
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
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        const newEvent = await response.json()
        setEvents([...events, newEvent])
        setSelectedSlot(null)
        await loadData() // Reload to get fresh data
      }
    } catch (error) {
      console.error('Failed to create event:', error)
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
    const fullEvent = events.find(e => e.id === event.id)
    if (fullEvent) {
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
        const newContact = await response.json()
        setContacts([newContact, ...contacts])
      }
    } catch (error) {
      console.error('Failed to create contact:', error)
    }
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
  }))

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Calendar</h1>
            </div>
            <div className="flex items-center gap-3">
              {session?.user?.email ? (
                <span className="text-sm text-gray-600">{session.user.email}</span>
              ) : null}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'calendar'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon className="inline w-4 h-4 mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'contacts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="inline w-4 h-4 mr-2" />
              Contacts ({contacts.length})
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ai'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles className="inline w-4 h-4 mr-2" />
              AI
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calendar' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Your Calendar</h2>
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Your Contacts</h2>
              <button
                onClick={() => setShowContactModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>
            <ContactsList contacts={contacts} />
          </div>
        ) : (
          <AiAssistant events={events} contacts={contacts} />
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
    </div>
  )
}
