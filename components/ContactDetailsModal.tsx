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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Contact Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {contact.firstName} {contact.lastName}
            </h3>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base text-gray-900">{contact.email}</p>
              </div>
            </div>

            {contact.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-base text-gray-900">{contact.phone}</p>
                </div>
              </div>
            )}

            {contact.company && (
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Company</p>
                  <p className="text-base text-gray-900">{contact.company}</p>
                </div>
              </div>
            )}

            {contact.position && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Position</p>
                  <p className="text-base text-gray-900">{contact.position}</p>
                </div>
              </div>
            )}

            {contact.tags && contact.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
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
                <FileText className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{contact.notes}</p>
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
            Edit Contact
          </button>
        </div>
      </div>
    </div>
  )
}

