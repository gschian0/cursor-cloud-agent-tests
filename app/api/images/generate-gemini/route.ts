import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'
import { generateGeminiImage } from '@/lib/generate-gemini-image'

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const body = await request.json().catch(() => null)
    const { prompt } = body

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    const result = await generateGeminiImage(prompt)

    if (result && result.imageUrl) {
      return NextResponse.json({ 
        imageUrl: result.imageUrl,
        textResponse: result.textResponse || null,
        success: true,
      })
    }

    // If no image was generated, return error
    return NextResponse.json({ 
      error: "No image was generated",
      textResponse: result?.textResponse || null,
    }, { status: 500 })
  } catch (error) {
    console.error("Image generation failed:", error)
    return NextResponse.json({ 
      error: "Image generation failed", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}

