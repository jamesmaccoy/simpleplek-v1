'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { CopyIcon, CheckIcon } from 'lucide-react'

interface Props {
  bookingId: string
  trigger: React.ReactNode
  isPreBooking?: boolean
}

export default function InviteUrlDialog({ bookingId, trigger, isPreBooking = false }: Props) {
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchToken = async () => {
    try {
      setError(null)
      setIsLoading(true)

      let url: string
      if (isPreBooking) {
        // For pre-booking invites, use a different endpoint
        url = `/api/pre-booking-invites/${bookingId}/token`
      } else {
        // For confirmed bookings
        url = `/api/bookings/${bookingId}/token`
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        throw new Error('Failed to generate invite link')
      }

      const data = await res.json()
      const baseUrl = window.location.origin
      
      if (isPreBooking) {
        setInviteUrl(`${baseUrl}/join/guest?token=${data.token}&postId=${bookingId}`)
      } else {
        setInviteUrl(`${baseUrl}/guest/invite?token=${data.token}`)
      }
    } catch (err) {
      console.error('Error fetching token:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate invite link')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (bookingId) {
      fetchToken()
    }
  }, [bookingId])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Guest</DialogTitle>
          <DialogDescription>
            {isPreBooking 
              ? 'Share this link to invite guests. They will be notified once the booking is complete.'
              : 'Share this link with your guest to join the booking.'}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : isLoading ? (
          <div className="text-sm">Generating invite link...</div>
        ) : (
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={inviteUrl}
              className="w-full font-mono text-sm"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-green-500" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Copy invite URL</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
