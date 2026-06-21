import { useState, useCallback } from 'react';
import { useStripe, usePaymentSheet as useStripePaymentSheet } from '@stripe/stripe-react-native';
import { PinbookPaymentsApi } from '../services/ApiService';
import { useAuth } from './useAuth';

export interface PaymentSheetOptions {
  amountCents: number;
  currency?: string;
  description?: string;
  onSuccess?: (intent: any) => Promise<void> | void;
  onError?: (error: any) => void;
}

/**
 * Hook to handle Stripe PaymentSheet for booking deposits and other one-time payments.
 * Abstracts PaymentIntent creation and PaymentSheet presentation.
 */
export function usePaymentSheet() {
  const { token } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripePaymentSheet();
  const { retrievePaymentIntent } = useStripe();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializePaymentSheet = useCallback(async (options: PaymentSheetOptions) => {
    try {
      setLoading(true);
      setError(null);

      // Create PaymentIntent on backend
      const intent = await PinbookPaymentsApi.createPaymentIntent({
        amountCents: options.amountCents,
        currency: options.currency || 'cad',
        description: options.description || 'PinkBook Booking Deposit',
        metadata: { source: 'native_app' },
      });

      // Initialize PaymentSheet with the client secret
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'PinkBook',
        customerId: 'user', // Could be personalized
        customerEphemeralKeySecret: '', // Not needed for PaymentIntent
        paymentIntentClientSecret: intent.client_secret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: '',
          email: '',
          phone: '',
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      return intent;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [initPaymentSheet]);

  const presentPayment = useCallback(async (options: PaymentSheetOptions) => {
    try {
      setLoading(true);
      setError(null);

      // Initialize first
      await initializePaymentSheet(options);

      // Present the sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        throw new Error(presentError.message);
      }

      // Success callback
      if (options.onSuccess) {
        await options.onSuccess({
          amountCents: options.amountCents,
          currency: options.currency || 'cad',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setError(msg);
      if (options.onError) {
        options.onError(new Error(msg));
      }
    } finally {
      setLoading(false);
    }
  }, [initializePaymentSheet, presentPaymentSheet]);

  return {
    presentPayment,
    initializePaymentSheet,
    loading,
    error,
  };
}
