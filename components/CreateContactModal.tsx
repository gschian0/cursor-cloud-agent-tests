'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Phone, Building, Briefcase, Tag } from 'lucide-react'

interface CreateContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (contact: ContactFormData) => Promise<void>
  initialData?: Partial<ContactFormData>
  isEdit?: boolean
}

export interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  position: string
  notes: string
  tags: string[]
}

export default function CreateContactModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: CreateContactModalProps) {
  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [formData, setFormData] = useState<ContactFormData>(() => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    notes: '',
    tags: [],
  }))

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (isEdit && initialData && isOpen) {
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        company: initialData.company || '',
        position: initialData.position || '',
        notes: initialData.notes || '',
        tags: initialData.tags || [],
      })
    }
  }, [isEdit, initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      if (!isEdit) {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          position: '',
          notes: '',
          tags: [],
        })
        setTagInput('')
      }
      onClose()
    } catch (error) {
      console.error('Failed to save contact:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="modern-modal w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0" style={{ backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h2 className="text-2xl font-bold text-3d" style={{ color: 'var(--text-primary)' }}>{isEdit ? 'Edit Contact' : 'Add Contact'}</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="modern-input w-full px-3 py-2 focus:outline-none"
                style={{
                  color: 'var(--text-primary)',
                }}
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="modern-input w-full px-3 py-2 focus:outline-none"
                style={{
                  color: 'var(--text-primary)',
                }}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              <Mail className="inline w-4 h-4 mr-1" />
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email || ''}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
                className="modern-input w-full px-3 py-2 focus:outline-none"
                style={{
                  color: 'var(--text-primary)',
                }}
              placeholder="john.doe@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              <Phone className="inline w-4 h-4 mr-1" />
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
                className="modern-input w-full px-3 py-2 focus:outline-none"
                style={{
                  color: 'var(--text-primary)',
                }}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                <Building className="inline w-4 h-4 mr-1" />
                Company
              </label>
              <input
                type="text"
                value={formData.company || ''}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="modern-input w-full px-3 py-2 focus:outline-none"
                style={{
                  color: 'var(--text-primary)',
                }}
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                <Briefcase className="inline w-4 h-4 mr-1" />
                Position
              </label>
              <input
                type="text"
                value={formData.position || ''}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                className="modern-input w-full px-3 py-2 focus:outline-none"
                style={{
                  color: 'var(--text-primary)',
                }}
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
                className="modern-input w-full px-3 py-2 focus:outline-none"
                style={{
                  color: 'var(--text-primary)',
                }}
              rows={3}
              placeholder="Additional notes about this contact..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              <Tag className="inline w-4 h-4 mr-1" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                className="flex-1 px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                style={{
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--background-color)',
                  border: `1px solid var(--border-color)`,
                }}
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
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
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      opacity: 0.8,
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 transition-opacity"
                      style={{ color: 'white' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.7'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
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
              {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Contact' : 'Add Contact')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
