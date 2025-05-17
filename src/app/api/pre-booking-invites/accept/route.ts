import { NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.PAYLOAD_SECRET || 'default-secret'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const payloadToken = cookieStore.get('payload-token')

    if (!payloadToken) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { token } = body

    if (!token) {
      return new NextResponse('Token is required', { status: 400 })
    }

    // Verify the token
    const decoded = verify(token, JWT_SECRET) as {
      postId: string
      type: string
      exp: number
    }

    if (decoded.type !== 'pre-booking-invite') {
      return new NextResponse('Invalid token type', { status: 400 })
    }

    // For pre-booking invites, we don't need to store anything in the database yet
    // Just verify the token is valid and return success
    return NextResponse.json({ 
      success: true,
      message: 'Pre-booking invite accepted',
      postId: decoded.postId
    })
  } catch (error) {
    console.error('Error accepting pre-booking invite:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    )
  }
} 