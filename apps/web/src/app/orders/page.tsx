'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Search, ArrowRight, Clock, ShoppingBag } from 'lucide-react';

export default function OrdersListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupNumber, setLookupNumber] = useState('');

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const data = await api.listOrders();
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupNumber.trim()) {
      router.push(`/orders/${lookupNumber.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1C1917]">
            Track & Order History
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            View active culinary deliveries or check on any past order.
          </p>
        </div>

        {/* Quick Order Lookup Form */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-xs">
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Order # (e.g. MYL-2026-1001)"
              value={lookupNumber}
              onChange={(e) => setLookupNumber(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-[#FAF4E8]/50 border border-[#E7DFD5] rounded-xl focus:outline-hidden focus:border-[#C8851A]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#D95338] text-white text-xs font-bold rounded-xl hover:bg-[#C84B31] transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lookup</span>
            </button>
          </form>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1C1917]">
            Recent Orders
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-[#E7DFD5] animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-[#E7DFD5] space-y-3">
              <ShoppingBag className="w-8 h-8 text-[#78716C] mx-auto" />
              <p className="font-serif font-bold text-base text-[#1C1917]">No orders found</p>
              <p className="text-xs text-[#78716C]">You haven't placed an order yet.</p>
              <Link href="/" className="inline-block px-5 py-2 bg-[#D95338] text-white text-xs font-bold rounded-full">
                Browse Menu
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#C8851A] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base text-[#1C1917]">{o.orderNumber}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF4E8] text-[#D95338] border border-[#E7DFD5]">
                      {o.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C]">
                    Slot: {o.deliverySlot} · {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-medium text-[#44403C]">
                    {o.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                  <span className="font-serif font-bold text-base text-[#D95338]">
                    ${o.total.toFixed(2)}
                  </span>
                  <Link
                    href={`/orders/${o.orderNumber}`}
                    className="px-4 py-2 bg-[#1C1917] hover:bg-neutral-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <span>Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
