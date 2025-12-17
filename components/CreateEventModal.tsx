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
    title: initialData?.title || '',
    description: initialData?.description || '',
    startTime: initialData?.startTime || (initialStart ? formatDateTimeLocal(initialStart) : ''),
    endTime: initialData?.endTime || (initialEnd ? formatDateTimeLocal(initialEnd) : ''),
    location: initialData?.location || '',
    color: initialData?.color || '#3b82f6',
    allDay: initialData?.allDay || false,
  })

  // Reset form when modal opens/closes or when initial values change
  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        // Edit mode - use initialData
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          startTime: initialData.startTime || '',
          endTime: initialData.endTime || '',
          location: initialData.location || '',
          color: initialData.color || '#3b82f6',
          allDay: initialData.allDay || false,
        })
      } else if (initialStart && initialEnd) {
        // New event with selected slot - use initialStart/initialEnd
        setFormData({
          title: '',
          description: '',
          startTime: formatDateTimeLocal(initialStart),
          endTime: formatDateTimeLocal(initialEnd),
          location: '',
          color: '#3b82f6',
          allDay: false,
        })
      } else {
        // New event without selected slot - reset to empty
        setFormData({
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          location: '',
          color: '#3b82f6',
          allDay: false,
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
      onClose()
    } catch (error) {
      console.error('Failed to create event:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Event' : 'Create Event'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Team meeting"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Event details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Conference Room A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay}
                onChange={(e) =>
                  setFormData({ ...formData, allDay: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="allDay" className="ml-2 text-sm text-gray-700">
                All Day Event
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
