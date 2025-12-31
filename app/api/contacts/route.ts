import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'
import { generateContactImageAsync } from '@/lib/generate-contact-image'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    const contacts = await prisma.contact.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, company, position, notes, tags, imageUrl, generateImage } = body

    console.log('[POST /api/contacts] Request body:', { firstName, lastName, email, phone, company, position, hasNotes: !!notes, tagsCount: tags?.length || 0, hasImageUrl: !!imageUrl })

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields: firstName, lastName, and email are required' }, { status: 400 })
    }

    // Clean up empty strings to null
    const contactData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      position: position?.trim() || null,
      notes: notes?.trim() || null,
      tags: tags || [],
      imageUrl: imageUrl?.trim() || null,
      userId,
    }

    console.log('[POST /api/contacts] Creating contact with data:', { ...contactData, userId: '***' })

    const contact = await prisma.contact.create({
      data: contactData,
    })

    console.log('[POST /api/contacts] Contact created successfully:', { contactId: contact.id, email: contact.email })

    // Generate image asynchronously if no imageUrl provided and generateImage is true (or default to true if not specified)
    if (!imageUrl && (generateImage === true || generateImage === 'true' || generateImage === undefined)) {
      console.log('[POST /api/contacts] No imageUrl provided, starting async image generation', {
        contactId: contact.id,
        firstName,
        lastName,
        company,
        position,
        generateImageType: typeof generateImage,
        generateImageValue: generateImage
      })
      
      // Fire and forget - generate image in background
      generateContactImageAsync(contact.id, firstName, lastName, company, position, notes)
        .then(() => {
          console.log('[POST /api/contacts] Background image generation completed successfully', { contactId: contact.id })
        })
        .catch((error) => {
          console.error('[POST /api/contacts] Background image generation failed:', error)
        })
    } else {
      console.log('[POST /api/contacts] Skipping image generation', {
        hasImageUrl: !!imageUrl,
        generateImageValue: generateImage,
        generateImageType: typeof generateImage
      })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('[POST /api/contacts] Failed to create contact:', error)
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create contact'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('[POST /api/contacts] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      
      // Check for Prisma errors
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'A contact with this email already exists'
        statusCode = 409
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Invalid user ID'
        statusCode = 400
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
