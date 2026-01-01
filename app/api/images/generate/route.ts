import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"

// Helper function to generate SVG placeholder images
function generateSVGPlaceholder(type: string, prompt: string, theme?: string): string {
  const colors = theme ? {
    primary: theme.includes('blue') ? '#3b82f6' : theme.includes('purple') ? '#8b5cf6' : '#3b82f6',
    secondary: theme.includes('purple') ? '#a78bfa' : '#60a5fa',
  } : { primary: '#3b82f6', secondary: '#8b5cf6' }

  if (type === "event") {
    // Generate a themed event card SVG
    const svg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#grad)" rx="12"/>
        <text x="200" y="200" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
              fill="white" text-anchor="middle" dominant-baseline="middle">
          ${prompt.substring(0, 20)}
        </text>
      </svg>
    `
    // Encode SVG to base64
    const base64 = typeof Buffer !== 'undefined' 
      ? Buffer.from(svg).toString('base64')
      : btoa(unescape(encodeURIComponent(svg)))
    return `data:image/svg+xml;base64,${base64}`
  } else if (type === "logo") {
    // Generate a logo SVG
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="${colors.primary}" opacity="0.9"/>
        <text x="100" y="120" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
              fill="white" text-anchor="middle">AI</text>
      </svg>
    `
    // Encode SVG to base64
    const base64 = typeof Buffer !== 'undefined' 
      ? Buffer.from(svg).toString('base64')
      : btoa(unescape(encodeURIComponent(svg)))
    return `data:image/svg+xml;base64,${base64}`
  } else if (type === "header") {
    // Generate a header banner SVG
    const svg = `
      <svg width="1920" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1920" height="300" fill="url(#headerGrad)"/>
        <circle cx="150" cy="150" r="80" fill="white" opacity="0.2"/>
        <circle cx="1770" cy="150" r="100" fill="white" opacity="0.1"/>
      </svg>
    `
    // Encode SVG to base64
    const base64 = typeof Buffer !== 'undefined' 
      ? Buffer.from(svg).toString('base64')
      : btoa(unescape(encodeURIComponent(svg)))
    return `data:image/svg+xml;base64,${base64}`
  }
  
  return ""
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const { getTestUserId } = await import('@/lib/test-user')
    const userId = session?.user?.id || await getTestUserId()

    const body = await request.json().catch(() => null)
    const { prompt, type, theme, useAI = false } = body

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    // If useAI is false or Gemini is not available, use SVG placeholders
    if (!useAI) {
      const imageUrl = generateSVGPlaceholder(type || "event", prompt, theme)
      return NextResponse.json({ 
        imageUrl,
        success: true,
        method: "svg_placeholder"
      })
    }

    const apiKey =
      process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || ""
    if (!apiKey) {
      // Fallback to SVG placeholder
      const imageUrl = generateSVGPlaceholder(type || "event", prompt, theme)
      return NextResponse.json({ 
        imageUrl,
        success: true,
        method: "svg_placeholder_fallback"
      })
    }

    const ai = new GoogleGenAI({ apiKey })

    // Build detailed image description using Gemini
    let descriptionPrompt = ""
    
    if (type === "event") {
      descriptionPrompt = `Create a detailed visual description for a calendar event image: "${prompt}". 
      Describe the image in detail including colors, style, composition, and visual elements.
      The description should be suitable for generating an image with an AI image generator.`
    } else if (type === "logo") {
      descriptionPrompt = `Create a detailed visual description for a logo for a Smart Calendar application.
      Theme colors: ${theme || 'blue and purple'}
      Describe the logo design in detail including colors, style, symbols, and composition.
      The description should be suitable for generating a logo with an AI image generator.`
    } else if (type === "header") {
      descriptionPrompt = `Create a detailed visual description for a header banner for a Smart Calendar application.
      Theme colors: ${theme || 'blue and purple gradient'}
      Describe the header design in detail including colors, patterns, gradients, and visual elements.
      The description should be suitable for generating a header with an AI image generator.`
    } else {
      descriptionPrompt = prompt
    }

    // Use Gemini to generate a detailed image description
    const result = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: descriptionPrompt,
    })

    const imageDescription = result.text ?? ""
    
    // For now, return the description and use SVG placeholder
    // In production, you would send this description to an image generation service
    // like DALL-E, Midjourney, Stable Diffusion, etc.
    const imageUrl = generateSVGPlaceholder(type || "event", prompt, theme)
    
    return NextResponse.json({ 
      imageUrl,
      imageDescription, // Return the description for potential future use
      success: true,
      method: "gemini_description_with_svg"
    })
  } catch (error) {
    console.error("Image generation failed:", error)
    // Fallback to SVG placeholder on error
    const imageUrl = generateSVGPlaceholder(body?.type || "event", body?.prompt || "", body?.theme)
    return NextResponse.json({ 
      imageUrl,
      success: true,
      method: "svg_placeholder_error_fallback",
      error: String(error)
    })
  }
}

