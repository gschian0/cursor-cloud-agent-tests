import { prisma } from '@/lib/db'
import { generateContactImage } from './image-generation'

// Async function to generate and update contact image
export async function generateContactImageAsync(contactId: string, firstName: string, lastName: string, company?: string, position?: string, notes?: string) {
  console.log('[generateContactImageAsync] Starting async image generation', { contactId, firstName, lastName, company, position })
  
  try {
    console.log('[generateContactImageAsync] Calling generateContactImage')
    
    const imageUrl = await generateContactImage(firstName, lastName, company, position, notes)
    
    console.log('[generateContactImageAsync] generateContactImage result', { 
      hasImageUrl: !!imageUrl,
      imageUrlLength: imageUrl?.length || 0
    })

    if (imageUrl) {
      // Update contact with generated image
      console.log('[generateContactImageAsync] Updating contact with imageUrl', { 
        contactId,
        imageUrlLength: imageUrl.length,
        imageUrlPreview: imageUrl.substring(0, 50) + '...'
      })
      
      const updatedContact = await prisma.contact.update({
        where: { id: contactId },
        data: { imageUrl },
      })
      
      // Verify the update worked
      const verifyContact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, imageUrl: true }
      })
      
      console.log('[generateContactImageAsync] Contact updated successfully', { 
        contactId: updatedContact.id,
        hasImageUrl: !!updatedContact.imageUrl,
        imageUrlLength: updatedContact.imageUrl?.length || 0,
        verifiedHasImageUrl: !!verifyContact?.imageUrl,
        verifiedImageUrlLength: verifyContact?.imageUrl?.length || 0
      })
    } else {
      throw new Error('No image URL generated')
    }
  } catch (error) {
    console.error('[generateContactImageAsync] Failed to generate contact image:', error)
    if (error instanceof Error) {
      console.error('[generateContactImageAsync] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    // Fallback to SVG placeholder
    try {
      console.log('[generateContactImageAsync] Attempting SVG placeholder fallback')
      const { generateSVGPlaceholder } = await import('@/lib/image-generation')
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      const imageUrl = generateSVGPlaceholder('contact', initials, '#3b82f6')
      
      console.log('[generateContactImageAsync] SVG placeholder generated, updating contact')
      await prisma.contact.update({
        where: { id: contactId },
        data: { imageUrl },
      })
      
      console.log('[generateContactImageAsync] Contact updated with SVG placeholder')
    } catch (fallbackError) {
      console.error('[generateContactImageAsync] Failed to generate SVG placeholder:', fallbackError)
    }
  }
}

