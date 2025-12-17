"use client"

import { useMemo, useState } from "react"

type EventLike = {
  title: string
  startTime: string
  endTime: string
  description?: string
  location?: string
  allDay?: boolean
}

type ContactLike = {
  firstName: string
  lastName: string
  email: string
  company?: string
  position?: string
}

export default function AiAssistant({
  events,
  contacts,
}: {
  events: EventLike[]
  contacts: ContactLike[]
}) {
  const [prompt, setPrompt] = useState("")
  const [answer, setAnswer] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const context = useMemo(() => {
    const upcoming = events.slice(0, 20).map((e) => {
      const when = `${new Date(e.startTime).toISOString()} - ${new Date(
        e.endTime
      ).toISOString()}`
      return `- ${e.title} (${when})${e.location ? ` @ ${e.location}` : ""}${
        e.description ? ` — ${e.description}` : ""
      }`
    })

    const topContacts = contacts.slice(0, 20).map((c) => {
      const name = `${c.firstName} ${c.lastName}`.trim()
      const org = [c.position, c.company].filter(Boolean).join(" @ ")
      return `- ${name} <${c.email}>${org ? ` (${org})` : ""}`
    })

    return [
      "You are an assistant helping a user manage their calendar and contacts.",
      "",
      "Calendar events (up to 20):",
      upcoming.length ? upcoming.join("\n") : "- (none)",
      "",
      "Contacts (up to 20):",
      topContacts.length ? topContacts.join("\n") : "- (none)",
      "",
      "Answer concisely and propose next steps when useful.",
    ].join("\n")
  }, [events, contacts])

  const run = async (userPrompt: string) => {
    setLoading(true)
    setError("")
    setAnswer("")
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${context}\n\nUser request:\n${userPrompt}`,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || "AI request failed")
        return
      }

      setAnswer(typeof data?.text === "string" ? data.text : "")
    } catch (e) {
      console.error(e)
      setError("AI request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">AI Assistant</h2>
          <p className="text-gray-600 mt-1">
            Ask Gemini to summarize, suggest, or draft messages using your data.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={() =>
              run("Summarize my upcoming events and highlight any conflicts.")
            }
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-60"
          >
            Summarize events
          </button>
          <button
            disabled={loading}
            onClick={() =>
              run(
                "Based on my events and contacts, suggest 3 outreach follow-ups I should do this week."
              )
            }
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-60"
          >
            Suggest follow-ups
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Draft an email to reschedule my meeting tomorrow at 10am..."
          className="w-full min-h-[120px] border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center justify-between">
          <button
            disabled={loading || prompt.trim().length === 0}
            onClick={() => run(prompt)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Thinking…" : "Ask AI"}
          </button>
          <button
            disabled={loading}
            onClick={() => {
              setPrompt("")
              setAnswer("")
              setError("")
            }}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-60"
          >
            Clear
          </button>
        </div>

        {error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        ) : null}

        {answer ? (
          <div className="whitespace-pre-wrap text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-md p-4">
            {answer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

