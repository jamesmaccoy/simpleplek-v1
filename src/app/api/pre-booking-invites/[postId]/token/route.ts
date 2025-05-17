import { NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.PAYLOAD_SECRET || 'default-secret'

export async function POST(
  req: Request,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const payloadToken = cookieStore.get('payload-token')

    if (!payloadToken) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { postId } = await context.params

    if (!postId) {
      return new NextResponse('Post ID is required', { status: 400 })
    }

    // Generate a token that includes the post ID and expiration
    const token = sign(
      {
        postId,
        type: 'pre-booking-invite',
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days expiration
      },
      JWT_SECRET
    )

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error generating pre-booking invite token:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 