'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await register({ name, email, phone, password });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#E7DFD5] shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#C8851A] flex items-center justify-center text-white text-2xl mx-auto shadow-xs">
            🛕
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#1C1917]">Create an Account</h2>
          <p className="text-xs text-[#78716C]">
            Experience blast-chilled, authentic South Indian delicacies delivered with care.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#44403C] mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anand Krishnan"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF4E8]/50 border border-[#E7DFD5] rounded-xl focus:outline-hidden focus:border-[#C8851A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#44403C] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anand@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF4E8]/50 border border-[#E7DFD5] rounded-xl focus:outline-hidden focus:border-[#C8851A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#44403C] mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(925) 238-3736"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF4E8]/50 border border-[#E7DFD5] rounded-xl focus:outline-hidden focus:border-[#C8851A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#44403C] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF4E8]/50 border border-[#E7DFD5] rounded-xl focus:outline-hidden focus:border-[#C8851A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D95338] hover:bg-[#C84B31] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <span>Creating Account...</span> : (
              <>
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-[#78716C] pt-2">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-[#D95338] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
