import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTestUserId } from '@/lib/test-user'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Auth temporarily disabled for testing
    const userId = await getTestUserId()

    const body = await request.json()
    const { title, description, startTime, endTime, location, color, allDay, contactId } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify event belongs to user
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existingEvent.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        color: color || '#3b82f6',
        allDay: allDay || false,
        contactId: contactId || null,
      },
      include: {
        contact: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to update event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Auth temporarily disabled for testing
    const userId = await getTestUserId()

    // Verify event belongs to user
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existingEvent.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.event.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}

