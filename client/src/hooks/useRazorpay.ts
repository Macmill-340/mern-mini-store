import { useCallback, useRef, useState } from 'react';
import type { RazorpayCheckoutResponse } from '../types';
import type { RazorpayInstance, RazorpayOptions } from '../types/razorpay';

let scriptPromise: Promise<boolean> | null = null;

function loadScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const instanceRef = useRef<RazorpayInstance | null>(null);

  const openCheckout = useCallback(
    async (options: Omit<RazorpayOptions, 'handler' | 'modal'> & { onDismiss?: () => void }) =>
      new Promise<RazorpayCheckoutResponse>((resolve, reject) => {
        setLoading(true);
        loadScript()
          .then((ok) => {
            if (!ok || !window.Razorpay) {
              reject(new Error('Failed to load Razorpay'));
              return;
            }
            const { onDismiss, ...checkoutOptions } = options;
            const instance = new window.Razorpay({
              ...checkoutOptions,
              handler: (response) => {
                setLoading(false);
                resolve(response);
              },
              modal: { ondismiss: () => { setLoading(false); onDismiss?.(); reject(new Error('Payment cancelled')); } },
            });
            instanceRef.current = instance;
            instance.open();
          })
          .catch((err) => {
            setLoading(false);
            reject(err);
          });
      }),
    [],
  );

  return { openCheckout, loading };
}
