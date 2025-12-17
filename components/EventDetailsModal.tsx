'use client'

import { useState } from 'react'
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

  if (!isOpen || !event) return null

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return
    
    setIsDeleting(true)
    try {
      await onDelete(event.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete event:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async (eventData: EventFormData) => {
    try {
      await onEdit(event.id, eventData)
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
        initialStart={new Date(event.startTime)}
        initialEnd={new Date(event.endTime)}
        initialData={{
          title: event.title,
          description: event.description || '',
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location || '',
          color: event.color || '#3b82f6',
          allDay: event.allDay || false,
        }}
        isEdit={true}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Event Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <div 
              className="inline-block px-3 py-1 rounded-md text-white font-semibold mb-3"
              style={{ backgroundColor: event.color || '#3b82f6' }}
            >
              {event.allDay ? 'All Day' : ''}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h3>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-base text-gray-900">{formatDate(event.startTime)}</p>
              </div>
            </div>

            {!event.allDay && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-base text-gray-900">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-base text-gray-900">{event.location}</p>
                </div>
              </div>
            )}

            {event.description && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            )}

            {event.contact && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Contact</p>
                  <p className="text-base font-semibold text-gray-900">
                    {event.contact.firstName} {event.contact.lastName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit Event
          </button>
        </div>
      </div>
    </div>
  )
}

