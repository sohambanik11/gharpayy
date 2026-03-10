import { useState } from 'react';
import { usePaymentGateway } from '@/hooks/usePaymentGateway';
import { CreditCard, Smartphone, Loader2, CheckCircle, IndianRupee } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PaymentButtonProps {
  amount: number;
  reservationId?: string;
  leadId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  description?: string;
  onSuccess: (paymentId: string) => void;
  label?: string;
  variant?: 'primary' | 'outline';
}

export const PaymentButton = ({
  amount,
  reservationId,
  leadId,
  customerName,
  customerPhone,
  customerEmail,
  description,
  onSuccess,
  label = 'Pay Now',
  variant = 'primary',
}: PaymentButtonProps) => {
  const { initiatePayment, generateUPILink, processing } = usePaymentGateway();
  const [showOptions, setShowOptions] = useState(false);
  const [paid, setPaid] = useState(false);

  const handleSuccess = (paymentId: string) => {
    setPaid(true);
    setShowOptions(false);
    onSuccess(paymentId);
  };

  const handleRazorpay = () => {
    setShowOptions(false);
    initiatePayment({
      amount,
      reservationId,
      leadId,
      customerName,
      customerPhone,
      customerEmail,
      description,
      onSuccess: handleSuccess,
    });
  };

  const upiLink = generateUPILink({
    amount,
    name: 'Gharpayy',
    transactionRef: reservationId || leadId || 'booking',
  });

  if (paid) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium">
        <CheckCircle size={15} />
        Payment Confirmed
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowOptions(true)}
        disabled={processing}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
          variant === 'primary'
            ? 'bg-accent text-accent-foreground hover:bg-accent/90'
            : 'border border-border text-foreground hover:bg-secondary'
        }`}
      >
        {processing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <IndianRupee size={14} />
        )}
        {processing ? 'Processing...' : label}
        {!processing && <span className="font-bold">₹{amount.toLocaleString('en-IN')}</span>}
      </button>

      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Choose Payment Method</DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            {/* Amount display */}
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/15 text-center">
              <p className="text-xs text-muted-foreground">Amount to pay</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                ₹{amount.toLocaleString('en-IN')}
              </p>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>

            {/* Card / Net Banking via Razorpay */}
            <button
              onClick={handleRazorpay}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent/40 hover:bg-accent/3 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CreditCard size={16} className="text-blue-500" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xs font-semibold text-foreground">Card / UPI / Net Banking</p>
                <p className="text-[10px] text-muted-foreground">Powered by Razorpay · Secure</p>
              </div>
              <span className="text-[10px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>

            {/* Direct UPI */}
            <a
              href={upiLink}
              onClick={() => setShowOptions(false)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-green-500/40 hover:bg-green-500/3 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Smartphone size={16} className="text-green-500" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xs font-semibold text-foreground">Direct UPI</p>
                <p className="text-[10px] text-muted-foreground">GPay, PhonePe, Paytm, BHIM</p>
              </div>
              <span className="text-[10px] text-green-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </a>

            <p className="text-center text-[10px] text-muted-foreground">
              🔒 256-bit SSL encrypted · Your data is safe
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
