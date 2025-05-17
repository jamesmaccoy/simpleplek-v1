import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verify } from 'jsonwebtoken'
import GuestJoinClient from './page.client'

const JWT_SECRET = process.env.PAYLOAD_SECRET || 'default-secret'

interface Props {
  searchParams: Promise<{
    token?: string
    postId?: string
  }>
}

export default async function GuestJoinPage({ searchParams }: Props) {
  const { token, postId } = await searchParams
  const cookieStore = await cookies()
  const payloadToken = cookieStore.get('payload-token')

  // If no token or postId provided, redirect to home
  if (!token || !postId) {
    redirect('/')
  }

  // If user is not logged in, redirect to login with return URL
  if (!payloadToken) {
    const returnUrl = `/join/guest?token=${token}&postId=${postId}`
    redirect(`/login?redirect=${encodeURIComponent(returnUrl)}`)
  }

  try {
    // Verify the token
    const decoded = verify(token, JWT_SECRET) as {
      postId: string
      type: string
      exp: number
    }

    if (decoded.type !== 'pre-booking-invite' || decoded.postId !== postId) {
      redirect('/')
    }
  } catch (error) {
    redirect('/')
  }

  return <GuestJoinClient token={token} postId={postId} />
} 