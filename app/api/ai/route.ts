import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"

type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const prompt = body?.prompt
    const conversationHistory: ConversationMessage[] = body?.conversationHistory || []
    const context = body?.context || ""

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
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

    // Database schema information for the AI
    const schemaInfo = `
DATABASE SCHEMA:
- Event: { id, title, description, startTime, endTime, location, color, allDay, userId, contactId, createdAt, updatedAt }
- Contact: { id, firstName, lastName, email, phone, company, position, notes, tags[], userId, createdAt, updatedAt }

AVAILABLE ACTIONS:
You can perform actions by responding with JSON in this format:
{"action": "ACTION_TYPE", "data": {...}}

ACTION TYPES:
1. create_event - Create a new calendar event
   Required: title, startTime (ISO string), endTime (ISO string)
   Optional: description, location, color, allDay, contactId

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

