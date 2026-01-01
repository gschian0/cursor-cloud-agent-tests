import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'
import { generateContactImageAsync } from '@/lib/generate-contact-image'
import { validateTextInput, validateImageUrl } from '@/lib/input-validator'

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

    // Validate text inputs
    const firstNameValidation = validateTextInput(firstName, 100, "First name")
    if (!firstNameValidation.valid) {
      return NextResponse.json({ error: firstNameValidation.error }, { status: 400 })
    }

    const lastNameValidation = validateTextInput(lastName, 100, "Last name")
    if (!lastNameValidation.valid) {
      return NextResponse.json({ error: lastNameValidation.error }, { status: 400 })
    }

    const emailValidation = validateTextInput(email, 255, "Email")
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 })
    }

    if (phone) {
      const phoneValidation = validateTextInput(phone, 50, "Phone")
      if (!phoneValidation.valid) {
        return NextResponse.json({ error: phoneValidation.error }, { status: 400 })
      }
    }

    if (company) {
      const companyValidation = validateTextInput(company, 200, "Company")
      if (!companyValidation.valid) {
        return NextResponse.json({ error: companyValidation.error }, { status: 400 })
      }
    }

    if (position) {
      const positionValidation = validateTextInput(position, 200, "Position")
      if (!positionValidation.valid) {
        return NextResponse.json({ error: positionValidation.error }, { status: 400 })
      }
    }

    if (notes) {
      const notesValidation = validateTextInput(notes, 2000, "Notes")
      if (!notesValidation.valid) {
        return NextResponse.json({ error: notesValidation.error }, { status: 400 })
      }
    }

    if (imageUrl) {
      const urlValidation = validateImageUrl(imageUrl)
      if (!urlValidation.valid) {
        return NextResponse.json({ error: urlValidation.error || "Invalid image URL" }, { status: 400 })
      }
    }

    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        if (typeof tag === 'string') {
          const tagValidation = validateTextInput(tag, 50, "Tag")
          if (!tagValidation.valid) {
            return NextResponse.json({ error: `Invalid tag: ${tagValidation.error}` }, { status: 400 })
          }
        }
      }
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



