'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ChefHat,
  Package,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle,
  Truck,
  RefreshCw,
} from 'lucide-react';
import { MenuItemDto } from '@mylapore/shared-types';

interface KitchenTicket {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  deliverySlot: string;
  notes?: string;
  items: string[];
}

interface AdminDashboardData {
  totalRevenue?: number;
  activeKitchenCount?: number;
  readyDeliveryCount?: number;
  outOfStockItems?: number;
  activeKitchenOrders?: KitchenTicket[];
}

export default function AdminKdsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState<MenuItemDto[]>([]);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, items] = await Promise.all([
        api.getAdminDashboard(),
        api.getMenuItems(),
      ]);
      setDashboard(dash);
      setDishes(items);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast.error('Sync Failed', 'Could not refresh kitchen display.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus = 'ACCEPTED';
    if (currentStatus === 'CONFIRMED') nextStatus = 'ACCEPTED';
    else if (currentStatus === 'ACCEPTED') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    else if (currentStatus === 'READY') nextStatus = 'OUT_FOR_DELIVERY';
    else if (currentStatus === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';

    setAdvancingId(orderId);
    try {
      await api.advanceOrderStatus(orderId, nextStatus, `Staff advanced to ${nextStatus}`);
      toast.success('Ticket Advanced', `Order moved to ${nextStatus}`);
      await loadData();
    } catch (err: any) {
      toast.error('Status Update Failed', err.message || 'Could not advance order');
    } finally {
      setAdvancingId(null);
    }
  };

  const handleToggleStock = async (itemId: string, currentStock: boolean) => {
    try {
      await api.toggleStock(itemId);
      toast.info(
        currentStock ? 'Dish 86\'d' : 'Dish Restocked',
        `Availability updated on live store.`
      );
      await loadData();
    } catch (err: any) {
      toast.error('Stock Toggle Failed', err.message || 'Could not update stock status');
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 transition-colors duration-200">
      <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
              <ChefHat className="w-7 h-7 text-primary" />
              <span>Kitchen Display System & Admin Portal</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Active preparation queue, blast-chilling progress, and operational inventory controls.
            </p>
          </div>
          <Button
            onClick={loadData}
            variant="secondary"
            size="sm"
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Queue
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              Total GMV Revenue
            </span>
            <p className="font-serif font-bold text-xl sm:text-2xl text-success mt-1">
              ${dashboard?.totalRevenue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              Active Kitchen Tickets
            </span>
            <p className="font-serif font-bold text-xl sm:text-2xl text-primary mt-1">
              {dashboard?.activeKitchenCount ?? 0}
            </p>
          </div>
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              Ready for Dispatch
            </span>
            <p className="font-serif font-bold text-xl sm:text-2xl text-accent mt-1">
              {dashboard?.readyDeliveryCount ?? 0}
            </p>
          </div>
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              Out of Stock Dishes
            </span>
            <p className="font-serif font-bold text-xl sm:text-2xl text-muted-foreground mt-1">
              {dashboard?.outOfStockItems ?? 0}
            </p>
          </div>
        </div>

        {/* Kitchen Active Queue */}
        <div className="space-y-4">
          <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
            <span>🔥 Live Preparation & Packaging Queue</span>
          </h2>

          {loading && !dashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-44 bg-surface rounded-2xl border border-border animate-pulse"
                />
              ))}
            </div>
          ) : dashboard?.activeKitchenOrders?.length === 0 ? (
            <div className="p-8 bg-surface rounded-2xl border border-border text-center text-xs text-muted-foreground">
              All kitchen tickets are currently prepared and dispatched!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard?.activeKitchenOrders?.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-surface rounded-2xl border border-border shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-accent/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif font-bold text-base text-foreground">
                          {ticket.orderNumber}
                        </h4>
                        <span className="text-xs text-muted-foreground">{ticket.customerName}</span>
                      </div>
                      <Badge variant="accent" size="sm">
                        {ticket.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-foreground bg-surface-muted p-2.5 rounded-xl border border-border space-y-1">
                      <p className="font-semibold">Slot: {ticket.deliverySlot}</p>
                      {ticket.notes && (
                        <p className="italic text-[11px] text-primary">Note: "{ticket.notes}"</p>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      {ticket.items.map((line, idx) => (
                        <div key={idx} className="font-medium text-foreground">
                          • {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advance State Button */}
                  <Button
                    onClick={() => handleAdvanceStatus(ticket.id, ticket.status)}
                    isLoading={advancingId === ticket.id}
                    variant="primary"
                    className="w-full text-xs font-bold"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    {ticket.status === 'CONFIRMED'
                      ? 'Accept Ticket'
                      : ticket.status === 'ACCEPTED'
                      ? 'Start Cooking & Blast Chill'
                      : ticket.status === 'PREPARING'
                      ? 'Mark Packed & Ready'
                      : 'Dispatch to Driver'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory 86 Management */}
        <div className="bg-surface p-6 rounded-3xl border border-border shadow-2xs space-y-4">
          <div>
            <h2 className="font-serif font-bold text-lg text-foreground">
              Dish Availability & 86 Controls
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              One-click toggle to mark an authentic dish as sold out (86) or restocked across the live website and mobile web apps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dishes.map((dish) => (
              <div
                key={dish.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-muted"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder-dish.svg';
                    }}
                  />
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-foreground truncate">{dish.name}</h5>
                    <span className="text-[10px] text-muted-foreground">
                      ${dish.basePrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleToggleStock(dish.id, dish.isAvailable)}
                  variant={dish.isAvailable ? 'secondary' : 'destructive'}
                  size="sm"
                  className="shrink-0 text-xs font-bold ml-2"
                >
                  {dish.isAvailable ? 'In Stock' : '86\'d (Sold Out)'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
