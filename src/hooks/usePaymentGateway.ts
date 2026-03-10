import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentOptions {
  amount: number; // in INR (will be converted to paise)
  reservationId?: string;
  leadId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  description?: string;
  onSuccess: (paymentId: string) => void;
  onFailure?: (error: string) => void;
}

// Load Razorpay SDK dynamically
const loadRazorpay = (): Promise<boolean> => {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const usePaymentGateway = () => {
  const [processing, setProcessing] = useState(false);

  const initiatePayment = async (opts: RazorpayPaymentOptions) => {
    setProcessing(true);

    try {
      // 1. Create pending transaction record in DB
      const { data: txn, error: txnError } = await supabase
        .from('payment_transactions')
        .insert({
          reservation_id: opts.reservationId || null,
          lead_id: opts.leadId || null,
          amount: opts.amount,
          currency: 'INR',
          gateway: 'razorpay',
          status: 'pending',
          metadata: {
            customer_name: opts.customerName,
            customer_phone: opts.customerPhone,
          },
        })
        .select()
        .single();

      if (txnError) throw new Error(txnError.message);

      // 2. Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Payment gateway failed to load');

      // 3. Open Razorpay checkout
      // NOTE: In production, create order_id from your backend/edge function
      const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxx';

      const razorpay = new window.Razorpay({
        key: RAZORPAY_KEY,
        amount: opts.amount * 100, // Convert to paise
        currency: 'INR',
        name: 'Gharpayy',
        description: opts.description || 'PG Booking',
        image: '/logo.png',
        // order_id: opts.orderId, // Required for production - generate from backend
        prefill: {
          name: opts.customerName,
          email: opts.customerEmail || '',
          contact: opts.customerPhone,
        },
        theme: { color: '#6366f1' },
        handler: async (response: any) => {
          // 4. Record successful payment
          await supabase
            .from('payment_transactions')
            .update({
              gateway_payment_id: response.razorpay_payment_id,
              gateway_signature: response.razorpay_signature,
              status: 'paid',
            })
            .eq('id', txn.id);

          toast.success('Payment successful!');
          opts.onSuccess(response.razorpay_payment_id);
          setProcessing(false);
        },
        modal: {
          ondismiss: async () => {
            await supabase
              .from('payment_transactions')
              .update({ status: 'failed', failure_reason: 'User dismissed' })
              .eq('id', txn.id);

            opts.onFailure?.('Payment cancelled');
            setProcessing(false);
          },
        },
      });

      razorpay.on('payment.failed', async (response: any) => {
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            failure_reason: response.error?.description,
            metadata: { error: response.error },
          })
          .eq('id', txn.id);

        toast.error(`Payment failed: ${response.error?.description}`);
        opts.onFailure?.(response.error?.description);
        setProcessing(false);
      });

      razorpay.open();
    } catch (err: any) {
      toast.error(err.message);
      opts.onFailure?.(err.message);
      setProcessing(false);
    }
  };

  // UPI QR-based payment (lightweight alternative)
  const generateUPILink = (opts: {
    amount: number;
    upiId?: string;
    name?: string;
    transactionRef?: string;
  }) => {
    const upiId = opts.upiId || import.meta.env.VITE_UPI_ID || 'gharpayy@upi';
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(opts.name || 'Gharpayy')}&am=${opts.amount}&cu=INR&tn=${encodeURIComponent(opts.transactionRef || 'PG Booking')}`;
  };

  return { initiatePayment, generateUPILink, processing };
};
