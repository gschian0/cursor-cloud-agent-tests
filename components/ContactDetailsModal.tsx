'use client'

import { useState } from 'react'
import { X, Edit2, Trash2, Mail, Phone, Building, Briefcase, FileText, Tag } from 'lucide-react'
import CreateContactModal, { type ContactFormData } from './CreateContactModal'

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

interface ContactDetailsModalProps {
  isOpen: boolean
  contact: Contact | null
  onClose: () => void
  onEdit: (contactId: string, contactData: ContactFormData) => Promise<void>
  onDelete: (contactId: string) => Promise<void>
}

export default function ContactDetailsModal({
  isOpen,
  contact,
  onClose,
  onEdit,
  onDelete,
}: ContactDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen || !contact) return null

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    
    setIsDeleting(true)
    try {
      await onDelete(contact.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete contact:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async (contactData: ContactFormData) => {
    try {
      await onEdit(contact.id, contactData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update contact:', error)
    }
  }

  if (isEditing) {
    return (
      <CreateContactModal
        isOpen={true}
        onClose={() => setIsEditing(false)}
        onSubmit={handleEdit}
        initialData={{
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || '',
          company: contact.company || '',
          position: contact.position || '',
          notes: contact.notes || '',
          tags: contact.tags || [],
        }}
        isEdit={true}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="modern-modal w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 border-b px-6 py-4 flex justify-between items-center" style={{ backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h2 className="text-2xl font-bold text-3d" style={{ color: 'var(--text-primary)' }}>Contact Details</h2>
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <h3 className="text-3xl font-bold text-3d mb-2" style={{ color: 'var(--text-primary)' }}>
              {contact.firstName} {contact.lastName}
            </h3>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Email</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{contact.email}</p>
              </div>
            </div>

            {contact.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Phone</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{contact.phone}</p>
                </div>
              </div>
            )}

            {contact.company && (
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Company</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{contact.company}</p>
                </div>
              </div>
            )}

            {contact.position && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Position</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{contact.position}</p>
                </div>
              </div>
            )}

            {contact.tags && contact.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: 'var(--primary-color)',
                          color: 'white',
                          opacity: 0.8,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {contact.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Notes</p>
                  <p className="text-base whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{contact.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 border-t px-6 py-4 flex justify-end gap-3" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
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
            Edit Contact
          </button>
        </div>
      </div>
    </div>
  )
}

