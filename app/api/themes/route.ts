import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const themes = await prisma.theme.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(themes)
  } catch (error) {
    console.error('Failed to fetch themes:', error)
    if (error instanceof Error) {
      console.error('Themes error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json({ error: 'Failed to fetch themes', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const body = await request.json()
    const { name, css, isDefault } = body

    if (!name || !css) {
      return NextResponse.json({ error: 'Missing required fields: name, css' }, { status: 400 })
    }

    // If this is set as default, unset other defaults for this user
    if (isDefault) {
      await prisma.theme.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    // Check if theme with this name already exists for this user
    const existing = await prisma.theme.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
    })

    let theme
    if (existing) {
      // Update existing theme
      theme = await prisma.theme.update({
        where: { id: existing.id },
        data: {
          css,
          isDefault: isDefault || false,
        },
      })
    } else {
      // Create new theme
      theme = await prisma.theme.create({
        data: {
          name,
          css,
          isDefault: isDefault || false,
          userId,
        },
      })
    }

    return NextResponse.json(theme)
  } catch (error) {
    console.error('Failed to save theme:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Theme with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 })
  }
}

