import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, CheckCircle, IndianRupee, Loader2, AlertCircle, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentButtonProps {
  amount: number;
  reservationId?: string;
  leadId?: string;
  customerName: string;
  customerPhone: string;
  description?: string;
  onSuccess: (ref: string) => void;
  label?: string;
  variant?: 'primary' | 'outline';
}

type Screen = 'entry' | 'qr' | 'processing' | 'success';

const MERCHANT_UPI = import.meta.env.VITE_UPI_ID || 'gharpayy@ybl';

const isMobile = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

export const PaymentButton = ({
  amount,
  reservationId,
  leadId,
  customerName,
  customerPhone,
  description,
  onSuccess,
  label = 'Pay via UPI',
  variant = 'primary',
}: PaymentButtonProps) => {
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>('entry');
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [txnRef, setTxnRef] = useState('');
  const [paid, setPaid] = useState(false);
  const [onMobile, setOnMobile] = useState(false);

  useEffect(() => { setOnMobile(isMobile()); }, []);

  const upiLink = `upi://pay?pa=${MERCHANT_UPI}&pn=Gharpayy&am=${amount}&cu=INR&tn=${encodeURIComponent(description || 'PG Booking')}&tr=${txnRef}`;

  const resetAndOpen = () => {
    const ref = `GP${Date.now().toString(36).toUpperCase()}`;
    setTxnRef(ref);
    setScreen('entry');
    setUpiId('');
    setUpiError('');
    setLoading(false);
    setOpen(true);
  };

  const saveTransaction = async (customerUpi = '') => {
    try {
      await supabase.from('payment_transactions').insert({
        reservation_id: reservationId || null,
        lead_id: leadId || null,
        amount,
        currency: 'INR',
        gateway: 'upi',
        gateway_payment_id: txnRef,
        status: 'pending',
        metadata: {
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_upi: customerUpi,
          merchant_upi: MERCHANT_UPI,
          description,
          device: onMobile ? 'mobile' : 'desktop',
        },
      });
    } catch (err) {
      console.error('Failed to save transaction:', err);
    }
  };

  const validateUPI = (id: string) =>
    /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(id);

  // Mobile: customer enters UPI ID → their app opens
  const handleMobilePay = async () => {
    setUpiError('');
    if (!upiId.trim()) { setUpiError('Please enter your UPI ID'); return; }
    if (!validateUPI(upiId.trim())) {
      setUpiError('Invalid format. Example: name@ybl or 9876543210@paytm');
      return;
    }
    setLoading(true);
    await saveTransaction(upiId.trim());
    window.location.href = upiLink;
    setScreen('processing');
    setLoading(false);
    setTimeout(() => setScreen('success'), 3000);
  };

  // Desktop: save and show QR
  const handleShowQR = async () => {
    await saveTransaction();
    setScreen('qr');
  };

  const handleDone = () => {
    setPaid(true);
    setOpen(false);
    onSuccess(txnRef);
  };

  if (paid) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-medium">
        <CheckCircle size={15} /> Payment Initiated
      </div>
    );
  }

  return (
    <>
      <button
        onClick={resetAndOpen}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          variant === 'primary'
            ? 'bg-accent text-accent-foreground hover:bg-accent/90'
            : 'border border-border text-foreground hover:bg-secondary'
        }`}
      >
        <IndianRupee size={14} />
        {label}
        <span className="font-bold">₹{amount.toLocaleString('en-IN')}</span>
      </button>

      <Dialog open={open} onOpenChange={v => { if (!loading) setOpen(v); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              {screen === 'qr'
                ? <><QrCode size={14} className="text-green-500" /> Scan QR to Pay</>
                : <><Smartphone size={14} className="text-green-500" />
                    {screen === 'entry' ? 'Pay via UPI'
                      : screen === 'processing' ? 'Opening UPI App...'
                      : 'Payment Initiated'}
                  </>
              }
            </DialogTitle>
          </DialogHeader>

          {/* Amount banner */}
          {screen !== 'success' && (
            <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/15 text-center">
              <p className="text-xs text-muted-foreground">Amount to pay</p>
              <p className="text-3xl font-bold text-foreground mt-0.5">
                ₹{amount.toLocaleString('en-IN')}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}

          {/* ── ENTRY ── */}
          {screen === 'entry' && (
            <div className="space-y-4">

              {/* MOBILE: enter UPI ID and open app */}
              {onMobile && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Your UPI ID</label>
                    <input
                      type="text"
                      placeholder="yourname@ybl or 9876543210@paytm"
                      value={upiId}
                      onChange={e => { setUpiId(e.target.value); setUpiError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleMobilePay()}
                      autoFocus
                      className={`w-full px-3 py-3 rounded-xl bg-secondary border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-green-500/30 transition-all ${
                        upiError ? 'border-red-500/60' : 'border-border'
                      }`}
                    />
                    {upiError && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500">
                        <AlertCircle size={11} /> {upiError}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Find it in GPay → Profile photo, or PhonePe → Profile
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['@ybl', '@oksbi', '@okaxis', '@paytm', '@ibl', '@okhdfcbank', '@okicici'].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          const base = upiId.includes('@') ? upiId.split('@')[0] : upiId;
                          setUpiId((base || 'yourname') + h);
                          setUpiError('');
                        }}
                        className="px-2 py-1 rounded-lg bg-secondary border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-green-500/50 transition-colors"
                      >
                        {h}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleMobilePay}
                    disabled={loading || !upiId.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {loading
                      ? <><Loader2 size={14} className="animate-spin" /> Opening app...</>
                      : <><Smartphone size={14} /> Pay ₹{amount.toLocaleString('en-IN')}</>
                    }
                  </button>
                </>
              )}

              {/* DESKTOP: only QR code option */}
              {!onMobile && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border text-sm text-muted-foreground text-center leading-relaxed">
                    Open <span className="font-semibold text-foreground">GPay → Scan</span> or{' '}
                    <span className="font-semibold text-foreground">PhonePe → Scan & Pay</span> on your
                    phone and scan the QR code to pay instantly.
                  </div>

                  <button
                    onClick={handleShowQR}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
                  >
                    <QrCode size={16} />
                    Show QR Code
                  </button>
                </div>
              )}

              <p className="text-center text-[10px] text-muted-foreground">
                🔒 Secure UPI payment · Fully refundable within 24 hours
              </p>
            </div>
          )}

          {/* ── QR CODE (desktop) ── */}
          {screen === 'qr' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="p-5 rounded-2xl bg-white border-2 border-green-500/20 shadow-sm">
                  <QRCodeSVG
                    value={upiLink}
                    size={200}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Scan with GPay, PhonePe or Paytm
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
                    Paying to: {MERCHANT_UPI}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Amount of ₹{amount.toLocaleString('en-IN')} will be pre-filled in your app
                  </p>
                </div>
              </div>

              <button
                onClick={() => setScreen('success')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
              >
                <CheckCircle size={14} />
                I've completed the payment
              </button>

              <button
                onClick={() => setScreen('entry')}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── MOBILE PROCESSING ── */}
          {screen === 'processing' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <Loader2 size={28} className="text-green-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Opening your UPI app...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Approve the ₹{amount.toLocaleString('en-IN')} payment in your app
                </p>
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {screen === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-bold text-foreground">Payment Done!</p>
                <p className="text-xs text-muted-foreground">
                  ₹{amount.toLocaleString('en-IN')} · Ref: {txnRef}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Our team will confirm your booking within 30 minutes
                </p>
              </div>
              <button
                onClick={handleDone}
                className="px-8 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
              >
                Done
              </button>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
};