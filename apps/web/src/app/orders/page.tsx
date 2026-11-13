'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, ArrowRight, ShoppingBag } from 'lucide-react';
import { OrderDto } from '@mylapore/shared-types';

export default function OrdersListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
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
    <div className="min-h-screen bg-background py-8 sm:py-10 transition-colors duration-200">
      <div className="max-w-4xl 3xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-foreground">
            Track & Order History
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            View active culinary deliveries or check on any past order.
          </p>
        </div>

        {/* Quick Order Lookup Form */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Enter Order # (e.g. MYL-2026-1001)"
              value={lookupNumber}
              onChange={(e) => setLookupNumber(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-surface-muted text-foreground border border-border rounded-xl focus:outline-none focus:border-accent min-h-[44px]"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              className="font-bold"
            >
              Lookup
            </Button>
          </form>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-base text-foreground">
            Recent Orders
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-surface rounded-2xl border border-border animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-surface p-12 text-center rounded-2xl border border-border space-y-3 shadow-2xs">
              <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="font-serif font-bold text-base text-foreground">No orders found</p>
              <p className="text-xs text-muted-foreground">You haven't placed an order yet.</p>
              <Link
                href="/"
                className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:bg-primary-hover shadow-xs transition-all active:scale-[0.98]"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-accent transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-base text-foreground">{o.orderNumber}</span>
                    <Badge variant="accent" size="sm">
                      {o.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Slot: {o.deliverySlot} · {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-medium text-foreground truncate">
                    {o.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-border sm:border-t-0 pt-3 sm:pt-0">
                  <span className="font-serif font-bold text-base text-primary">
                    ${o.total.toFixed(2)}
                  </span>
                  <Link
                    href={`/orders/${o.orderNumber}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 transition-opacity min-h-[38px]"
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
