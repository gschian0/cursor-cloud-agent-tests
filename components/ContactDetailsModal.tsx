'use client'

import { useState, useEffect } from 'react'
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
  imageUrl?: string
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
  const [currentContact, setCurrentContact] = useState<Contact | null>(contact)

  // Update current contact when contact prop changes
  useEffect(() => {
    console.log('[ContactDetailsModal] Contact prop changed', { 
      contactId: contact?.id,
      hasImageUrl: !!contact?.imageUrl 
    })
    setCurrentContact(contact)
  }, [contact])
  
  // Also fetch latest contact data when modal opens
  useEffect(() => {
    if (isOpen && currentContact && !currentContact.imageUrl) {
      console.log('[ContactDetailsModal] Modal opened, fetching latest contact data', { contactId: currentContact.id })
      const fetchLatest = async () => {
        try {
          const response = await fetch(`/api/contacts/${currentContact.id}`)
          if (response.ok) {
            const latestContact = await response.json()
            console.log('[ContactDetailsModal] Latest contact data fetched', { 
              contactId: latestContact.id,
              hasImageUrl: !!latestContact.imageUrl 
            })
            if (latestContact.imageUrl || latestContact.id !== currentContact.id) {
              setCurrentContact(latestContact)
            }
          }
        } catch (error) {
          console.error('[ContactDetailsModal] Failed to fetch latest contact:', error)
        }
      }
      fetchLatest()
    }
  }, [isOpen, currentContact?.id])

  // Poll for image if contact doesn't have one yet
  useEffect(() => {
    if (!isOpen || !currentContact || currentContact.imageUrl) {
      console.log('[ContactDetailsModal] Skipping poll setup', { 
        isOpen, 
        hasContact: !!currentContact, 
        hasImageUrl: !!currentContact?.imageUrl 
      })
      return
    }

    console.log('[ContactDetailsModal] Starting image polling', { contactId: currentContact.id })

    let pollCount = 0
    const maxPolls = 30 // Poll for up to 60 seconds (30 * 2s)

    const pollForImage = async () => {
      pollCount++
      console.log(`[ContactDetailsModal] Polling for image (attempt ${pollCount}/${maxPolls})`, { contactId: currentContact.id })
      
      try {
        const response = await fetch(`/api/contacts/${currentContact.id}`)
        if (response.ok) {
          const updatedContact = await response.json()
          console.log('[ContactDetailsModal] Poll response received', { 
            contactId: updatedContact.id,
            hasImageUrl: !!updatedContact.imageUrl 
          })
          
          if (updatedContact.imageUrl) {
            console.log('[ContactDetailsModal] Image found!', { contactId: updatedContact.id })
            setCurrentContact(updatedContact)
            // Stop polling once we have the image
            return true
          }
        } else {
          console.warn('[ContactDetailsModal] Poll request failed', {
            status: response.status,
            statusText: response.statusText
          })
        }
      } catch (error) {
        console.error('[ContactDetailsModal] Failed to poll for contact image:', error)
      }
      
      return false
    }

    // Try once immediately
    pollForImage().then((hasImage) => {
      if (hasImage) return // Stop if we got the image immediately
    })

    const interval = setInterval(async () => {
      if (pollCount >= maxPolls) {
        console.log('[ContactDetailsModal] Max polls reached, stopping', { contactId: currentContact.id })
        clearInterval(interval)
        return
      }
      
      const hasImage = await pollForImage()
      if (hasImage) {
        console.log('[ContactDetailsModal] Image received, stopping poll', { contactId: currentContact.id })
        clearInterval(interval)
      }
    }, 2000)

    const timeout = setTimeout(() => {
      console.log('[ContactDetailsModal] Poll timeout reached', { contactId: currentContact.id })
      clearInterval(interval)
    }, 60000) // 60 second timeout

    return () => {
      console.log('[ContactDetailsModal] Cleaning up poll', { contactId: currentContact.id })
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isOpen, currentContact?.id, currentContact?.imageUrl]) // Use specific properties instead of whole object

  if (!isOpen || !currentContact) return null

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    
    setIsDeleting(true)
    try {
      await onDelete(currentContact.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete contact:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async (contactData: ContactFormData) => {
    try {
      await onEdit(currentContact.id, contactData)
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
          firstName: currentContact.firstName,
          lastName: currentContact.lastName,
          email: currentContact.email,
          phone: currentContact.phone || '',
          company: currentContact.company || '',
          position: currentContact.position || '',
          notes: currentContact.notes || '',
          tags: currentContact.tags || [],
          imageUrl: currentContact.imageUrl || '',
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
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Contact Details</h2>
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
          {/* Image and Name */}
          <div className="flex items-start gap-6">
            {currentContact.imageUrl ? (
              <img
                src={currentContact.imageUrl}
                alt={`${currentContact.firstName} ${currentContact.lastName}`}
                className="w-32 h-32 rounded-full object-cover flex-shrink-0"
                style={{ border: `2px solid var(--border-color)` }}
                onError={(e) => {
                  // If image fails to load, generate a placeholder
                  const initials = `${currentContact.firstName.charAt(0)}${currentContact.lastName.charAt(0)}`.toUpperCase()
                  const svg = `
                    <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="contactGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:var(--primary-color);stop-opacity:1" />
                          <stop offset="100%" style="stop-color:var(--secondary-color);stop-opacity:1" />
                        </linearGradient>
                      </defs>
                      <rect width="128" height="128" fill="url(#contactGrad)" rx="64"/>
                      <text x="64" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
                            fill="white" text-anchor="middle" dominant-baseline="middle">
                        ${initials}
                      </text>
                    </svg>
                  `
                  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`
                  e.currentTarget.src = dataUrl
                }}
              />
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0 text-white text-4xl font-bold"
                style={{
                  background: `linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)`,
                  border: `2px solid var(--border-color)`,
                }}
              >
                {`${currentContact.firstName.charAt(0)}${currentContact.lastName.charAt(0)}`.toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {currentContact.firstName} {currentContact.lastName}
              </h3>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Email</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{currentContact.email}</p>
              </div>
            </div>

            {currentContact.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Phone</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{currentContact.phone}</p>
                </div>
              </div>
            )}

            {currentContact.company && (
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Company</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{currentContact.company}</p>
                </div>
              </div>
            )}

            {currentContact.position && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Position</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{currentContact.position}</p>
                </div>
              </div>
            )}

            {currentContact.tags && currentContact.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {currentContact.tags.map((tag) => (
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

            {currentContact.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Notes</p>
                  <p className="text-base whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{currentContact.notes}</p>
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

