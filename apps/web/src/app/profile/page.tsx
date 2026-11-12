'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { User, MapPin, Mail, Phone, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="font-serif font-bold text-2xl text-[#1C1917] mb-2">Please sign in</h2>
        <Link href="/auth/login" className="px-5 py-2 bg-[#D95338] text-white text-xs font-bold rounded-full">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F0] py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1C1917]">
            My Account
          </h1>
          <button
            onClick={logout}
            className="px-4 py-2 border border-[#E7DFD5] bg-white rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
          >
            Sign Out
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E7DFD5] shadow-xs space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C8851A] text-white flex items-center justify-center text-xl font-serif font-bold">
              {user.name[0]}
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1C1917]">{user.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF4E8] text-[#D95338] border border-[#E7DFD5]">
                {user.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E7DFD5] text-xs">
            <div className="flex items-center gap-2 text-[#57534E]">
              <Mail className="w-4 h-4 text-[#C8851A]" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-[#57534E]">
              <Phone className="w-4 h-4 text-[#C8851A]" />
              <span>{user.phone || '(408) 555-0199'}</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/orders"
            className="p-5 bg-white rounded-2xl border border-[#E7DFD5] shadow-xs hover:border-[#C8851A] transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF4E8] flex items-center justify-center text-[#D95338]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#1C1917]">Order History & Live Tracking</h4>
              <p className="text-[11px] text-[#78716C]">View receipts, reschedule, or reorder dishes</p>
            </div>
          </Link>

          <Link
            href="/support"
            className="p-5 bg-white rounded-2xl border border-[#E7DFD5] shadow-xs hover:border-[#C8851A] transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF4E8] flex items-center justify-center text-[#C8851A]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#1C1917]">Customer Care & FAQs</h4>
              <p className="text-[11px] text-[#78716C]">Salesforce Service Cloud Support & Case History</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
