import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'
import { prisma } from '@/lib/db'
import { validateTextInput, validateImageUrl, validateColor } from '@/lib/input-validator'

type ActionType = 
  | 'create_event'
  | 'update_event'
  | 'delete_event'
  | 'create_contact'
  | 'update_contact'
  | 'delete_contact'

interface ActionRequest {
  action: ActionType
  data: any
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const body: ActionRequest = await request.json()
    const { action, data } = body

    let result: any

    switch (action) {
      case 'create_event':
        if (!data.title || !data.startTime || !data.endTime) {
          return NextResponse.json({ error: 'Missing required fields: title, startTime, endTime' }, { status: 400 })
        }
        
        console.log('[AI Actions] create_event called', {
          title: data.title,
          generateImage: data.generateImage,
          generateImageType: typeof data.generateImage
        })
        
        // Import the async image generation function from shared lib
        const { generateEventImageAsync } = await import('@/lib/generate-event-image')
        console.log('[AI Actions] Successfully imported generateEventImageAsync', { hasFunction: !!generateEventImageAsync })
        
        // Create event directly (image generation will happen async if requested)
        const eventData = {
          title: data.title,
          description: data.description || null,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          location: data.location || null,
          color: data.color || '#3b82f6',
          allDay: data.allDay || false,
          userId,
          contactId: data.contactId || null,
        }
        
        result = await prisma.event.create({
          data: eventData,
          include: {
            contact: true,
          },
        })
        
        console.log('[AI Actions] Event created', { eventId: result.id, generateImage: data.generateImage })
        
        // Generate image asynchronously if requested (don't await)
        if (data.generateImage === true || data.generateImage === 'true') {
          console.log('[AI Actions] Starting async image generation', {
            eventId: result.id,
            title: data.title,
            description: data.description || '',
            color: data.color || '#3b82f6',
            generateImageValue: data.generateImage
          })
          
          generateEventImageAsync(result.id, data.title, data.description || '', data.color || '#3b82f6', data.startTime)
            .then(() => {
              console.log('[AI Actions] Background image generation completed', { eventId: result.id })
            })
            .catch((error) => {
              console.error('[AI Actions] Background image generation failed:', error)
              if (error instanceof Error) {
                console.error('[AI Actions] Error details:', {
                  message: error.message,
                  stack: error.stack,
                  name: error.name
                })
              }
            })
        } else {
          console.log('[AI Actions] Skipping image generation', {
            generateImage: data.generateImage,
            generateImageType: typeof data.generateImage
          })
        }
        break

      case 'update_event':
        if (!data.id) {
          return NextResponse.json({ error: 'Missing event id' }, { status: 400 })
        }
        // Verify event belongs to user
        const existingEvent = await prisma.event.findUnique({
          where: { id: data.id },
        })
        if (!existingEvent || existingEvent.userId !== userId) {
          return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 })
        }

        // Validate inputs if provided
        if (data.title) {
          const titleValidation = validateTextInput(data.title, 200, "Title")
          if (!titleValidation.valid) {
            return NextResponse.json({ error: titleValidation.error }, { status: 400 })
          }
        }

        if (data.description !== undefined && data.description) {
          const descValidation = validateTextInput(data.description, 2000, "Description")
          if (!descValidation.valid) {
            return NextResponse.json({ error: descValidation.error }, { status: 400 })
          }
        }

        if (data.location !== undefined && data.location) {
          const locValidation = validateTextInput(data.location, 200, "Location")
          if (!locValidation.valid) {
            return NextResponse.json({ error: locValidation.error }, { status: 400 })
          }
        }

        if (data.color) {
          const colorValidation = validateColor(data.color)
          if (!colorValidation.valid) {
            return NextResponse.json({ error: colorValidation.error || "Invalid color" }, { status: 400 })
          }
        }

        result = await prisma.event.update({
          where: { id: data.id },
          data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.startTime && { startTime: new Date(data.startTime) }),
            ...(data.endTime && { endTime: new Date(data.endTime) }),
            ...(data.location !== undefined && { location: data.location }),
            ...(data.color && { color: data.color }),
            ...(data.allDay !== undefined && { allDay: data.allDay }),
            ...(data.contactId !== undefined && { contactId: data.contactId }),
          },
          include: {
            contact: true,
          },
        })
        break

      case 'delete_event':
        if (!data.id) {
          return NextResponse.json({ error: 'Missing event id' }, { status: 400 })
        }
        const eventToDelete = await prisma.event.findUnique({
          where: { id: data.id },
        })
        if (!eventToDelete || eventToDelete.userId !== userId) {
          return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 })
        }
        await prisma.event.delete({
          where: { id: data.id },
        })
        result = { success: true, message: 'Event deleted' }
        break

      case 'create_contact':
        if (!data.firstName || !data.lastName || !data.email) {
          return NextResponse.json({ error: 'Missing required fields: firstName, lastName, email' }, { status: 400 })
        }

        // Validate inputs
        const firstNameValidation = validateTextInput(data.firstName, 100, "First name")
        if (!firstNameValidation.valid) {
          return NextResponse.json({ error: firstNameValidation.error }, { status: 400 })
        }

        const lastNameValidation = validateTextInput(data.lastName, 100, "Last name")
        if (!lastNameValidation.valid) {
          return NextResponse.json({ error: lastNameValidation.error }, { status: 400 })
        }

        const emailValidation = validateTextInput(data.email, 255, "Email")
        if (!emailValidation.valid) {
          return NextResponse.json({ error: emailValidation.error }, { status: 400 })
        }

        if (data.phone) {
          const phoneValidation = validateTextInput(data.phone, 50, "Phone")
          if (!phoneValidation.valid) {
            return NextResponse.json({ error: phoneValidation.error }, { status: 400 })
          }
        }

        if (data.company) {
          const companyValidation = validateTextInput(data.company, 200, "Company")
          if (!companyValidation.valid) {
            return NextResponse.json({ error: companyValidation.error }, { status: 400 })
          }
        }

        if (data.position) {
          const positionValidation = validateTextInput(data.position, 200, "Position")
          if (!positionValidation.valid) {
            return NextResponse.json({ error: positionValidation.error }, { status: 400 })
          }
        }

        if (data.notes) {
          const notesValidation = validateTextInput(data.notes, 2000, "Notes")
          if (!notesValidation.valid) {
            return NextResponse.json({ error: notesValidation.error }, { status: 400 })
          }
        }

        if (data.tags && Array.isArray(data.tags)) {
          for (const tag of data.tags) {
            if (typeof tag === 'string') {
              const tagValidation = validateTextInput(tag, 50, "Tag")
              if (!tagValidation.valid) {
                return NextResponse.json({ error: `Invalid tag: ${tagValidation.error}` }, { status: 400 })
              }
            }
          }
        }

        result = await prisma.contact.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || null,
            company: data.company || null,
            position: data.position || null,
            notes: data.notes || null,
            tags: data.tags || [],
            userId,
          },
        })
        break

      case 'update_contact':
        if (!data.id) {
          return NextResponse.json({ error: 'Missing contact id' }, { status: 400 })
        }
        const existingContact = await prisma.contact.findUnique({
          where: { id: data.id },
        })
        if (!existingContact || existingContact.userId !== userId) {
          return NextResponse.json({ error: 'Contact not found or unauthorized' }, { status: 404 })
        }
        result = await prisma.contact.update({
          where: { id: data.id },
          data: {
            ...(data.firstName && { firstName: data.firstName }),
            ...(data.lastName && { lastName: data.lastName }),
            ...(data.email && { email: data.email }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.company !== undefined && { company: data.company }),
            ...(data.position !== undefined && { position: data.position }),
            ...(data.notes !== undefined && { notes: data.notes }),
            ...(data.tags !== undefined && { tags: data.tags }),
          },
        })
        break

      case 'delete_contact':
        if (!data.id) {
          return NextResponse.json({ error: 'Missing contact id' }, { status: 400 })
        }
        const contactToDelete = await prisma.contact.findUnique({
          where: { id: data.id },
        })
        if (!contactToDelete || contactToDelete.userId !== userId) {
          return NextResponse.json({ error: 'Contact not found or unauthorized' }, { status: 404 })
        }
        await prisma.contact.delete({
          where: { id: data.id },
        })
        result = { success: true, message: 'Contact deleted' }
        break

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('AI action failed:', error)
    return NextResponse.json({ error: 'Action failed', details: String(error) }, { status: 500 })
  }
}

