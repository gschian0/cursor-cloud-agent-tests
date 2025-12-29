'use client'

import { Mail, Phone, Building, Briefcase } from 'lucide-react'

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

interface ContactsListProps {
  contacts: Contact[]
  onContactSelect?: (contact: Contact) => void
}

export default function ContactsList({ contacts, onContactSelect }: ContactsListProps) {
  return (
    <div className="rounded-lg shadow-lg p-6" style={{ backgroundColor: 'var(--surface-color)' }}>
      <h2 className="text-2xl font-bold text-3d mb-4" style={{ color: 'var(--text-primary)' }}>Contacts</h2>
      
      {contacts.length === 0 ? (
        <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
          No contacts yet. Add your first contact!
        </p>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              style={{
                border: `1px solid var(--border-color)`,
                backgroundColor: 'var(--background-color)',
              }}
              onClick={() => onContactSelect?.(contact)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-3d-subtle mb-2" style={{ color: 'var(--text-primary)' }}>
                    {contact.firstName} {contact.lastName}
                  </h3>
                  
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center text-sm" style={{ color: 'var(--text-primary)' }}>
                      <Mail className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                      {contact.email}
                    </div>
                    
                    {contact.phone && (
                      <div className="flex items-center text-sm" style={{ color: 'var(--text-primary)' }}>
                        <Phone className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                        {contact.phone}
                      </div>
                    )}
                    
                    {contact.company && (
                      <div className="flex items-center text-sm" style={{ color: 'var(--text-primary)' }}>
                        <Building className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                        {contact.company}
                      </div>
                    )}
                    
                    {contact.position && (
                      <div className="flex items-center text-sm" style={{ color: 'var(--text-primary)' }}>
                        <Briefcase className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                        {contact.position}
                      </div>
                    )}
                  </div>

                  {contact.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {contact.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full text-xs"
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
                  )}

                  {contact.notes && (
                    <p className="mt-3 text-sm line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {contact.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
