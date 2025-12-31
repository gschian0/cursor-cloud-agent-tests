import { GoogleGenAI } from "@google/genai"

// Helper function to generate SVG placeholder images
export function generateSVGPlaceholder(type: string, prompt: string, theme?: string): string {
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
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  } else if (type === "contact") {
    // Generate a themed contact avatar SVG
    const initials = prompt.substring(0, 2).toUpperCase()
    const svg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="contactGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#contactGrad)" rx="200"/>
        <text x="200" y="250" font-family="Arial, sans-serif" font-size="120" font-weight="bold" 
              fill="white" text-anchor="middle" dominant-baseline="middle">
          ${initials}
        </text>
      </svg>
    `
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  } else if (type === "logo") {
    // Generate a logo SVG
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="${colors.primary}" opacity="0.9"/>
        <text x="100" y="120" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
              fill="white" text-anchor="middle">AI</text>
      </svg>
    `
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
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
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  }
  
  return ""
}

export async function generateEventImage(title: string, description: string, color: string, startTime?: string | Date): Promise<string> {
  console.log('[generateEventImage] Starting image generation', { title, description, color, startTime })
  
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || ""
  
  if (!apiKey) {
    console.warn('[generateEventImage] Missing API key, using SVG placeholder')
    return generateSVGPlaceholder('event', `${title}${description ? ` - ${description}` : ''}`, color)
  }

  try {
    console.log('[generateEventImage] Initializing GoogleGenAI')
    const ai = new GoogleGenAI({ apiKey })
    
    // Format the event date for the prompt
    let dateContext = ''
    if (startTime) {
      const eventDate = new Date(startTime)
      const dateStr = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      const timeStr = eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
      dateContext = ` The event is scheduled for ${dateStr} at ${timeStr}.`
    }
    
    // Create a prompt for image generation - matching the working Image tab logic
    // Customizable prompt - includes event date and context
    const prompt = `Generate an image for a calendar event titled "${title}"${description ? ` with description: "${description}"` : ''}.${dateContext} The event color theme is ${color}. Create a visually appealing, abstract or symbolic representation suitable for a calendar event that reflects the event's date and context.`
    
    console.log('[generateEventImage] Prompt:', prompt)
    
    // Use the exact same config as the working generate-gemini route
    const tools = [
      {
        googleSearch: {}
      },
    ]

    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        imageSize: '1K',
      },
      tools,
    }

    const model = 'gemini-3-pro-image-preview'
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ]

    console.log('[generateEventImage] Calling generateContentStream', { model, config })
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    })

    let imageData: { data: string; mimeType: string } | null = null
    let textResponse = ""
    let chunkCount = 0

    console.log('[generateEventImage] Processing stream chunks')
    for await (const chunk of response) {
      chunkCount++
      
      if (!chunk.candidates || !chunk.candidates[0]?.content || !chunk.candidates[0]?.content?.parts) {
        console.log(`[generateEventImage] Chunk ${chunkCount}: No candidates or content`)
        continue
      }

      // Check for image data
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData
        imageData = {
          data: inlineData.data || '',
          mimeType: inlineData.mimeType || 'image/png',
        }
        console.log(`[generateEventImage] Chunk ${chunkCount}: Found image data`, { 
          mimeType: imageData.mimeType, 
          dataLength: imageData.data?.length || 0 
        })
      }

      // Check for text response
      if (chunk.text) {
        textResponse += chunk.text
        console.log(`[generateEventImage] Chunk ${chunkCount}: Text response`, { text: chunk.text })
      }
    }

    console.log('[generateEventImage] Stream processing complete', { 
      chunkCount, 
      hasImageData: !!imageData, 
      imageDataLength: imageData?.data?.length || 0,
      textResponseLength: textResponse.length 
    })

    if (imageData && imageData.data) {
      // Convert base64 to data URL
      const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`
      console.log('[generateEventImage] Successfully generated image', { 
        imageUrlLength: imageUrl.length,
        mimeType: imageData.mimeType 
      })
      return imageUrl
    }

    // If no image was generated, log and fallback
    console.warn('[generateEventImage] No image data found in response', { 
      textResponse: textResponse || 'No text response',
      chunkCount 
    })
    return generateSVGPlaceholder('event', `${title}${description ? ` - ${description}` : ''}`, color)
  } catch (error) {
    console.error('[generateEventImage] Error during image generation:', error)
    if (error instanceof Error) {
      console.error('[generateEventImage] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return generateSVGPlaceholder('event', `${title}${description ? ` - ${description}` : ''}`, color)
  }
}

export async function generateContactImage(firstName: string, lastName: string, company?: string, position?: string, notes?: string): Promise<string> {
  console.log('[generateContactImage] Starting image generation', { firstName, lastName, company, position })
  
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || ""
  
  if (!apiKey) {
    console.warn('[generateContactImage] Missing API key, using SVG placeholder')
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    return generateSVGPlaceholder('contact', initials, '#3b82f6')
  }

  try {
    console.log('[generateContactImage] Initializing GoogleGenAI')
    const ai = new GoogleGenAI({ apiKey })
    
    // Build context for the prompt
    const name = `${firstName} ${lastName}`
    const context = [
      company && `works at ${company}`,
      position && `as a ${position}`,
      notes && `with notes: ${notes.substring(0, 100)}`
    ].filter(Boolean).join(', ')
    
    // Create a prompt for contact image generation
    const prompt = `Generate a professional portrait or avatar image for a contact named "${name}"${context ? ` who ${context}` : ''}. Create a clean, professional, and friendly representation suitable for a contact card or profile picture.`
    
    console.log('[generateContactImage] Prompt:', prompt)
    
    const tools = [
      {
        googleSearch: {}
      },
    ]

    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        imageSize: '1K',
      },
      tools,
    }

    const model = 'gemini-3-pro-image-preview'
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ]

    console.log('[generateContactImage] Calling generateContentStream', { model, config })
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    })

    let imageData: { data: string; mimeType: string } | null = null
    let textResponse = ""
    let chunkCount = 0

    console.log('[generateContactImage] Processing stream chunks')
    for await (const chunk of response) {
      chunkCount++
      
      if (!chunk.candidates || !chunk.candidates[0]?.content || !chunk.candidates[0]?.content?.parts) {
        console.log(`[generateContactImage] Chunk ${chunkCount}: No candidates or content`)
        continue
      }

      // Check for image data
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData
        imageData = {
          data: inlineData.data || '',
          mimeType: inlineData.mimeType || 'image/png',
        }
        console.log(`[generateContactImage] Chunk ${chunkCount}: Found image data`, { 
          mimeType: imageData.mimeType, 
          dataLength: imageData.data?.length || 0 
        })
      }

      // Check for text response
      if (chunk.text) {
        textResponse += chunk.text
        console.log(`[generateContactImage] Chunk ${chunkCount}: Text response`, { text: chunk.text })
      }
    }

    console.log('[generateContactImage] Stream processing complete', { 
      chunkCount, 
      hasImageData: !!imageData, 
      imageDataLength: imageData?.data?.length || 0,
      textResponseLength: textResponse.length 
    })

    if (imageData && imageData.data) {
      // Convert base64 to data URL
      const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`
      console.log('[generateContactImage] Successfully generated image', { 
        imageUrlLength: imageUrl.length,
        mimeType: imageData.mimeType 
      })
      return imageUrl
    }

    // If no image was generated, log and fallback
    console.warn('[generateContactImage] No image data found in response', { 
      textResponse: textResponse || 'No text response',
      chunkCount 
    })
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    return generateSVGPlaceholder('contact', initials, '#3b82f6')
  } catch (error) {
    console.error('[generateContactImage] Error during image generation:', error)
    if (error instanceof Error) {
      console.error('[generateContactImage] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    return generateSVGPlaceholder('contact', initials, '#3b82f6')
  }
}

