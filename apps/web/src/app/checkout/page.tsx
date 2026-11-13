'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { CreditCard, Clock, MapPin, ArrowRight, Lock, Check } from 'lucide-react';
import { CheckoutQuoteDto } from '@mylapore/shared-types';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, refreshCart, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const { location, orderType: defaultOrderType } = useLocation();
  const toast = useToast();

  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>(defaultOrderType || 'DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState(
    location?.address ||
      (user?.addresses?.[0]?.street
        ? `${user.addresses[0].street}, ${user.addresses[0].city}, ${user.addresses[0].state} ${user.addresses[0].zipCode}`
        : '1244 S Capitol Ave, San Jose, CA 95127')
  );
  const [deliverySlot, setDeliverySlot] = useState('Today, 6:00 PM - 7:00 PM');
  const [tip, setTip] = useState(3.0);
  const [couponCode, setCouponCode] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '(408) 555-0199');

  const [quote, setQuote] = useState<CheckoutQuoteDto | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Card details state (PCI mock input)
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  useEffect(() => {
    async function fetchQuote() {
      if (!cart || cart.items.length === 0) return;
      try {
        setLoadingQuote(true);
        const data = await api.getQuote({
          orderType,
          couponCode: appliedCoupon || undefined,
          tip,
          deliveryAddressText: deliveryAddress,
        });
        setQuote(data);
      } catch (err) {
        console.error('Failed to calculate server quote:', err);
      } finally {
        setLoadingQuote(false);
      }
    }
    fetchQuote();
  }, [cart, orderType, appliedCoupon, tip, deliveryAddress]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.toUpperCase().trim();
    if (!code) return;
    const ok = applyCoupon(code);
    if (ok) {
      setCouponCode('');
      toast.success('Promo Code Applied', `Discount activated.`);
    } else {
      toast.error('Invalid Coupon Code', 'Try MYLAPORE15 (15% off) or WELCOME5 ($5 off).');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) {
      toast.warning('Empty Cart', 'Please add dishes to checkout.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createOrderIntent({
        orderType,
        deliveryAddressText:
          orderType === 'DELIVERY'
            ? deliveryAddress
            : 'Pickup at Mylapore Express Kitchen',
        deliverySlot,
        couponCode: appliedCoupon || undefined,
        tip,
        specialInstructions,
        guestName: user ? user.name : guestName || 'Valued Guest',
        guestEmail: user ? user.email : guestEmail || 'customer@example.com',
        guestPhone: user ? user.phone : guestPhone || '(925) 238-3736',
      });

      // Confirm payment through webhook/test helper
      if (res.paymentIntent?.paymentIntentId) {
        await api.confirmTestPayment(res.paymentIntent.paymentIntentId);
      }

      toast.success('Order Placed Successfully!', `Order #${res.order.orderNumber} confirmed.`);
      await refreshCart();
      router.push(`/orders/${res.order.orderNumber}`);
    } catch (err: any) {
      toast.error('Payment Failed', err.message || 'Please check your payment details.');
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif font-bold text-2xl text-foreground mb-3">Your cart is empty</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Add dishes from our authentic South Indian menu to begin checkout.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:bg-primary-hover shadow-xs"
        >
          Explore Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 sm:py-8 w-full max-w-full overflow-x-hidden transition-colors duration-200">
      <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-foreground mb-8">
          Checkout
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Details, Fulfillment, Slot, Payment */}
          <div className="lg:col-span-7 space-y-6">
            {/* Fulfillment Mode Toggle */}
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-2xs space-y-3">
              <h3 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider">
                1. Fulfillment Mode
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('DELIVERY')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                    orderType === 'DELIVERY'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border text-foreground hover:border-accent'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Doorstep Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('PICKUP')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                    orderType === 'PICKUP'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border text-foreground hover:border-accent'
                  }`}
                >
                  <span>Kitchen Pickup ($0)</span>
                </button>
              </div>

              {orderType === 'DELIVERY' ? (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street Address, City, State, Zip"
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-muted text-foreground border border-border rounded-xl focus:outline-none focus:border-accent"
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground bg-surface-muted p-3 rounded-xl border border-border">
                  📍 Pickup at: <strong className="text-foreground">Mylapore Express Kitchen</strong>, San Jose / Bay Area Delivery Hub. We will notify you as soon as your order is blast-chilled and packaged.
                </p>
              )}
            </div>

            {/* Scheduled Time Slot */}
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-2xs space-y-3">
              <h3 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span>2. Scheduled Delivery Window</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Select your preferred blast-chilled delivery arrival window:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  'Today, 12:30 PM - 1:30 PM',
                  'Today, 6:00 PM - 7:00 PM',
                  'Tomorrow, 12:30 PM - 1:30 PM',
                  'Tomorrow, 6:00 PM - 7:00 PM',
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setDeliverySlot(slot)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer min-h-[44px] ${
                      deliverySlot === slot
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                        : 'border-border hover:border-accent text-foreground'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Details */}
            {!user && (
              <div className="bg-surface p-5 rounded-2xl border border-border shadow-2xs space-y-3">
                <h3 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider">
                  3. Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Anand Krishnan"
                      className="w-full px-3 py-2 text-xs bg-surface-muted text-foreground border border-border rounded-xl focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full px-3 py-2 text-xs bg-surface-muted text-foreground border border-border rounded-xl focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">Phone</label>
                    <input
                      type="text"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="(925) 238-3736"
                      className="w-full px-3 py-2 text-xs bg-surface-muted text-foreground border border-border rounded-xl focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-2xs space-y-2">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                Special Kitchen Instructions (Optional)
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Gate code, spice preference, or delivery drop-off notes..."
                rows={2}
                className="w-full px-3 py-2 text-xs bg-surface-muted text-foreground border border-border rounded-xl focus:outline-none focus:border-accent"
              />
            </div>

            {/* Stripe Card Payment Simulation */}
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>Payment Method (Stripe 256-bit Encrypted)</span>
                </h3>
                <span className="text-[10px] text-success font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PCI Compliant
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-surface-muted text-foreground border border-border rounded-xl font-mono focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-surface-muted text-foreground border border-border rounded-xl font-mono focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-surface-muted text-foreground border border-border rounded-xl font-mono focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Pay */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-md space-y-4 lg:sticky lg:top-28">
              <h3 className="font-serif font-bold text-base text-foreground pb-3 border-b border-border">
                Order Summary ({cart.itemCount} items)
              </h3>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-border pr-1 space-y-2">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="pt-2 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{item.quantity}x {item.name}</p>
                      <span className="text-[10px] text-muted-foreground">{item.variantName || 'Regular'}</span>
                    </div>
                    <span className="font-bold text-primary">${item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Tip Selection */}
              <div className="border-t border-border pt-3 space-y-2">
                <label className="block text-xs font-bold text-foreground">Add Kitchen Tip</label>
                <div className="grid grid-cols-4 gap-2">
                  {[2.0, 3.0, 5.0, 0.0].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTip(t)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer min-h-[38px] ${
                        tip === t
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-foreground hover:border-accent'
                      }`}
                    >
                      {t === 0 ? 'None' : `$${t.toFixed(2)}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo Code */}
              <div className="border-t border-border pt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon (MYLAPORE15)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs uppercase bg-surface-muted text-foreground border border-border rounded-lg focus:outline-none focus:border-accent"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyCoupon}
                    variant="secondary"
                    size="sm"
                    className="font-bold"
                  >
                    Apply
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-success font-semibold">
                    <span>✓ Promo "{appliedCoupon}" active</span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[10px] text-muted-foreground hover:text-destructive underline cursor-pointer font-normal"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t border-border pt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-foreground">${quote?.subtotal?.toFixed(2) || cart.subtotal.toFixed(2)}</span>
                </div>
                {quote?.discount && quote.discount > 0 ? (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-${quote.discount.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>Sales Tax (8.25%)</span>
                  <span className="text-foreground">${quote?.tax?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-foreground">{quote?.deliveryFee === 0 ? 'FREE' : `$${quote?.deliveryFee?.toFixed(2) || '4.99'}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kitchen Tip</span>
                  <span className="text-foreground">${tip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-serif font-bold text-base text-foreground pt-2 border-t border-border">
                  <span>Total Amount</span>
                  <span className="text-primary">${quote?.total?.toFixed(2) || cart.subtotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Pay Button */}
              <Button
                type="submit"
                disabled={isSubmitting || loadingQuote}
                isLoading={isSubmitting}
                variant="primary"
                size="lg"
                className="w-full uppercase tracking-wider font-bold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Place Order & Pay (${quote?.total?.toFixed(2) || cart.subtotal.toFixed(2)})
              </Button>

              <div className="text-[10px] text-muted-foreground text-center pt-2">
                By placing this order you agree to our Terms of Service & Cancellation Policies.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
