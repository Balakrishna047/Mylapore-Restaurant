'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Ban,
  ArrowLeft,
  ChefHat,
  Truck,
  Check
} from 'lucide-react';

const ORDER_STAGES = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'ACCEPTED', label: 'Kitchen Accepted', icon: Clock },
  { key: 'PREPARING', label: 'Blast Chilling & Prep', icon: ChefHat },
  { key: 'READY', label: 'Packed & Inspected', icon: Check },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 }
];

export default function OrderTrackingPage() {
  const params = useParams();
  const idOrNumber = params.id as string;

  const [order, setOrder] = useState<any>(null);
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
    const interval = setInterval(fetchOrder, 10000); // Poll status every 10s
    return () => clearInterval(interval);
  }, [idOrNumber]);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.rescheduleOrder(order.id, newSlot, rescheduleReason);
      setShowReschedule(false);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Rescheduling failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.cancelOrder(order.id, cancelReason);
      setShowCancel(false);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-pulse space-y-4">
        <div className="h-8 bg-[#E7DFD5] w-64 mx-auto rounded-md" />
        <div className="h-4 bg-[#E7DFD5] w-48 mx-auto rounded-md" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif font-bold text-2xl text-[#1C1917] mb-3">Order not found</h2>
        <p className="text-xs text-[#78716C] mb-6">{error || 'Please check your order reference number.'}</p>
        <Link href="/" className="px-6 py-2.5 bg-[#D95338] text-white text-xs font-bold rounded-full">
          Return to Menu
        </Link>
      </div>
    );
  }

  const currentStageIndex = ORDER_STAGES.findIndex((s) => s.key === order.status);
  const isCancelled = ['CANCELLED', 'REFUND_PENDING', 'REFUNDED'].includes(order.status);

  return (
    <div className="min-h-screen bg-[#FBF7F0] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-serif font-bold text-2xl text-[#1C1917]">
                Order {order.orderNumber}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isCancelled
                    ? 'bg-rose-100 text-rose-700'
                    : order.status === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-[#78716C] mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()} · {order.orderType}
            </p>
          </div>

          {/* Action buttons (Reschedule / Cancel) */}
          <div className="flex items-center gap-2">
            {order.canReschedule && !isCancelled && (
              <button
                onClick={() => setShowReschedule(true)}
                className="px-3.5 py-2 rounded-xl border border-[#E7DFD5] bg-white hover:bg-neutral-50 text-xs font-bold text-[#1C1917] flex items-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C8851A]" />
                <span>Reschedule</span>
              </button>
            )}

            {order.canCancel && !isCancelled && (
              <button
                onClick={() => setShowCancel(true)}
                className="px-3.5 py-2 rounded-xl border border-[#E7DFD5] bg-white hover:bg-rose-50 text-xs font-bold text-rose-700 flex items-center gap-1.5 shadow-xs"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Step Tracker */}
        {!isCancelled ? (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7DFD5] shadow-sm space-y-6">
            <h3 className="font-serif font-bold text-base text-[#1C1917]">
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
                          ? 'bg-[#D95338] text-white shadow-md ring-4 ring-[#D95338]/20 animate-pulse'
                          : isPassed
                          ? 'bg-[#15803D] text-white'
                          : 'bg-[#FAF4E8] text-[#A8A29E] border border-[#E7DFD5]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-semibold leading-tight ${
                        isCurrent ? 'text-[#D95338] font-bold' : isPassed ? 'text-[#1C1917]' : 'text-[#A8A29E]'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF4E8] border border-[#E7DFD5] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#44403C]">
                <Clock className="w-4 h-4 text-[#D95338]" />
                <span>Scheduled Arrival Window: <strong>{order.deliverySlot}</strong></span>
              </div>
              <span className="text-[11px] text-[#15803D] font-bold">
                Blast Chilled at 38°F
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>This order has been cancelled</span>
            </div>
            <p className="text-xs">
              Your refund entitlement has been calculated and submitted to Stripe for processing.
            </p>
          </div>
        )}

        {/* Order Details & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Items */}
          <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-[#E7DFD5] shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#1C1917] pb-2 border-b border-[#E7DFD5]">
              Dishes in this Order
            </h3>
            <div className="divide-y divide-[#E7DFD5]">
              {order.items.map((item: any) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-[#1C1917]">{item.quantity}x {item.name}</h4>
                    <p className="text-[11px] text-[#78716C]">{item.optionsSummary || 'Standard portion'}</p>
                  </div>
                  <span className="font-bold text-[#D95338]">${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Delivery address */}
            <div className="pt-3 border-t border-[#E7DFD5] space-y-1 text-xs">
              <span className="font-bold text-[#1C1917] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D95338]" /> Destination:
              </span>
              <p className="text-[#57534E]">{order.deliveryAddressText}</p>
            </div>
          </div>

          {/* Payment & Receipt */}
          <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-[#E7DFD5] shadow-xs space-y-3 text-xs">
            <h3 className="font-serif font-bold text-base text-[#1C1917] pb-2 border-b border-[#E7DFD5]">
              Receipt Summary
            </h3>
            <div className="space-y-1 text-[#78716C]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#15803D]">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax (8.25%)</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? 'FREE' : `$${order.deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Tip</span>
                <span>${order.tip.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-serif font-bold text-sm text-[#1C1917] pt-2 border-t border-[#E7DFD5]">
                <span>Total Paid</span>
                <span className="text-[#D95338]">${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-[#15803D] bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              ✓ Paid securely via Stripe (Status: {order.paymentStatus})
            </div>
          </div>
        </div>

        {/* Timeline Log */}
        {order.history && order.history.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-[#E7DFD5] shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#1C1917]">
              Order Activity Log
            </h3>
            <div className="space-y-3">
              {order.history.map((h: any) => (
                <div key={h.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#D97706] mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold text-[#1C1917] uppercase tracking-wider">{h.status}</span>
                    <span className="text-[#78716C] ml-2">{h.note}</span>
                  </div>
                  <span className="text-[10px] text-[#A8A29E] shrink-0">
                    {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form onSubmit={handleReschedule} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E7DFD5] space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#1C1917]">Reschedule Delivery Slot</h3>
            <p className="text-xs text-[#78716C]">
              Select a new available preparation slot. Rescheduling is complimentary up to 2 hours before your current scheduled slot.
            </p>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#44403C]">New Delivery Slot</label>
              <select
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E7DFD5] rounded-xl bg-white"
              >
                <option value="Today, 6:00 PM - 7:00 PM">Today, 6:00 PM - 7:00 PM</option>
                <option value="Tomorrow, 12:30 PM - 1:30 PM">Tomorrow, 12:30 PM - 1:30 PM</option>
                <option value="Tomorrow, 6:00 PM - 7:00 PM">Tomorrow, 6:00 PM - 7:00 PM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#44403C] mb-1">Reason (Optional)</label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Schedule meeting clash"
                className="w-full px-3 py-2 text-xs border border-[#E7DFD5] rounded-xl"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReschedule(false)}
                className="flex-1 py-2 text-xs font-semibold border border-[#E7DFD5] rounded-xl hover:bg-neutral-50"
              >
                Keep Current Slot
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2 text-xs font-bold bg-[#D95338] text-white rounded-xl hover:bg-[#C84B31]"
              >
                {actionLoading ? 'Updating...' : 'Confirm New Slot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form onSubmit={handleCancel} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E7DFD5] space-y-4">
            <h3 className="font-serif font-bold text-lg text-rose-700">Cancel Order {order.orderNumber}?</h3>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
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
              <label className="block text-xs font-bold text-[#44403C] mb-1">Reason for Cancellation</label>
              <textarea
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us why you wish to cancel..."
                rows={2}
                className="w-full px-3 py-2 text-xs border border-[#E7DFD5] rounded-xl"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancel(false)}
                className="flex-1 py-2 text-xs font-semibold border border-[#E7DFD5] rounded-xl hover:bg-neutral-50"
              >
                Don't Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700"
              >
                {actionLoading ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
