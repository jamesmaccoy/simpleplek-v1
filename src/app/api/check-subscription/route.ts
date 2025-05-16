import { NextRequest, NextResponse } from 'next/server'
import { Purchases } from '@revenuecat/purchases-js'

export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('payload-token')
    if (!authCookie?.value) {
      return NextResponse.json({ hasActiveSubscription: false }, { status: 401 })
    }

    // Get the user ID from the auth token
    
    const token = authCookie.value
    const [header, payload, signature] = token.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())
    const userId = decodedPayload.id

    // Initialize RevenueCat with the Web Billing API key
    const purchases = Purchases.configure(
      process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY,
      userId
    )

    // Get customer info
    const customerInfo = await purchases.getCustomerInfo()
    
    // Extract active entitlement IDs
    const activeEntitlements = Object.keys(customerInfo.entitlements.active || {});
    const hasActiveSubscription = activeEntitlements.length > 0;

    // Set the RevenueCat customer ID in a cookie for cross-device sync
    const response = NextResponse.json({ 
      hasActiveSubscription,
      customerId: customerInfo.originalAppUserId,
      activeEntitlements: activeEntitlements,
    })

    // Set the RevenueCat customer ID cookie
    response.cookies.set('rc-customer-id', customerInfo.originalAppUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error checking subscription:', error)
    return NextResponse.json({ hasActiveSubscription: false }, { status: 500 })
  }
} 