// app/(frontend)/join/page.client.tsx
"use client"

import { useState, useEffect } from "react"
import type { User } from "@/payload-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRevenueCat } from "@/providers/RevenueCat"
import { Purchases, type Package, type PurchasesError, ErrorCode, type Product } from "@revenuecat/purchases-js"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from 'lucide-react'
import { Switch } from "@/components/ui/switch"

// Add type for RevenueCat error with code
interface RevenueCatError extends Error {
  code?: ErrorCode;
}

// Extend Product type to include price
interface RevenueCatProduct extends Product {
  price?: number;
  priceString?: string;
  currencyCode?: string;
}

export default function JoinClient({ bookingTotal = 'N/A', bookingDuration = 'N/A' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isInitialized } = useRevenueCat()
  
  const [guests, setGuests] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Payment states
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [offerings, setOfferings] = useState<Package[]>([])
  const [loadingOfferings, setLoadingOfferings] = useState(true)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  
  // Get postId from URL if available
  const postId = searchParams?.get('postId') || ''

  // Calculate total price
  const totalPrice = 
    !isNaN(Number(bookingTotal)) && !isNaN(Number(bookingDuration))
      ? Number(bookingTotal) * Number(bookingDuration)
      : null

  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(1)
  const [isWineSelected, setIsWineSelected] = useState(false)
  const [packagePrice, setPackagePrice] = useState<number | null>(null)

  // Define package tiers with their thresholds and multipliers
  const packageTiers = [
    {
      id: "per_night",
      title: "Per Night",
      description: "Standard nightly rate",
      minNights: 1,
      maxNights: 1,
      multiplier: 1.0,
      features: [
        "Standard accommodation",
        "Basic amenities",
        "Self-service"
      ]
    },
    {
      id: "three_nights",
      title: "3 Night Package",
      description: "Special rate for 3+ nights",
      minNights: 2,
      maxNights: 3,
      multiplier: 0.9,
      features: [
        "Standard accommodation",
        "Basic amenities",
        "Self-service",
        "10% discount on total"
      ]
    },
    {
      id: "Weekly",
      title: "Weekly Package",
      description: "Best value for week-long stays",
      minNights: 4,
      maxNights: 7,
      multiplier: 0.8,
      features: [
        "Standard accommodation",
        "Basic amenities",
        "Self-service",
        "20% discount on total"
      ]
    },
    {
      id: "2Xweekly",
      title: "2X Weekly Package",
      description: "Extended stay special rate",
      minNights: 8,
      maxNights: 13,
      multiplier: 0.7,
      features: [
        "Standard accommodation",
        "Basic amenities",
        "Self-service",
        "30% discount on total",
        "Extended stay benefits"
      ]
    },
    {
      id: "weekX3",
      title: "3 Week Package",
      description: "Long-term stay special rate",
      minNights: 14,
      maxNights: 28,
      multiplier: 0.5,
      features: [
        "Standard accommodation",
        "Basic amenities",
        "Self-service",
        "50% discount on total",
        "Extended stay benefits",
        "Priority booking for future stays"
      ]
    },
    {
      id: "monthly",
      title: "Monthly Package",
      description: "Extended stay rate",
      minNights: 29,
      maxNights: 365,
      multiplier: 0.7,
      features: [
        "Standard accommodation",
        "Basic amenities",
        "Self-service",
        "30% discount on total"
      ]
    }
  ]

  // Create packageDetails from packageTiers
  const packageDetails = {
    per_night: {
      ...packageTiers[0],
      revenueCatId: "per_night"
    },
    per_night_luxury: {
      ...packageTiers[0],
      title: "Luxury Night",
      description: "Premium nightly rate",
      multiplier: 1.5,
      features: [
        "Premium accommodation",
        "Enhanced amenities",
        "Priority service"
      ],
      revenueCatId: "per_night_luxury"
    },
    three_nights: {
      ...packageTiers[1],
      revenueCatId: "3nights"
    },
    hosted3nights: {
      ...packageTiers[1],
      title: "Hosted 3 Nights",
      description: "Premium 3-night experience",
      multiplier: 1.4,
      features: [
        "Premium accommodation",
        "Dedicated host",
        "Enhanced amenities",
        "Priority service"
      ],
      revenueCatId: "hosted3nights"
    },
    Weekly: {
      ...packageTiers[2],
      revenueCatId: "Weekly"
    },
    hosted7nights: {
      ...packageTiers[2],
      title: "Hosted Weekly",
      description: "Premium week-long experience",
      multiplier: 1.3,
      features: [
        "Premium accommodation",
        "Dedicated host",
        "Enhanced amenities",
        "Priority service",
        "15% discount on total"
      ],
      revenueCatId: "hosted7nights"
    },
    "2Xweekly": {
      ...packageTiers[3],
      revenueCatId: "2Xweekly"
    },
    weekX3: {
      ...packageTiers[4],
      revenueCatId: "weekX3"
    },
    monthly: {
      ...packageTiers[5],
      revenueCatId: "monthly"
    },
    wine: {
      title: "Wine Package",
      description: "Includes wine tasting and selection platters",
      multiplier: 1.5,
      minNights: 1,
      maxNights: 365,
      features: [
        "Standard accommodation",
        "Wine tasting experience",
        "Curated wine selection",
        "Sommelier consultation"
      ],
      revenueCatId: "Bottle_wine"
    }
  }

  // Determine package based on duration and wine selection
  useEffect(() => {
    if (!bookingDuration) return

    const duration = Number(bookingDuration)
    let packageId = "per_night"

    console.log("Selecting package for duration:", duration)

    // If wine package is selected, use the corresponding luxury package
    if (isWineSelected) {
      if (duration >= 29) {
        packageId = "monthly"
      } else if (duration >= 14) {
        packageId = "hosted7nights"
      } else if (duration >= 3) {
        packageId = "hosted3nights"
      } else {
        packageId = "per_night_luxury"
      }
    } else {
      // Find the appropriate package tier based on duration
      const selectedTier = packageTiers.find(tier => 
        duration >= tier.minNights && duration <= tier.maxNights
      )
      
      if (selectedTier) {
        packageId = selectedTier.id
        console.log("Selected tier:", selectedTier)
      } else {
        // Fallback to per night if no tier matches
        packageId = "per_night"
        console.log("No tier matched, defaulting to per_night")
      }
    }

    console.log("Selected package ID:", packageId)
    setSelectedPackage(packageId)
    setSelectedDuration(duration)
  }, [bookingDuration, isWineSelected])

  // Load RevenueCat offerings when initialized
  useEffect(() => {
    if (isInitialized) {
      loadOfferings()
    }
  }, [isInitialized])

  const loadOfferings = async () => {
    setLoadingOfferings(true)
    try {
      const fetchedOfferings = await Purchases.getSharedInstance().getOfferings()
      console.log("All Offerings:", fetchedOfferings.all)
      
      // Get the per_night offering specifically
      const perNightOffering = fetchedOfferings.all["per_night"]
      
      if (perNightOffering && perNightOffering.availablePackages.length > 0) {
        console.log("Per Night packages:", perNightOffering.availablePackages.map(pkg => ({
          identifier: pkg.webBillingProduct?.identifier,
          product: pkg.webBillingProduct,
          priceString: pkg.webBillingProduct?.priceString,
          price: pkg.webBillingProduct?.price
        })))
        setOfferings(perNightOffering.availablePackages)
      } else {
        console.warn("No packages found in per_night offering")
        setOfferings([])
      }
    } catch (err) {
      setPaymentError("Failed to load booking options")
      console.error("Error loading offerings:", err)
    } finally {
      setLoadingOfferings(false)
    }
  }

  // Update package price when package or duration changes
  useEffect(() => {
    if (!selectedPackage || !offerings.length) return

    const selectedPackageDetails = packageDetails[selectedPackage]
    if (!selectedPackageDetails) return

    const packageToUse = offerings.find(pkg => 
      pkg.webBillingProduct?.identifier === selectedPackageDetails.revenueCatId
    )

    console.log("Selected package details:", {
      packageId: selectedPackage,
      revenueCatId: selectedPackageDetails.revenueCatId,
      foundPackage: packageToUse?.webBillingProduct?.identifier,
      priceString: packageToUse?.webBillingProduct?.priceString,
      price: packageToUse?.webBillingProduct?.price,
      bookingTotal
    })

    if (packageToUse?.webBillingProduct) {
      const product = packageToUse.webBillingProduct as RevenueCatProduct
      if (product.price) {
        const basePrice = Number(product.price)
        const multiplier = selectedPackageDetails.multiplier
        const calculatedPrice = basePrice * multiplier
        console.log("Using RevenueCat price:", {
          basePrice,
          multiplier,
          calculatedPrice
        })
        setPackagePrice(calculatedPrice)
      } else {
        // Fallback to local calculation if RevenueCat price is not available
        const basePrice = Number(bookingTotal)
        const multiplier = selectedPackageDetails.multiplier
        const calculatedPrice = basePrice * multiplier
        console.log("Using local price calculation:", {
          basePrice,
          multiplier,
          calculatedPrice
        })
        setPackagePrice(calculatedPrice)
      }
    } else {
      // Fallback to local calculation if package is not found
      const basePrice = Number(bookingTotal)
      const multiplier = selectedPackageDetails.multiplier
      const calculatedPrice = basePrice * multiplier
      console.log("Using fallback price calculation:", {
        basePrice,
        multiplier,
        calculatedPrice
      })
      setPackagePrice(calculatedPrice)
    }
  }, [selectedPackage, offerings, bookingTotal])

  const calculateTotalPrice = () => {
    if (!packagePrice || !selectedDuration) return null
    const total = packagePrice * selectedDuration
    console.log("Calculating total price:", {
      packagePrice,
      selectedDuration,
      total
    })
    return total
  }

  // Format price with proper decimal places
  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A"
    return `R${price.toFixed(2)}`
  }

  useEffect(() => {
    // Fetch guests
    const fetchGuests = async () => {
      try {
        const response = await fetch('/api/guests')
        if (!response.ok) {
          throw new Error('Failed to fetch guests')
        }
        const data = await response.json()
        setGuests(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGuests()
  }, [])

  const handleBooking = async () => {
    setPaymentLoading(true)
    setPaymentError(null)
    
    try {
      // Find the appropriate package based on RevenueCat configuration
      const selectedPackageDetails = selectedPackage ? packageDetails[selectedPackage] : null
      if (!selectedPackageDetails) {
        throw new Error("No package selected")
      }

      const bookingPackage = offerings.find(pkg => {
        const identifier = pkg.webBillingProduct?.identifier
        console.log("Checking package:", identifier, "against", selectedPackageDetails.revenueCatId)
        return identifier === selectedPackageDetails.revenueCatId
      })
      
      if (!bookingPackage) {
        console.error("Available packages:", offerings.map(pkg => ({
          identifier: pkg.webBillingProduct?.identifier,
          product: pkg.webBillingProduct
        })))
        throw new Error(`Booking package not found for ${selectedPackageDetails.revenueCatId}. Please contact support.`)
      }

      // Log which package was found
      console.log("Selected package:", {
        identifier: bookingPackage.webBillingProduct?.identifier,
        product: bookingPackage.webBillingProduct,
        duration: selectedDuration
      })
      
      // Process the purchase with better error handling
      try {
        const purchaseResult = await Purchases.getSharedInstance().purchase({
          rcPackage: bookingPackage,
        })
        
        console.log("Purchase successful:", purchaseResult)
        
        // Calculate dates for the booking
        const fromDate = new Date()
        const toDate = new Date()
        toDate.setDate(toDate.getDate() + selectedDuration)
        
        // After successful purchase, save booking to your backend
        const bookingData = {
          postId: postId,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
          duration: selectedDuration,
          packageType: selectedPackage,
          revenueCatPackageId: selectedPackageDetails.revenueCatId,
          totalAmount: calculateTotalPrice(),
        }
        
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save booking')
        }
        
        // Set success state
        setPaymentSuccess(true)
        
        // Redirect to confirmation page after a short delay
        setTimeout(() => {
          router.push(`/booking-confirmation?total=${calculateTotalPrice()}&duration=${selectedDuration}`)
        }, 1500)
        
      } catch (purchaseError) {
        console.error("Purchase error details:", purchaseError)
        
        // Handle specific RevenueCat error codes
        if (purchaseError instanceof Error) {
          const rcError = purchaseError as RevenueCatError
          
          if (rcError.code === ErrorCode.UserCancelledError) {
            console.log("User cancelled the purchase")
            setPaymentError("Purchase was cancelled. Please try again if you'd like to complete your booking.")
            return
          }
          
          if (rcError.code === ErrorCode.PurchaseInvalidError) {
            console.log("Invalid purchase")
            setPaymentError("There was an issue with the purchase. Please try again or contact support.")
            return
          }
          
          if (rcError.code === ErrorCode.NetworkError) {
            console.log("Network error during purchase")
            setPaymentError("Network error occurred. Please check your connection and try again.")
            return
          }
        }
        
        // Generic error handling
        setPaymentError("Failed to complete purchase. Please try again or contact support.")
        console.error("Purchase error:", purchaseError)
      }
      
    } catch (error) {
      console.error("Booking error:", error)
      setPaymentError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleShare = () => {
    const urlToShare = window.location.href
    navigator.clipboard
      .writeText(urlToShare)
      .then(() => {
        console.log("Booking URL copied to clipboard:", urlToShare)
      })
      .catch((err) => {
        console.error("Failed to copy URL: ", err)
      })
  }

  if (loading || loadingOfferings) {
    return (
      <div className="container py-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-8">Start your curated stay</h1>
        <p>Loading booking details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-8">Start your curated stay</h1>
        <p className="text-error">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold tracking-tighter mb-8">Start your curated stay</h1>

      {/* Payment Success Message */}
      {paymentSuccess && (
        <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-md">
          <h3 className="text-green-800 font-semibold">Booking Successful!</h3>
          <p className="text-green-700">
            Your booking has been confirmed. Redirecting to confirmation page...
          </p>
        </div>
      )}

      {/* Payment Error Message */}
      {paymentError && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-md">
          <h3 className="text-red-800 font-semibold">Booking Error</h3>
          <p className="text-red-700">
            {paymentError}
          </p>
        </div>
      )}

      {/* Package Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Selected Package</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Package */}
          <div className="p-6 rounded-lg border-2 border-primary bg-primary/5">
            <h3 className="text-xl font-semibold mb-2">
              {selectedPackage ? packageDetails[selectedPackage]?.title : "Loading..."}
            </h3>
            <p className="text-muted-foreground mb-4">
              {selectedPackage ? packageDetails[selectedPackage]?.description : ""}
            </p>
            <ul className="mb-4 space-y-2">
              {selectedPackage && packageDetails[selectedPackage]?.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="mr-2">•</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">
                {formatPrice(packagePrice)}/night
              </span>
            </div>
          </div>

          {/* Wine Package Add-on */}
          <div className="p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{packageDetails.wine.title}</h3>
                <p className="text-muted-foreground">{packageDetails.wine.description}</p>
              </div>
              <Switch
                id="wine-package"
                checked={isWineSelected}
                onCheckedChange={setIsWineSelected}
              />
            </div>
            <ul className="mb-4 space-y-2">
              {packageDetails.wine.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="mr-2">•</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="mb-8 bg-muted p-6 rounded-lg border border-border">
        <h2 className="text-2xl font-semibold mb-4">Booking Summary</h2>
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Package:</span>
          <span className="font-medium">
            {selectedPackage ? packageDetails[selectedPackage]?.title : "Not selected"}
          </span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Rate per night:</span>
          <span className="font-medium">
            {formatPrice(packagePrice)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Duration:</span>
          <span className="font-medium">{selectedDuration} nights</span>
        </div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-muted-foreground">Total:</span>
          <span className="text-2xl font-bold">
            {formatPrice(calculateTotalPrice())}
          </span>
        </div>

        {/* Complete Booking Button */}
        <Button
          onClick={handleBooking}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={paymentLoading || paymentSuccess || !postId || !selectedPackage}
        >
          {paymentLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : paymentSuccess ? (
            "Booking Confirmed!"
          ) : !postId ? (
            "Missing Property Information"
          ) : !selectedPackage ? (
            "Please Select a Package"
          ) : (
            `Complete Booking - ${formatPrice(calculateTotalPrice())}`
          )}
        </Button>
        
        {!postId && (
          <p className="text-red-500 text-sm mt-2">
            Property information is missing. Please start from the property page.
          </p>
        )}
        {!selectedPackage && (
          <p className="text-red-500 text-sm mt-2">
            Please select a package to continue.
          </p>
        )}
      </div>

      {/* Share Booking Section */}
      <div className="mb-8 flex items-center gap-3 bg-muted p-4 rounded-lg border border-border">
        <Input
          type="text"
          value={typeof window !== 'undefined' ? window.location.href : ''}
          readOnly
          className="flex-grow bg-background cursor-default"
        />
        <Button variant="secondary" onClick={handleShare}>Share Booking</Button>
      </div>

      {/* Guests Section */}
      <h2 className="text-2xl font-semibold mt-8 mb-4">Available Guests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guests.map((guest) => (
          <div key={guest.id} className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <h3 className="text-xl font-semibold mb-3">{guest.name}</h3>
            <p className="text-muted-foreground mb-2">Email: {guest.email}</p>
            <p className="text-muted-foreground">Role: {guest.role?.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}