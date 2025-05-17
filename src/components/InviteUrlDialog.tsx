"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Copy } from "lucide-react"

interface InviteUrlDialogProps {
  bookingId: string
  trigger: React.ReactNode
}

export function InviteUrlDialog({ bookingId, trigger }: InviteUrlDialogProps) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = `${window.location.origin}/join?invite=${bookingId}`

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
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Guests</DialogTitle>
          <DialogDescription>
            Share this link with guests you want to invite to your booking.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            readOnly
            value={inviteUrl}
            className="w-full"
          />
          <Button
            size="icon"
            onClick={copyToClipboard}
            className="shrink-0"
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            <span className="sr-only">Copy invite URL</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 