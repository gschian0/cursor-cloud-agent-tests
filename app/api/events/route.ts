import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTestUserId } from '@/lib/test-user'

export async function GET() {
  try {
    // Auth temporarily disabled for testing
    const userId = await getTestUserId()

    const events = await prisma.event.findMany({
      where: {
        userId,
      },
      include: {
        contact: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Auth temporarily disabled for testing
    const userId = await getTestUserId()

    const body = await request.json()
    const { title, description, startTime, endTime, location, color, allDay, contactId } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        color: color || '#3b82f6',
        allDay: allDay || false,
        userId,
        contactId: contactId || null,
      },
      include: {
        contact: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
