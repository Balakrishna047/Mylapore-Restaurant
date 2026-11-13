'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DrawerSheet } from '@/components/ui/DrawerSheet';
import {
  CheckCircle2,
  Clock,
  MapPin,
  RotateCcw,
  Ban,
  ArrowLeft,
  ChefHat,
  Truck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { OrderDto } from '@mylapore/shared-types';

const ORDER_STAGES = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'ACCEPTED', label: 'Kitchen Accepted', icon: Clock },
  { key: 'PREPARING', label: 'Blast Chilling & Prep', icon: ChefHat },
  { key: 'READY', label: 'Packed & Inspected', icon: Check },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const idOrNumber = params.id as string;
  const toast = useToast();

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reschedule & Cancel modals
  const [showReschedule, setShowReschedule] = useState(false);
  const [newSlot, setNewSlot] = useState('Tomorrow, 12:30 PM - 1:30 PM');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed plans');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await api.getOrder(idOrNumber);
      setOrder(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [idOrNumber]);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setActionLoading(true);
      await api.rescheduleOrder(order.id, newSlot, rescheduleReason);
      setShowReschedule(false);
      toast.success('Order Rescheduled', `Delivery slot updated to ${newSlot}`);
      await fetchOrder();
    } catch (err: any) {
      toast.error('Rescheduling Failed', err.message || 'Slot could not be updated.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setActionLoading(true);
      await api.cancelOrder(order.id, cancelReason);
      setShowCancel(false);
      toast.info('Order Cancelled', 'Refund processing submitted to Stripe.');
      await fetchOrder();
    } catch (err: any) {
      toast.error('Cancellation Failed', err.message || 'Could not cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="max-w-4xl 3xl:max-w-5xl mx-auto px-4 py-20 text-center animate-pulse space-y-4">
        <div className="h-8 bg-surface-muted w-64 mx-auto rounded-md" />
        <div className="h-4 bg-surface-muted w-48 mx-auto rounded-md" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl 3xl:max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif font-bold text-2xl text-foreground mb-3">Order not found</h2>
        <p className="text-xs text-muted-foreground mb-6">
          {error || 'Please check your order reference number.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:bg-primary-hover shadow-xs"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  const currentStageIndex = ORDER_STAGES.findIndex((s) => s.key === order.status);
  const isCancelled = ['CANCELLED', 'REFUND_PENDING', 'REFUNDED'].includes(order.status);

  return (
    <div className="min-h-screen bg-background py-8 transition-colors duration-200">
      <div className="max-w-4xl 3xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 transition-colors min-h-[36px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif font-bold text-2xl text-foreground">
                Order {order.orderNumber}
              </h1>
              <Badge
                variant={
                  isCancelled
                    ? 'destructive'
                    : order.status === 'DELIVERED'
                    ? 'success'
                    : 'accent'
                }
                size="md"
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()} · {order.orderType}
            </p>
          </div>

          {/* Action buttons (Reschedule / Cancel) */}
          <div className="flex items-center gap-2">
            {order.canReschedule && !isCancelled && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowReschedule(true)}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-accent" />}
                className="font-bold text-xs"
              >
                Reschedule
              </Button>
            )}

            {order.canCancel && !isCancelled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancel(true)}
                leftIcon={<Ban className="w-3.5 h-3.5" />}
                className="font-bold text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Live Step Tracker */}
        {!isCancelled ? (
          <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-6">
            <h3 className="font-serif font-bold text-base text-foreground">
              Live Order Progress
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {ORDER_STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stage.key} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20 animate-pulse'
                          : isPassed
                          ? 'bg-success text-success-foreground'
                          : 'bg-surface-muted text-muted-foreground border border-border'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-semibold leading-tight ${
                        isCurrent
                          ? 'text-primary font-bold'
                          : isPassed
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-surface-muted border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Scheduled Arrival Window: <strong>{order.deliverySlot}</strong>
                </span>
              </div>
              <span className="text-[11px] text-success font-bold">
                Blast Chilled at 38°F
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-destructive/10 border border-destructive/30 p-6 rounded-2xl text-destructive space-y-2">
            <div className="flex items-center gap-2 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span>This order has been cancelled</span>
            </div>
            <p className="text-xs leading-relaxed">
              Your refund entitlement has been calculated and submitted to Stripe for processing.
            </p>
          </div>
        )}

        {/* Order Details & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Items */}
          <div className="md:col-span-7 bg-surface p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-foreground pb-2 border-b border-border">
              Dishes in this Order
            </h3>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-foreground">
                      {item.quantity}x {item.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {item.optionsSummary || 'Standard portion'}
                    </p>
                  </div>
                  <span className="font-bold text-primary">
                    ${item.totalPrice.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Delivery address */}
            <div className="pt-3 border-t border-border space-y-1 text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Destination:
              </span>
              <p className="text-muted-foreground">{order.deliveryAddress}</p>
            </div>
          </div>

          {/* Payment & Receipt */}
          <div className="md:col-span-5 bg-surface p-6 rounded-3xl border border-border shadow-xs space-y-3 text-xs">
            <h3 className="font-serif font-bold text-base text-foreground pb-2 border-b border-border">
              Receipt Summary
            </h3>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-foreground">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax (8.25%)</span>
                <span className="text-foreground">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-foreground">
                  {order.deliveryFee === 0 ? 'FREE' : `$${order.deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tip</span>
                <span className="text-foreground">${order.tip.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-serif font-bold text-sm text-foreground pt-2 border-t border-border">
                <span>Total Paid</span>
                <span className="text-primary">${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-success bg-success/10 p-2.5 rounded-xl border border-success/20">
              ✓ Paid securely via Stripe (Status: {order.paymentStatus})
            </div>
          </div>
        </div>

        {/* Timeline Log */}
        {order.history && order.history.length > 0 && (
          <div className="bg-surface p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-foreground">
              Order Activity Log
            </h3>
            <div className="space-y-3">
              {order.history.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold text-foreground uppercase tracking-wider">
                      {h.status}
                    </span>
                    <span className="text-muted-foreground ml-2">{h.note}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(h.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Drawer Sheet */}
      <DrawerSheet
        isOpen={showReschedule}
        onClose={() => setShowReschedule(false)}
        maxWidth="max-w-md"
        title="Reschedule Delivery Slot"
        description="Select a new available preparation slot. Complimentary up to 2 hours before current slot."
      >
        <form onSubmit={handleReschedule} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">New Delivery Slot</label>
            <select
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-surface text-foreground"
            >
              <option value="Today, 6:00 PM - 7:00 PM">Today, 6:00 PM - 7:00 PM</option>
              <option value="Tomorrow, 12:30 PM - 1:30 PM">Tomorrow, 12:30 PM - 1:30 PM</option>
              <option value="Tomorrow, 6:00 PM - 7:00 PM">Tomorrow, 6:00 PM - 7:00 PM</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Reason (Optional)</label>
            <input
              type="text"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="e.g. Schedule meeting clash"
              className="w-full px-3 py-2.5 text-xs bg-surface text-foreground border border-border rounded-xl"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowReschedule(false)}
              className="flex-1 text-xs"
            >
              Keep Current Slot
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={actionLoading}
              className="flex-1 text-xs font-bold"
            >
              Confirm New Slot
            </Button>
          </div>
        </form>
      </DrawerSheet>

      {/* Cancel Drawer Sheet */}
      <DrawerSheet
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        maxWidth="max-w-md"
        title={`Cancel Order ${order.orderNumber}?`}
        description="Review operational cancellation policy below before proceeding."
      >
        <form onSubmit={handleCancel} className="space-y-4 pt-1">
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl text-xs text-warning space-y-1">
            <span className="font-bold">Refund Policy Breakdown:</span>
            <p>
              {order.status === 'CONFIRMED' || order.status === 'PAID'
                ? 'Your order is currently CONFIRMED. You are entitled to a 100% full refund.'
                : order.status === 'ACCEPTED'
                ? 'Your order has been ACCEPTED by the kitchen. You are entitled to a 50% refund.'
                : 'Order is already being blast-chilled; refunds are non-negotiable.'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Reason for Cancellation</label>
            <textarea
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please tell us why you wish to cancel..."
              rows={2}
              className="w-full px-3 py-2 text-xs bg-surface text-foreground border border-border rounded-xl"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCancel(false)}
              className="flex-1 text-xs"
            >
              Don't Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={actionLoading}
              className="flex-1 text-xs font-bold"
            >
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </DrawerSheet>
    </div>
  );
}
