import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const theme = await prisma.theme.findUnique({
      where: { id },
    })

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    if (theme.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(theme)
  } catch (error) {
    console.error('Failed to fetch theme:', error)
    return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    // Verify theme belongs to user
    const existingTheme = await prisma.theme.findUnique({
      where: { id },
    })

    if (!existingTheme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    if (existingTheme.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.theme.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete theme:', error)
    return NextResponse.json({ error: 'Failed to delete theme' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const body = await request.json()
    const { name, css, isDefault } = body

    // Verify theme belongs to user
    const existingTheme = await prisma.theme.findUnique({
      where: { id },
    })

    if (!existingTheme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    if (existingTheme.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.theme.updateMany({
        where: {
          userId,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      })
    }

    const theme = await prisma.theme.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(css && { css }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return NextResponse.json(theme)
  } catch (error) {
    console.error('Failed to update theme:', error)
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 })
  }
}

