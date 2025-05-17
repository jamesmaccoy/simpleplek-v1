'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
  postId: string
}

export default function GuestJoinClient({ token, postId }: Props) {
  const router = useRouter()

  useEffect(() => {
    // Automatically redirect to the join page with the token
    router.push(`/join?postId=${postId}&guestToken=${token}`)
  }, [postId, token, router])

  return (
    <div className="container py-12 text-center">
      <p>Redirecting to complete your booking...</p>
    </div>
  )
}