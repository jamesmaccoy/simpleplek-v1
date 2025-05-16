"use client"

import { useState } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { useRouter } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface StayDurationProps {
  blockType: 'stayDuration'
  defaultRate?: number
  buttonLabel?: string
  id?: string
}

export const StayDurationComponent: React.FC<StayDurationProps> = ({ 
  defaultRate = 150,
  buttonLabel = "Request Availability",
  id
}) => {
  const router = useRouter()
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const handleRequest = () => {
    // Calculate duration from selected dates
    let duration = '5' // Default duration
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays > 0) {
        duration = diffDays.toString()
      }
    }

    // Navigate to join page with parameters
    router.push(`/join?total=${defaultRate}&duration=${duration}&postId=${id || ''}`)
  }

  return (
    <div className="container mt-8 flex flex-col items-center space-y-4">
      <div className="flex flex-col space-y-2 w-full max-w-md">
        <label className="text-gray-700 font-medium">Stay Length</label>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={(date) => setStartDate(date || null)}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>

          <span className="text-gray-500 self-center">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={(date) => setEndDate(date || null)}
                initialFocus
                disabled={(date) => !startDate || date < startDate}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Button 
        className="primary-btn bg-black text-white"
        onClick={handleRequest}
      >
        {buttonLabel}
      </Button>
    </div>
  )
} 