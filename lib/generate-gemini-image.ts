import { GoogleGenAI } from '@google/genai'

export async function generateGeminiImage(prompt: string): Promise<{ imageUrl: string; textResponse?: string } | null> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || ""
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GENAI_API_KEY (or GEMINI_API_KEY)")
  }

  const ai = new GoogleGenAI({ apiKey })

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

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  })

  let imageData: { data: string; mimeType: string } | null = null
  let textResponse = ""

  for await (const chunk of response) {
    if (!chunk.candidates || !chunk.candidates[0]?.content || !chunk.candidates[0]?.content?.parts) {
      continue
    }

    // Check for image data - iterate through all parts
    const parts = chunk.candidates[0].content.parts
    for (const part of parts) {
      if (part.inlineData) {
        const inlineData = part.inlineData
        // Accumulate image data (may come in multiple chunks)
        if (imageData) {
          // Append base64 data if we already have some
          imageData.data += inlineData.data || ''
        } else {
          // First chunk - initialize
          imageData = {
            data: inlineData.data || '',
            mimeType: inlineData.mimeType || 'image/png',
          }
        }
      }
    }

    // Check for text response
    if (chunk.text) {
      textResponse += chunk.text
    }
  }

  if (imageData && imageData.data) {
    // Convert base64 to data URL
    const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`
    return {
      imageUrl,
      textResponse: textResponse || undefined,
    }
  }

  return null
}

