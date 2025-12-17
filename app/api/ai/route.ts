import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const prompt = body?.prompt

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
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    })

    return NextResponse.json({ text: result.text ?? "" })
  } catch (error) {
    console.error("AI request failed:", error)
    return NextResponse.json({ error: "AI request failed" }, { status: 500 })
  }
}

