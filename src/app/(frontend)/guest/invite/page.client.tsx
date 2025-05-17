'use client'

import { Button } from '@/components/ui/button'
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Card,
} from '@/components/ui/card'
import { Booking } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

import { CheckIcon, CircleAlert, Loader2Icon, AlertCircle, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import React, { useState } from 'react'

type Props = {
  token: string
}

export default function InviteClientPage({ token }: Props) {
  if (
    typeof booking.post === 'string' ||
    typeof booking.customer === 'string' ||
    !('bookingId' in tokenPayload)
  ) {
    notFound()
  }

  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAcceptInvite = async () => {
    setIsAccepting(true)
    setError(null)

    try {
      const response = await fetch('/api/guest/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to accept invite')
      }

      setSuccess(true)
      
      // Redirect to bookings page after a short delay
      setTimeout(() => {
        router.push('/bookings')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsAccepting(false)
    }
  }

  if (error) {
    return (
      <div className="container flex min-h-[80vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Error</CardTitle>
            <CardDescription className="text-base">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container flex min-h-[80vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Invite Accepted!</CardTitle>
            <CardDescription className="text-base">
              You have successfully accepted the booking invite. Redirecting to your bookings...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Accept Booking Invite</CardTitle>
          <CardDescription className="text-base">
            You've been invited to join a booking. Click below to accept the invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button
            className="w-full"
            onClick={handleAcceptInvite}
            disabled={isAccepting}
          >
            {isAccepting ? 'Accepting...' : 'Accept Invite'}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-2">
          <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
