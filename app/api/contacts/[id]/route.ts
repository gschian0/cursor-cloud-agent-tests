import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'
import { generateContactImageAsync } from '@/lib/generate-contact-image'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (contact.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('[GET /api/contacts/[id]] Failed to fetch contact:', error)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
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
    const { firstName, lastName, email, phone, company, position, notes, tags, imageUrl, generateImage } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify contact belongs to user
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (existingContact.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        company: company || null,
        position: position || null,
        notes: notes || null,
        tags: tags || [],
        imageUrl: imageUrl !== undefined ? (imageUrl || null) : undefined, // Only update if provided
      },
    })

    // Generate image asynchronously if no imageUrl and generateImage is true (or if imageUrl was explicitly set to empty)
    const shouldGenerate = (imageUrl === '' || (!imageUrl && !existingContact.imageUrl)) && 
                          (generateImage === true || generateImage === 'true' || generateImage === undefined)
    
    if (shouldGenerate) {
      console.log('[PUT /api/contacts/[id]] No imageUrl, starting async image generation', {
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
          console.log('[PUT /api/contacts/[id]] Background image generation completed successfully', { contactId: contact.id })
        })
        .catch((error) => {
          console.error('[PUT /api/contacts/[id]] Background image generation failed:', error)
        })
    } else {
      console.log('[PUT /api/contacts/[id]] Skipping image generation', {
        hasImageUrl: !!imageUrl,
        existingImageUrl: !!existingContact.imageUrl,
        generateImageValue: generateImage,
        generateImageType: typeof generateImage
      })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Failed to update contact:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
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

    // Verify contact belongs to user
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (existingContact.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete contact:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}



