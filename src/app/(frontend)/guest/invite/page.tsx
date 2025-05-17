import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import GuestInviteClient from './page.client'
import { Metadata } from 'next'

interface Props {
  searchParams: Promise<{
    token?: string
    postId?: string
  }>
}

export const metadata: Metadata = {
  title: 'Guest Invite',
  description: 'Accept your guest invite',
}

export default async function GuestInvitePage({ searchParams }: Props) {
  const { token, postId } = await searchParams
  const cookieStore = await cookies()
  const payloadToken = cookieStore.get('payload-token')

  // If no token provided, redirect to home
  if (!token) {
    redirect('/')
  }

  // If user is not logged in, redirect to login with return URL
  if (!payloadToken) {
    const returnUrl = postId 
      ? `/join/guest?token=${token}&postId=${postId}`
      : `/guest/invite?token=${token}`
    redirect(`/login?redirect=${encodeURIComponent(returnUrl)}`)
  }

  return <GuestInviteClient token={token} postId={postId} />
}
