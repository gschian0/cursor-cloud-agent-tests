"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { Send, Bot, User, Trash2 } from "lucide-react"

type EventLike = {
  id: string
  title: string
  startTime: string
  endTime: string
  description?: string
  location?: string
  allDay?: boolean
  color?: string
  contactId?: string
}

type ContactLike = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  tags?: string[]
}


type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actionData?: {
    type: string
    eventId?: string
    contactId?: string
  }
}

export default function AiAssistant({
  events,
  contacts,
  onDataChange,
  onEventSelect,
  onContactSelect,
}: {
  events: EventLike[]
  contacts: ContactLike[]
  onDataChange?: () => void
  onEventSelect?: (event: EventLike) => void
  onContactSelect?: (contact: ContactLike) => void
}) {
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load chat history from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-chat-history')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        } catch (e) {
          return []
        }
      }
    }
    return []
  })
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('ai-chat-history', JSON.stringify(messages))
    }
  }, [messages])

  const context = useMemo(() => {
    const upcoming = events.map((e) => {
      const when = `${new Date(e.startTime).toISOString()} - ${new Date(
        e.endTime
      ).toISOString()}`
      return `ID: ${e.id}, Title: ${e.title}, Time: ${when}${e.location ? `, Location: ${e.location}` : ""}${
        e.description ? `, Description: ${e.description}` : ""
      }${e.allDay ? `, All Day: true` : ""}${e.color ? `, Color: ${e.color}` : ""}`
    })

    const allContacts = contacts.map((c) => {
      const name = `${c.firstName} ${c.lastName}`.trim()
      const org = [c.position, c.company].filter(Boolean).join(" @ ")
      return `ID: ${c.id}, Name: ${name}, Email: ${c.email}${c.phone ? `, Phone: ${c.phone}` : ""}${org ? `, ${org}` : ""}${c.tags && c.tags.length > 0 ? `, Tags: ${c.tags.join(", ")}` : ""}`
    })

    return [
      "You are an AI assistant with full access to manage the user's calendar and contacts database.",
      "",
      "CURRENT CALENDAR EVENTS:",
      upcoming.length ? upcoming.join("\n") : "- (none)",
      "",
      "CURRENT CONTACTS:",
      allContacts.length ? allContacts.join("\n") : "- (none)",
      "",
      "You can:",
      "- Answer questions about their calendar and contacts",
      "- Create, update, or delete events",
      "- Create, update, or delete contacts",
      "- Link events to contacts using contactId",
      "- Use event IDs and contact IDs from the lists above when performing actions",
      "",
      "When the user asks you to create, modify, or delete something, use the action system.",
      "When answering questions, be helpful and reference specific events or contacts when relevant.",
      "",
      "IMPORTANT: When referencing events or contacts, use their IDs from the lists above.",
      "You can ask the user to edit events, or you can update them directly using the update_event action.",
    ].join("\n")
  }, [events, contacts])

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const run = async (userPrompt: string) => {
    if (!userPrompt.trim()) return

    // Add user message to conversation
    const userMessage: Message = {
      role: 'user',
      content: userPrompt,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setPrompt("")
    setLoading(true)
    setError("")

    try {
      // Send conversation history along with the new prompt
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          context: context,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || "AI request failed")
        setLoading(false)
        return
      }

      // Check if AI wants to perform an action
      if (data?.action) {
        try {
          // Execute the action
          const actionRes = await fetch('/api/ai/actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.action),
          })

          const actionResult = await actionRes.json()
          
          if (actionRes.ok) {
            // Action succeeded - silently refresh data (no page flash)
            if (onDataChange) {
              await onDataChange()
            }
            
            // Extract event/contact ID from action result if available
            const eventId = actionResult.data?.id && data.action.action.includes('event') 
              ? actionResult.data.id 
              : undefined
            const contactId = actionResult.data?.id && data.action.action.includes('contact')
              ? actionResult.data.id
              : undefined
            
            const actionMessage = typeof data?.text === "string" && data.text.trim()
              ? data.text
              : `Action "${data.action.action}" completed successfully.`
            
            const assistantMessage: Message = {
              role: 'assistant',
              content: actionMessage,
              timestamp: new Date(),
              actionData: {
                type: data.action.action,
                eventId,
                contactId,
              }
            }
            setMessages(prev => [...prev, assistantMessage])
          } else {
            // Action failed
            const errorMessage = `Action failed: ${actionResult.error || 'Unknown error'}`
            setError(errorMessage)
            const assistantMessage: Message = {
              role: 'assistant',
              content: `I tried to perform the action but encountered an error: ${errorMessage}`,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, assistantMessage])
          }
        } catch (actionError) {
          console.error('Action execution failed:', actionError)
          setError('Failed to execute action')
          const assistantMessage: Message = {
            role: 'assistant',
            content: 'I encountered an error while trying to perform the action. Please try again.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, assistantMessage])
        }
      } else {
        // Normal response - no action
        const assistantMessage: Message = {
          role: 'assistant',
          content: typeof data?.text === "string" ? data.text : "",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (e) {
      console.error(e)
      setError("AI request failed")
    } finally {
      setLoading(false)
    }
  }

  const clearConversation = () => {
    setMessages([])
    setError("")
    setPrompt("")
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai-chat-history')
    }
  }

  const handleEditEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (event && onEventSelect) {
      // Convert to format expected by handleSelectEvent
      onEventSelect({
        id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        description: event.description,
        location: event.location,
        color: event.color,
        allDay: event.allDay,
      })
    }
  }

  const handleEditContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)
    if (contact && onContactSelect) {
      onContactSelect(contact)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">AI Assistant</h2>
          <p className="text-gray-600 mt-1">
            Chat with AI about your calendar and contacts. The conversation maintains context.
          </p>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <button
              disabled={loading}
              onClick={clearConversation}
              className="px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-60 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </button>
          )}
          <button
            disabled={loading}
            onClick={() =>
              run("Summarize my upcoming events and highlight any conflicts.")
            }
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-60"
          >
            Summarize events
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[400px] max-h-[600px] pr-2"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm mt-2">Ask me about your calendar, contacts, or anything else!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {/* Show edit button for events created/updated by AI */}
                {message.actionData?.eventId && (
                  message.actionData.type === 'create_event' || 
                  message.actionData.type === 'update_event'
                ) && (
                  <button
                    onClick={() => handleEditEvent(message.actionData!.eventId!)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    ✏️ Edit this event
                  </button>
                )}
                
                {/* Show edit button for contacts created/updated by AI */}
                {message.actionData?.contactId && (
                  message.actionData.type === 'create_contact' || 
                  message.actionData.type === 'update_contact'
                ) && (
                  <button
                    onClick={() => handleEditContact(message.actionData!.contactId!)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    ✏️ Edit this contact
                  </button>
                )}
                
                {/* Show event reference if message mentions an event ID */}
                {message.content.match(/Event ID:\s*([a-z0-9]+)/i) && (
                  (() => {
                    const match = message.content.match(/Event ID:\s*([a-z0-9]+)/i)
                    const eventId = match?.[1]
                    const event = eventId ? events.find(e => e.id === eventId) : null
                    return event ? (
                      <button
                        onClick={() => handleEditEvent(event.id)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        📅 View/Edit: {event.title}
                      </button>
                    ) : null
                  })()
                )}
                
                {/* Show contact reference if message mentions a contact ID */}
                {message.content.match(/Contact ID:\s*([a-z0-9]+)/i) && (
                  (() => {
                    const match = message.content.match(/Contact ID:\s*([a-z0-9]+)/i)
                    const contactId = match?.[1]
                    const contact = contactId ? contacts.find(c => c.id === contactId) : null
                    return contact ? (
                      <button
                        onClick={() => handleEditContact(contact.id)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        👤 View/Edit: {contact.firstName} {contact.lastName}
                      </button>
                    ) : null
                  })()
                )}
                
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                run(prompt)
              }
            }}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 min-h-[80px] max-h-[200px] border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={loading}
          />
          <button
            disabled={loading || prompt.trim().length === 0}
            onClick={() => run(prompt)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
          >
            <Send className="w-4 h-4" />
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          The AI has access to your calendar events and contacts for context.
        </p>
      </div>
    </div>
  )
}

