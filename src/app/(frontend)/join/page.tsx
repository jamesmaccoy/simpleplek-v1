'use client'

import React, { Suspense } from 'react' // Import Suspense
import { useRouter, useSearchParams } from 'next/navigation'
import { useUserContext } from '@/context/UserContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button' // Assuming you have a Button component
import JoinClient from './page.client'

export default function JoinPage() {
  const router = useRouter()
  const { currentUser } = useUserContext()
  const { isSubscribed, isLoading, error } = useSubscription()

  // Only redirect if we're certain about the subscription status
  React.useEffect(() => {
    if (!isLoading && !error) {
      if (!currentUser) {
        router.push('/login')
      } else if (!isSubscribed) {
        router.push('/subscribe')
      }
    }
  }, [currentUser, isSubscribed, isLoading, error, router])

  if (isLoading) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Join</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Join</h1>
        <p className="text-error">Error: {error.message}</p>
      </div>
    )
  }

  // Don't return null here - wait for the useEffect to handle redirects
  if (!currentUser || !isSubscribed) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Join</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <>
      {/* Wrap the part using useSearchParams in Suspense */}
      <Suspense fallback={<JoinClient />}>
        <JoinInner />
      </Suspense>
    </>
  )
} 

// New component to contain logic using useSearchParams
function JoinInner() {
  const searchParams = useSearchParams()
  const bookingTotal = searchParams.get('total') ?? 'N/A'
  const bookingDuration = searchParams.get('duration') ?? 'N/A'

  return (
    <>
      {/* Booking Summary Header */}
      <div className="pt-12 pb-6">
        <div className="bg-muted p-6 rounded-lg border border-border mb-6 text-center">
          <h2 className="text-3xl font-semibold mb-2">R{bookingTotal}</h2>
          <p className="text-lg text-muted-foreground">Total for {bookingDuration} nights</p>
        </div>
      </div>
      {/* The actual premium content */}
      <JoinClient bookingTotal={bookingTotal} bookingDuration={bookingDuration} />
    </>
  )
}

// Simple loading component for the Suspense fallback
function JoinLoading() {
  return (
    <div className="container py-12 text-center">
      <p>Loading booking details...</p>
    </div>
  )
}