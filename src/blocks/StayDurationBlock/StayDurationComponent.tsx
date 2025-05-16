"use client"

import { useState } from "react"
import { format, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
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
  const today = new Date()
  const [startDate, setStartDate] = useState<Date | null>(today)
  const [endDate, setEndDate] = useState<Date | null>(addDays(today, 5))

  const calculateDuration = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 5
    }
    return 5 // Default duration
  }

  const calculateTotalPrice = () => {
    const duration = calculateDuration()
    return defaultRate * duration
  }

  const handleRequest = () => {
    const duration = calculateDuration().toString()
    router.push(`/join?total=${defaultRate}&duration=${duration}&postId=${id || ''}`)
  }

  return (
    <div className="container mt-8 flex justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Book Your Stay</CardTitle>
          <CardDescription>Select your dates and review pricing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
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

          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rate per night</span>
              <span className="font-semibold">R{defaultRate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Number of nights</span>
              <span className="font-semibold">{calculateDuration()} nights</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Price</span>
                <span className="text-lg font-bold">R{calculateTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full bg-black text-white"
            onClick={handleRequest}
          >
            {buttonLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 