import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'
import { generateEventImageAsync } from '@/lib/generate-event-image'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

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
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const body = await request.json()
    const { title, description, startTime, endTime, location, color, allDay, contactId, generateImage } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create event immediately (image will be generated asynchronously)
    const eventData = {
      title,
      description: description || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location: location || null,
      color: color || '#3b82f6',
      allDay: allDay || false,
      userId,
      contactId: contactId || null,
    }
    
    console.log('Creating event with data:', eventData)
    
    const event = await prisma.event.create({
      data: eventData,
      include: {
        contact: true,
      },
    })
    
    console.log('Event created successfully:', event.id)
    console.log('[POST /api/events] generateImage value:', generateImage, typeof generateImage)

    // Generate image asynchronously if requested (don't await)
    if (generateImage === true || generateImage === 'true') {
      console.log('[POST /api/events] generateImage is true, starting async image generation', {
        eventId: event.id,
        title,
        description: description || '',
        color: color || '#3b82f6',
        generateImageType: typeof generateImage,
        generateImageValue: generateImage
      })
      
      // Fire and forget - generate image in background
      // IMPORTANT: Don't await - let it run asynchronously
      const imagePromise = generateEventImageAsync(event.id, title, description || '', color || '#3b82f6')
      console.log('[POST /api/events] Async function called, promise created')
      
      imagePromise
        .then(() => {
          console.log('[POST /api/events] Background image generation completed successfully', { eventId: event.id })
        })
        .catch((error) => {
          console.error('[POST /api/events] Background image generation failed:', error)
          if (error instanceof Error) {
            console.error('[POST /api/events] Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name
            })
          }
        })
    } else {
      console.log('[POST /api/events] generateImage is false, skipping image generation', {
        generateImageValue: generateImage,
        generateImageType: typeof generateImage
      })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
