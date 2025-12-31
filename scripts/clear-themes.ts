import { prisma } from '../lib/db'

async function clearThemes() {
  try {
    console.log('Clearing all themes...')
    
    const result = await prisma.theme.deleteMany({})
    
    console.log(`✅ Successfully deleted ${result.count} theme(s)`)
  } catch (error) {
    console.error('❌ Failed to clear themes:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearThemes()

