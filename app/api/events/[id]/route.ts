import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'
import { generateEventImageAsync } from '@/lib/generate-event-image'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        contact: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Log imageUrl status for debugging
    console.log(`[GET /api/events/${id}] Returning event`, {
      eventId: event.id,
      hasImageUrl: !!event.imageUrl,
      imageUrlLength: event.imageUrl?.length || 0,
      imageUrlPreview: event.imageUrl ? event.imageUrl.substring(0, 50) + '...' : null
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to fetch event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
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
    const { title, description, startTime, endTime, location, color, allDay, contactId, imageUrl, generateImage } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify event belongs to user
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existingEvent.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        color: color || '#3b82f6',
        allDay: allDay || false,
        contactId: contactId || null,
        imageUrl: imageUrl !== undefined ? (imageUrl || null) : undefined, // Only update if provided
      },
      include: {
        contact: true,
      },
    })

    // Generate image asynchronously if no imageUrl and generateImage is true (or if imageUrl was explicitly set to empty)
    const shouldGenerate = (imageUrl === '' || (!imageUrl && !existingEvent.imageUrl)) && 
                          (generateImage === true || generateImage === 'true' || generateImage === undefined)
    
    if (shouldGenerate) {
      console.log('[PUT /api/events/[id]] No imageUrl, starting async image generation', {
        eventId: event.id,
        title,
        description: description || '',
        color: color || '#3b82f6',
        startTime,
        generateImageType: typeof generateImage,
        generateImageValue: generateImage
      })
      
      // Fire and forget - generate image in background
      generateEventImageAsync(event.id, title, description || '', color || '#3b82f6', startTime)
        .then(() => {
          console.log('[PUT /api/events/[id]] Background image generation completed successfully', { eventId: event.id })
        })
        .catch((error) => {
          console.error('[PUT /api/events/[id]] Background image generation failed:', error)
        })
    } else {
      console.log('[PUT /api/events/[id]] Skipping image generation', {
        hasImageUrl: !!imageUrl,
        existingImageUrl: !!existingEvent.imageUrl,
        generateImageValue: generateImage,
        generateImageType: typeof generateImage
      })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to update event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
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

    // Verify event belongs to user
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existingEvent.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}

