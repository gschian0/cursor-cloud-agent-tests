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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Contacts</h2>
      
      {contacts.length === 0 ? (
        <p className="text-gray-700 text-center py-8">
          No contacts yet. Add your first contact!
        </p>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onContactSelect?.(contact)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {contact.firstName} {contact.lastName}
                  </h3>
                  
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center text-sm text-gray-800">
                      <Mail className="w-4 h-4 mr-2 text-gray-600" />
                      {contact.email}
                    </div>
                    
                    {contact.phone && (
                      <div className="flex items-center text-sm text-gray-800">
                        <Phone className="w-4 h-4 mr-2 text-gray-600" />
                        {contact.phone}
                      </div>
                    )}
                    
                    {contact.company && (
                      <div className="flex items-center text-sm text-gray-800">
                        <Building className="w-4 h-4 mr-2 text-gray-600" />
                        {contact.company}
                      </div>
                    )}
                    
                    {contact.position && (
                      <div className="flex items-center text-sm text-gray-800">
                        <Briefcase className="w-4 h-4 mr-2 text-gray-600" />
                        {contact.position}
                      </div>
                    )}
                  </div>

                  {contact.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {contact.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {contact.notes && (
                    <p className="mt-3 text-sm text-gray-800 line-clamp-2">
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
