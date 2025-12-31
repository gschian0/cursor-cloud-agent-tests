import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getTestUserId } from "@/lib/test-user"
import { GoogleGenAI } from "@google/genai"

type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const body = await request.json().catch(() => null)
    const prompt = body?.prompt || ""
    const conversationHistory: ConversationMessage[] = body?.conversationHistory || []
    const currentTheme = body?.currentTheme || ""
    const imageUrl = body?.imageUrl
    const extractedColors: string[] = body?.extractedColors || []

    // Validate: need either a prompt or image with extracted colors
    if ((!prompt || prompt.trim().length === 0) && (!imageUrl || extractedColors.length === 0)) {
      return NextResponse.json({ error: "Missing prompt or image data with extracted colors" }, { status: 400 })
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

IMPORTANT: You MUST generate BOTH a light mode AND a dark mode version of the theme. The user's request should be interpreted as a theme concept that works in both modes.

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
- --text-3d-color: Color for 3D text shadow effects (default: rgba(0, 0, 0, 0.3) for light, rgba(0, 0, 0, 0.5) for dark)

RESPONSE FORMAT:
You must respond with BOTH light and dark mode CSS in this format:
\`\`\`css
/* LIGHT MODE */
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

/* DARK MODE */
[data-theme="dark"] {
  --primary-color: #60a5fa;
  --secondary-color: #a78bfa;
  --background-color: #0f172a;
  --surface-color: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --border-color: #334155;
  --header-bg: #1e293b;
  --header-text: #f1f5f9;
  --calendar-bg: #1e293b;
  --event-default-color: #60a5fa;
  --gradient-start: #1e293b;
  --gradient-end: #0f172a;
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
  --text-3d-color: rgba(0, 0, 0, 0.5);
}
\`\`\`

IMPORTANT RULES:
1. ALWAYS generate BOTH light and dark mode versions
2. Light mode uses :root selector
3. Dark mode uses [data-theme="dark"] selector
4. Include ALL CSS variables in both versions (don't omit any)
5. Use hex colors or valid CSS color values
6. Ensure good contrast for readability in both modes
7. Make sure colors work well together in both modes
8. The theme concept (e.g., "ocean blue", "warm sunset") should be consistent across both modes but adapted appropriately
9. After the CSS blocks, you can add a brief explanation of the theme

When the user describes a theme (e.g., "ocean blue", "warm sunset", "forest green"), generate appropriate CSS variables for BOTH light and dark modes that match their description.
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

    // Add image color information if available
    if (extractedColors && extractedColors.length > 0) {
      fullPrompt += `\n\n--- COLOR PALETTE FROM UPLOADED IMAGE ---\n`
      fullPrompt += `The user has uploaded an image and extracted the following dominant colors:\n`
      extractedColors.forEach((color, index) => {
        fullPrompt += `${index + 1}. ${color}\n`
      })
      fullPrompt += `\nUse these colors as the foundation for the theme. Create a cohesive color scheme that incorporates these colors naturally.\n`
      fullPrompt += `Primary colors should come from the most prominent extracted colors.\n`
      fullPrompt += `--- END COLOR PALETTE ---\n\n`
    }

    // Add current user prompt
    const userRequest = prompt || (extractedColors.length > 0 
      ? `Create a theme based on the colors extracted from the uploaded image: ${extractedColors.join(', ')}`
      : '')
    fullPrompt += `User request: ${userRequest}\n\nGenerate CSS theme:`

    // Use Gemini 3 Pro Preview model
    const result = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: fullPrompt,
    })

    const responseText = result.text ?? ""
    
    // Extract CSS from code blocks
    const cssMatch = responseText.match(/```css\s*([\s\S]*?)```/)
    if (cssMatch && cssMatch[1]) {
      const fullCss = cssMatch[1].trim()
      
      // Extract light mode (:root) and dark mode ([data-theme="dark"])
      const lightMatch = fullCss.match(/:root\s*\{([\s\S]*?)\}(?=\s*\/\*|\s*\[|$)/)
      const darkMatch = fullCss.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}(?=\s*\/\*|$)/)
      
      let lightCss = ''
      let darkCss = ''
      
      if (lightMatch && lightMatch[1]) {
        lightCss = `:root {\n${lightMatch[1].trim()}\n}`
      }
      
      if (darkMatch && darkMatch[1]) {
        darkCss = `[data-theme="dark"] {\n${darkMatch[1].trim()}\n}`
      }
      
      // If we didn't find separate light/dark, try to extract from full CSS
      if (!lightCss && !darkCss) {
        // Fallback: treat entire CSS as light mode
        lightCss = fullCss.includes(':root') ? fullCss : `:root {\n${fullCss}\n}`
      }
      
      // If only one version found, generate the other
      if (lightCss && !darkCss) {
        // Generate dark mode from light mode (basic conversion)
        darkCss = lightCss.replace(/:root/g, '[data-theme="dark"]')
      } else if (darkCss && !lightCss) {
        // Generate light mode from dark mode (basic conversion)
        lightCss = darkCss.replace(/\[data-theme="dark"\]/g, ':root')
      }
      
      const explanation = responseText.replace(/```css[\s\S]*?```/, '').trim()
      
      return NextResponse.json({ 
        css: lightCss, // Return light mode as default for backward compatibility
        cssLight: lightCss,
        cssDark: darkCss,
        explanation: explanation || 'Theme updated successfully!',
        fullResponse: responseText
      })
    }

    // If no CSS block found, try to extract CSS variables from the response
    const cssVarsMatch = responseText.match(/:root\s*\{[\s\S]*?\}/)
    if (cssVarsMatch) {
      const lightCss = cssVarsMatch[0]
      // Generate basic dark mode version
      const darkCss = lightCss.replace(/:root/g, '[data-theme="dark"]')
      
      return NextResponse.json({ 
        css: lightCss,
        cssLight: lightCss,
        cssDark: darkCss,
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

