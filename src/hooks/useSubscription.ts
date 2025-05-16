'use client'

import { useEffect, useState } from 'react'
import { useRevenueCat } from '@/providers/RevenueCat'

export type SubscriptionStatus = {
  isSubscribed: boolean
  entitlements: string[]
  expirationDate: Date | null
  isLoading: boolean
  error: Error | null
}

export const useSubscription = (entitlementId?: string): SubscriptionStatus => {
  const { customerInfo, isLoading: isRevenueCatLoading, error: revenueCatError } = useRevenueCat()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    entitlements: [],
    expirationDate: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // First check with RevenueCat client-side
        if (customerInfo) {
          const entitlements = customerInfo.entitlements?.active || {};
          const activeEntitlementKeys = Object.keys(entitlements);

          const isCurrentlySubscribed = entitlementId
            ? activeEntitlementKeys.includes(entitlementId)
            : activeEntitlementKeys.length > 0;

          if (isCurrentlySubscribed) {
            setSubscriptionStatus({
              isSubscribed: true,
              entitlements: activeEntitlementKeys,
              expirationDate: entitlementId && entitlements[entitlementId]?.expirationDate
                ? new Date(entitlements[entitlementId].expirationDate)
                : activeEntitlementKeys.length > 0 && entitlements[activeEntitlementKeys[0]]?.expirationDate
                  ? new Date(entitlements[activeEntitlementKeys[0]].expirationDate)
                  : null,
              isLoading: false,
              error: null,
            });
            return;
          }
        }

        // If not subscribed client-side, check with the API
        const response = await fetch('/api/check-subscription', {
          credentials: 'include',
        })

        // DETAILED LOGGING START
        console.log('useSubscription - API Response Status:', response.status);
        console.log('useSubscription - API Response OK:', response.ok);
        
        if (!response.ok) {
            try {
                const errorText = await response.text();
                console.error('useSubscription - API Error Response Text:', errorText);
            } catch (e) {
                console.error('useSubscription - Could not get error text from response', e);
            }
            throw new Error('Failed to check subscription status');
        }

        const { hasActiveSubscription, activeEntitlements, customerId } = await response.json()

        setSubscriptionStatus({
          isSubscribed: hasActiveSubscription,
          entitlements: activeEntitlements || [],
          expirationDate: null,
          isLoading: false,
          error: null,
        });

      } catch (err) {
        console.error('useSubscription - Error in checkSubscription:', err);
        setSubscriptionStatus({
          isSubscribed: false,
          entitlements: [],
          expirationDate: null,
          isLoading: false,
          error: err instanceof Error ? err : new Error('Unknown error checking subscription'),
        });
      }
    };

    // Always check subscription when the component mounts or when dependencies change
    checkSubscription();
  }, [customerInfo, entitlementId]);

  return subscriptionStatus;
} 