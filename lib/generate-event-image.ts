import { prisma } from '@/lib/db'
import { generateGeminiImage } from './generate-gemini-image'

// Async function to generate and update event image
// Uses the same shared function that the working Image tab uses
// Export it so it can be used by other routes
export async function generateEventImageAsync(eventId: string, title: string, description: string, color: string, startTime?: string | Date) {
  console.log('[generateEventImageAsync] Starting async image generation', { eventId, title, description, color, startTime })
  
  try {
    // Format the event date for the prompt
    let dateContext = ''
    if (startTime) {
      const eventDate = new Date(startTime)
      const dateStr = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      const timeStr = eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
      dateContext = ` The event is scheduled for ${dateStr} at ${timeStr}.`
    }
    
    // Use the same shared function that the working Image tab uses
    // Customizable prompt - includes event date and context
    const prompt = `Generate an image for a calendar event titled "${title}"${description ? ` with description: "${description}"` : ''}.${dateContext} The event color theme is ${color}. Create a visually appealing, abstract or symbolic representation suitable for a calendar event that reflects the event's date and context.`
    
    console.log('[generateEventImageAsync] Calling generateGeminiImage with prompt', { promptLength: prompt.length })
    
    const result = await generateGeminiImage(prompt)
    
    console.log('[generateEventImageAsync] generateGeminiImage result', { 
      hasResult: !!result,
      hasImageUrl: !!result?.imageUrl,
      imageUrlLength: result?.imageUrl?.length || 0
    })

    if (result && result.imageUrl) {
      // Update event with generated image
      console.log('[generateEventImageAsync] Updating event with imageUrl', { 
        eventId,
        imageUrlLength: result.imageUrl.length,
        imageUrlPreview: result.imageUrl.substring(0, 50) + '...'
      })
      
      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { imageUrl: result.imageUrl },
      })
      
      // Verify the update worked
      const verifyEvent = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, imageUrl: true }
      })
      
      console.log('[generateEventImageAsync] Event updated successfully', { 
        eventId: updatedEvent.id,
        hasImageUrl: !!updatedEvent.imageUrl,
        imageUrlLength: updatedEvent.imageUrl?.length || 0,
        verifiedHasImageUrl: !!verifyEvent?.imageUrl,
        verifiedImageUrlLength: verifyEvent?.imageUrl?.length || 0
      })
    } else {
      throw new Error('No image URL in result')
    }
  } catch (error) {
    console.error('[generateEventImageAsync] Failed to generate event image:', error)
    if (error instanceof Error) {
      console.error('[generateEventImageAsync] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    // Fallback to SVG placeholder
    try {
      console.log('[generateEventImageAsync] Attempting SVG placeholder fallback')
      const { generateSVGPlaceholder } = await import('@/lib/image-generation')
      const imageUrl = generateSVGPlaceholder('event', `${title}${description ? ` - ${description}` : ''}`, color)
      
      console.log('[generateEventImageAsync] SVG placeholder generated, updating event')
      await prisma.event.update({
        where: { id: eventId },
        data: { imageUrl },
      })
      
      console.log('[generateEventImageAsync] Event updated with SVG placeholder')
    } catch (fallbackError) {
      console.error('[generateEventImageAsync] Failed to generate SVG placeholder:', fallbackError)
    }
  }
}

