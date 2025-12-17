import { prisma } from '@/lib/db'

/**
 * Gets or creates a test user for development/testing
 * This bypasses authentication for testing purposes
 */
export async function getTestUserId(): Promise<string> {
  const testEmail = 'test@example.com'
  
  let user = await prisma.user.findUnique({
    where: { email: testEmail },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    })
  }

  return user.id
}

