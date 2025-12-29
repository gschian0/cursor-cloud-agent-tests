import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let siteSettings = await prisma.siteSettings.findUnique({
      where: { userId },
    })

    // Create default if doesn't exist
    if (!siteSettings) {
      siteSettings = await prisma.siteSettings.create({
        data: {
          userId,
        },
      })
    }

    return NextResponse.json(siteSettings)
  } catch (error) {
    console.error('Failed to fetch site settings:', error)
    if (error instanceof Error) {
      console.error('Site settings error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json({ error: 'Failed to fetch site settings', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { headerImage, logoImage } = body

    let siteSettings = await prisma.siteSettings.findUnique({
      where: { userId },
    })

    if (siteSettings) {
      siteSettings = await prisma.siteSettings.update({
        where: { userId },
        data: {
          ...(headerImage !== undefined && { headerImage }),
          ...(logoImage !== undefined && { logoImage }),
        },
      })
    } else {
      siteSettings = await prisma.siteSettings.create({
        data: {
          userId,
          headerImage: headerImage || null,
          logoImage: logoImage || null,
        },
      })
    }

    return NextResponse.json(siteSettings)
  } catch (error) {
    console.error('Failed to update site settings:', error)
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 })
  }
}

