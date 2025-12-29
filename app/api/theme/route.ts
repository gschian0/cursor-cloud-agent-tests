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
    const currentTheme = body?.currentTheme || ""

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

    // Get current light/dark mode preference
    const colorTheme = body?.colorTheme || 'light'
    const isDark = colorTheme === 'dark'

    const themeSystemPrompt = `
You are a CSS theme designer. The user wants to customize the visual theme of their calendar application.

CURRENT THEME MODE: ${isDark ? 'DARK MODE' : 'LIGHT MODE'}
The user wants a ${isDark ? 'dark' : 'light'} theme. Generate colors appropriate for ${isDark ? 'dark' : 'light'} mode.

CURRENT CSS VARIABLES AND STRUCTURE:
${currentTheme || 'Default theme - no customizations yet'}

AVAILABLE CSS VARIABLES TO MODIFY:
- --primary-color: Main brand color (currently used for buttons, links, active states)
- --secondary-color: Secondary accent color
- --background-color: Main page background
- --surface-color: Card/panel background color
- --text-primary: Primary text color
- --text-secondary: Secondary text color
- --border-color: Border colors
- --header-bg: Header background color
- --header-text: Header text color
- --calendar-bg: Calendar background
- --event-default-color: Default event color
- --gradient-start: Gradient start color (for backgrounds)
- --gradient-end: Gradient end color (for backgrounds)
- --text-size-base: Base font size (default: 16px)
- --text-size-sm: Small font size (default: 14px)
- --text-size-lg: Large font size (default: 18px)
- --text-size-xl: Extra large font size (default: 20px)
- --text-size-2xl: 2XL font size (default: 24px)
- --text-size-3xl: 3XL font size (default: 30px)
- --text-weight-normal: Normal font weight (default: 400)
- --text-weight-medium: Medium font weight (default: 500)
- --text-weight-semibold: Semi-bold font weight (default: 600)
- --text-weight-bold: Bold font weight (default: 700)
- --text-3d-color: Color for 3D text shadow effects (default: rgba(0, 0, 0, 0.3))

RESPONSE FORMAT:
You must respond with ONLY valid CSS in this format:
\`\`\`css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #8b5cf6;
  --background-color: #ffffff;
  --surface-color: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --header-bg: #ffffff;
  --header-text: #111827;
  --calendar-bg: #ffffff;
  --event-default-color: #3b82f6;
  --gradient-start: #eff6ff;
  --gradient-end: #dbeafe;
  --text-size-base: 16px;
  --text-size-sm: 14px;
  --text-size-lg: 18px;
  --text-size-xl: 20px;
  --text-size-2xl: 24px;
  --text-size-3xl: 30px;
  --text-weight-normal: 400;
  --text-weight-medium: 500;
  --text-weight-semibold: 600;
  --text-weight-bold: 700;
  --text-3d-color: rgba(0, 0, 0, 0.3);
}
\`\`\`

IMPORTANT RULES:
1. Always respond with valid CSS wrapped in \`\`\`css code blocks
2. Include ALL CSS variables in your response (don't omit any)
3. Use hex colors or valid CSS color values
4. Ensure good contrast for readability
5. Make sure colors work well together
6. After the CSS block, you can add a brief explanation of the theme

When the user describes a theme (e.g., "dark mode", "ocean blue", "warm sunset"), generate appropriate CSS variables that match their description.
`

    // Build the full prompt
    let fullPrompt = themeSystemPrompt

    // Add conversation history
    if (conversationHistory.length > 0) {
      fullPrompt += "\n\n--- Previous Theme Conversation ---\n"
      conversationHistory.forEach((msg) => {
        const roleLabel = msg.role === 'user' ? 'User' : 'Assistant'
        fullPrompt += `${roleLabel}: ${msg.content}\n\n`
      })
      fullPrompt += "--- End Previous Conversation ---\n\n"
    }

    // Add current user prompt
    fullPrompt += `User request: ${prompt}\n\nGenerate CSS theme:`

    // Use Gemini 3 Pro Preview model
    const result = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: fullPrompt,
    })

    const responseText = result.text ?? ""
    
    // Extract CSS from code blocks
    const cssMatch = responseText.match(/```css\s*([\s\S]*?)```/)
    if (cssMatch && cssMatch[1]) {
      const css = cssMatch[1].trim()
      const explanation = responseText.replace(/```css[\s\S]*?```/, '').trim()
      
      return NextResponse.json({ 
        css,
        explanation: explanation || 'Theme updated successfully!',
        fullResponse: responseText
      })
    }

    // If no CSS block found, try to extract CSS variables from the response
    const cssVarsMatch = responseText.match(/:root\s*\{[\s\S]*?\}/)
    if (cssVarsMatch) {
      return NextResponse.json({ 
        css: cssVarsMatch[0],
        explanation: responseText.replace(cssVarsMatch[0], '').trim() || 'Theme updated!',
        fullResponse: responseText
      })
    }

    return NextResponse.json({ 
      error: "Could not extract CSS from AI response",
      fullResponse: responseText
    }, { status: 500 })
  } catch (error) {
    console.error("Theme generation failed:", error)
    return NextResponse.json({ error: "Theme generation failed", details: String(error) }, { status: 500 })
  }
}

