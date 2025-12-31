import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTestUserId } from '@/lib/test-user'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id || await getTestUserId()
    
    return NextResponse.json({ userId })
  } catch (error) {
    console.error('Failed to get user ID:', error)
    return NextResponse.json({ error: 'Failed to get user ID' }, { status: 500 })
  }
}

