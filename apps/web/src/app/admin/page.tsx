'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
  ShoppingBag
} from 'lucide-react';

export default function AdminKdsPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, items] = await Promise.all([
        api.getAdminDashboard(),
        api.getMenuItems()
      ]);
      setDashboard(dash);
      setDishes(items);
    } catch (err) {
      console.error('Failed to load admin data:', err);
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

    try {
      await api.advanceOrderStatus(orderId, nextStatus, `Staff advanced to ${nextStatus}`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleToggleStock = async (itemId: string) => {
    try {
      await api.toggleStock(itemId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle stock');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1C1917] flex items-center gap-2.5">
              <ChefHat className="w-7 h-7 text-[#D95338]" />
              <span>Kitchen Display System & Admin Portal</span>
            </h1>
            <p className="text-xs text-[#78716C] mt-1">
              Active preparation queue, blast-chilling progress, and operational inventory controls.
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-white border border-[#E7DFD5] rounded-xl text-xs font-bold text-[#1C1917] hover:bg-neutral-50 flex items-center gap-2 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-xs">
            <span className="text-[11px] font-bold uppercase text-[#78716C] tracking-wider">Total GMV Revenue</span>
            <p className="font-serif font-bold text-2xl text-[#15803D] mt-1">
              ${dashboard?.totalRevenue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-xs">
            <span className="text-[11px] font-bold uppercase text-[#78716C] tracking-wider">Active Kitchen Tickets</span>
            <p className="font-serif font-bold text-2xl text-[#D95338] mt-1">
              {dashboard?.activeKitchenCount ?? 0}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-xs">
            <span className="text-[11px] font-bold uppercase text-[#78716C] tracking-wider">Ready for Dispatch</span>
            <p className="font-serif font-bold text-2xl text-[#C8851A] mt-1">
              {dashboard?.readyDeliveryCount ?? 0}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-xs">
            <span className="text-[11px] font-bold uppercase text-[#78716C] tracking-wider">Out of Stock Dishes</span>
            <p className="font-serif font-bold text-2xl text-[#78716C] mt-1">
              {dashboard?.outOfStockItems ?? 0}
            </p>
          </div>
        </div>

        {/* Kitchen Active Queue */}
        <div className="space-y-4">
          <h2 className="font-serif font-bold text-lg text-[#1C1917] flex items-center gap-2">
            <span>🔥 Live Preparation & Packaging Queue</span>
          </h2>

          {loading && !dashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-44 bg-white rounded-2xl border border-[#E7DFD5] animate-pulse" />
              ))}
            </div>
          ) : dashboard?.activeKitchenOrders?.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-[#E7DFD5] text-center text-xs text-[#78716C]">
              All kitchen orders are currently completed and dispatched!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard?.activeKitchenOrders?.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-[#E7DFD5] shadow-xs p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif font-bold text-base text-[#1C1917]">
                          {ticket.orderNumber}
                        </h4>
                        <span className="text-xs text-[#78716C]">{ticket.customerName}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#FAF4E8] text-[#D95338] border border-[#E7DFD5]">
                        {ticket.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#57534E] bg-[#FAF4E8] p-2.5 rounded-xl border border-[#E7DFD5] space-y-1">
                      <p className="font-semibold text-[#1C1917]">Slot: {ticket.deliverySlot}</p>
                      {ticket.notes && <p className="italic text-[11px] text-[#D95338]">Note: "{ticket.notes}"</p>}
                    </div>

                    <div className="space-y-1 text-xs">
                      {ticket.items.map((line: string, idx: number) => (
                        <div key={idx} className="font-medium text-[#1C1917]">
                          • {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advance State Button */}
                  <button
                    onClick={() => handleAdvanceStatus(ticket.id, ticket.status)}
                    className="w-full py-2.5 bg-[#D95338] hover:bg-[#C84B31] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {ticket.status === 'CONFIRMED'
                        ? 'Accept Ticket'
                        : ticket.status === 'ACCEPTED'
                        ? 'Start Cooking & Blast Chill'
                        : ticket.status === 'PREPARING'
                        ? 'Mark Packed & Ready'
                        : 'Dispatch to Driver'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory 86 Management */}
        <div className="bg-white p-6 rounded-3xl border border-[#E7DFD5] shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-lg text-[#1C1917]">
            Dish Availability & 86 Controls
          </h2>
          <p className="text-xs text-[#78716C]">
            One-click toggle to mark an authentic dish as sold out (86) or restocked across the live website and mobile web apps.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dishes.map((dish) => (
              <div
                key={dish.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[#E7DFD5] bg-[#FFFDF9]"
              >
                <div className="flex items-center gap-3">
                  <img src={dish.image} alt={dish.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <h5 className="font-bold text-xs text-[#1C1917]">{dish.name}</h5>
                    <span className="text-[10px] text-[#78716C]">${dish.basePrice.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleStock(dish.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    dish.isAvailable
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  {dish.isAvailable ? 'In Stock' : '86\'d (Sold Out)'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
