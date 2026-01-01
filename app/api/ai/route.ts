import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getTestUserId } from "@/lib/test-user"
import { GoogleGenAI } from "@google/genai"
import { validateTextInput } from "@/lib/input-validator"

type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const body = await request.json().catch(() => null)
    const prompt = body?.prompt
    const conversationHistory: ConversationMessage[] = body?.conversationHistory || []
    const context = body?.context || ""

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    // Validate prompt
    const promptValidation = validateTextInput(prompt, 5000, "Prompt")
    if (!promptValidation.valid) {
      return NextResponse.json({ error: promptValidation.error || "Invalid prompt" }, { status: 400 })
    }

    // Validate context if provided
    if (context && context.trim().length > 0) {
      const contextValidation = validateTextInput(context, 2000, "Context")
      if (!contextValidation.valid) {
        return NextResponse.json({ error: contextValidation.error || "Invalid context" }, { status: 400 })
      }
    }

    const apiKey =
      process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || ""
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_GENAI_API_KEY (or GEMINI_API_KEY)" },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    // Get current date/time for context
    const now = new Date()
    const currentDate = now.toISOString()
    const currentDateFormatted = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true,
      timeZoneName: 'short'
    })

    // Database schema information for the AI
    const schemaInfo = `
DATABASE SCHEMA:
- Event: { id, title, description, startTime, endTime, location, color, allDay, userId, contactId, createdAt, updatedAt, imageUrl }
- Contact: { id, firstName, lastName, email, phone, company, position, notes, tags[], userId, createdAt, updatedAt }

CURRENT DATE AND TIME:
- Current Date: ${currentDateFormatted}
- Current Time: ${currentTime}
- Current ISO Timestamp: ${currentDate}

TIME PARSING INSTRUCTIONS:
- When the user says 'today', use the current date: ${now.toISOString().split('T')[0]}
- When the user says 'tomorrow', add 1 day to the current date
- When the user says 'in X hours' or 'X hours from now', add X hours to the current time (${currentDate})
- When the user says 'in X minutes' or 'X minutes from now', add X minutes to the current time
- When the user says 'at [time]', parse the time and use today's date (or tomorrow if the time has passed)
- Always convert relative times to absolute ISO 8601 timestamps (e.g., '2024-01-15T14:30:00.000Z')
- Default event duration is 1 hour if not specified
- Example: "1 hour from now" = add 1 hour to ${currentDate}

AVAILABLE ACTIONS:
You can perform actions by responding with JSON in this format:
{"action": "ACTION_TYPE", "data": {...}}

ACTION TYPES:
1. create_event - Create a new calendar event
   Required: title, startTime (ISO 8601 string), endTime (ISO 8601 string)
   Optional: description, location, color, allDay, contactId, generateImage (boolean)
   - generateImage: Set to true if user requests AI image generation for the event
   - startTime/endTime: Must be ISO 8601 format (e.g., "2024-01-15T14:30:00.000Z")
   - Parse relative times like "today 1 hour from now" to absolute timestamps

2. update_event - Update an existing event
   Required: id
   Optional: title, description, startTime, endTime, location, color, allDay, contactId

3. delete_event - Delete an event
   Required: id

4. create_contact - Create a new contact
   Required: firstName, lastName, email
   Optional: phone, company, position, notes, tags (array)

5. update_contact - Update an existing contact
   Required: id
   Optional: firstName, lastName, email, phone, company, position, notes, tags

6. delete_contact - Delete a contact
   Required: id

When you want to perform an action, respond with ONLY the JSON action object, nothing else.
When responding normally, do not include any JSON action objects.

EXAMPLES:
- User: "make an event for today 1 hour from now for 'Team Meeting' and make an image for the event"
  Response: {"action": "create_event", "data": {"title": "Team Meeting", "startTime": "[1 hour from now ISO]", "endTime": "[2 hours from now ISO]", "generateImage": true}}
`

    // Build system context
    const systemContext = context
      ? `${context}\n\n${schemaInfo}\n\nYou are an AI assistant that can help manage calendar events and contacts. You can answer questions AND perform actions on the database. When the user asks you to create, update, or delete something, respond with a JSON action object. Otherwise, respond naturally.`
      : `${schemaInfo}\n\nYou are a helpful assistant that can manage calendar events and contacts. Maintain conversation context from previous messages.`

    // Build the full prompt with context and conversation history
    let fullPrompt = systemContext

    // Add conversation history for context
    if (conversationHistory.length > 0) {
      fullPrompt += "\n\n--- Previous Conversation ---\n"
      conversationHistory.forEach((msg) => {
        const roleLabel = msg.role === 'user' ? 'User' : 'Assistant'
        fullPrompt += `${roleLabel}: ${msg.content}\n\n`
      })
      fullPrompt += "--- End Previous Conversation ---\n\n"
    }

    // Add current user prompt
    fullPrompt += `User: ${prompt}\n\nAssistant:`

    // Generate response with full context
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
    })

    const responseText = result.text ?? ""
    
    // Check if the response contains a JSON action
    const jsonMatch = responseText.match(/\{[\s\S]*"action"[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const actionData = JSON.parse(jsonMatch[0])
        if (actionData.action && actionData.data) {
          return NextResponse.json({ 
            text: responseText.replace(jsonMatch[0], '').trim() || 'Action performed successfully.',
            action: actionData 
          })
        }
      } catch (e) {
        // If JSON parsing fails, just return the text
        console.error('Failed to parse action JSON:', e)
      }
    }

    return NextResponse.json({ text: responseText })
  } catch (error) {
    console.error("AI request failed:", error)
    return NextResponse.json({ error: "AI request failed" }, { status: 500 })
  }
}

