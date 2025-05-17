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

// Define package tiers with their thresholds and multipliers
const packageTiers = [
  {
    minNights: 1,
    maxNights: 1,
    multiplier: 1.0,
    label: "Standard rate"
  },
  {
    minNights: 2,
    maxNights: 3,
    multiplier: 0.9,
    label: "3+ nights (10% off)"
  },
  {
    minNights: 4,
    maxNights: 7,
    multiplier: 0.8,
    label: "Weekly (20% off)"
  },
  {
    minNights: 8,
    maxNights: 13,
    multiplier: 0.7,
    label: "2 weeks (30% off)"
  },
  {
    minNights: 14,
    maxNights: 28,
    multiplier: 0.5,
    label: "3 weeks (50% off)"
  },
  {
    minNights: 29,
    maxNights: 365,
    multiplier: 0.7,
    label: "Monthly (30% off)"
  }
]

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

  const getDiscountTier = (duration: number) => {
    return packageTiers.find(tier => 
      duration >= tier.minNights && duration <= tier.maxNights
    ) || packageTiers[0] // Default to standard rate if no tier matches
  }

  const calculateDiscountedRate = () => {
    const duration = calculateDuration()
    const tier = getDiscountTier(duration)
    return defaultRate * tier.multiplier
  }

  const calculateTotalPrice = () => {
    const duration = calculateDuration()
    return calculateDiscountedRate() * duration
  }

  const handleRequest = () => {
    const duration = calculateDuration().toString()
    const discountedRate = calculateDiscountedRate()
    router.push(`/join?baseRate=${defaultRate}&total=${discountedRate}&duration=${duration}&postId=${id || ''}`)
  }

  const currentTier = getDiscountTier(calculateDuration())

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
              <div>
                <span className="text-gray-600">Rate per night</span>
                <p className="text-sm text-muted-foreground">{currentTier.label}</p>
              </div>
              <div className="text-right">
                <span className="font-semibold">R{calculateDiscountedRate().toFixed(2)}</span>
                {currentTier.multiplier < 1 && (
                  <p className="text-sm text-muted-foreground line-through">R{defaultRate.toFixed(2)}</p>
                )}
              </div>
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