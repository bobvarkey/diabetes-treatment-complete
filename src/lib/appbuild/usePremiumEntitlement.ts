import { useState, useEffect } from 'react';
import { getCustomerInfo } from './revenuecat';

export function usePremiumEntitlement() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const info = await getCustomerInfo();
        if (info?.customerInfo?.entitlements?.active?.premium) {
          setIsPremium(true);
        } else {
          setIsPremium(false);
        }
      } catch (e) {
        console.error('Failed to fetch entitlements', e);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    }
    check();
  }, []);

  return { isPremium, isLoading };
}
