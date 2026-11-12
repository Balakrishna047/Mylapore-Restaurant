'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Phone, Mail, HelpCircle, Send, Check } from 'lucide-react';

export default function SupportPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.createSupportTicket({
        customerName: user ? user.name : 'Customer',
        customerEmail: user ? user.email : 'customer@example.com',
        subject,
        description,
        priority
      });
      setTicketResult(res);
      setSubject('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit support case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1C1917]">
            Customer Support & Service Cloud
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] max-w-xl mx-auto">
            Need assistance with a delivery, dietary inquiries, or order adjustments? Our Service Cloud team and dedicated representatives are here to help.
          </p>
        </div>

        {/* Quick Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-xs text-center space-y-2">
            <Phone className="w-5 h-5 text-[#D95338] mx-auto" />
            <h4 className="font-bold text-xs text-[#1C1917]">Call Our Kitchen</h4>
            <p className="text-xs font-semibold text-[#57534E]">(925) 238-3736</p>
            <span className="text-[10px] text-[#A8A29E]">11:00 AM - 10:00 PM PST</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-xs text-center space-y-2">
            <Mail className="w-5 h-5 text-[#C8851A] mx-auto" />
            <h4 className="font-bold text-xs text-[#1C1917]">Email Support</h4>
            <p className="text-xs font-semibold text-[#57534E]">support@mylaporeexpress.com</p>
            <span className="text-[10px] text-[#A8A29E]">Response within 2 hours</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-xs text-center space-y-2">
            <MessageSquare className="w-5 h-5 text-[#15803D] mx-auto" />
            <h4 className="font-bold text-xs text-[#1C1917]">Agentforce AI</h4>
            <p className="text-xs font-semibold text-[#57534E]">24/7 Live Concierge</p>
            <span className="text-[10px] text-[#A8A29E]">Instant resolution</span>
          </div>
        </div>

        {/* Salesforce Service Cloud Ticket Form */}
        <div className="bg-white p-8 rounded-3xl border border-[#E7DFD5] shadow-md space-y-6">
          <div>
            <h2 className="font-serif font-bold text-xl text-[#1C1917]">
              Submit a Salesforce Service Cloud Support Case
            </h2>
            <p className="text-xs text-[#78716C] mt-1">
              Synchronized automatically with our enterprise CRM for SLA escalation and resolution.
            </p>
          </div>

          {ticketResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Support Case Logged Successfully!</span>
              </div>
              <p>Reference Ticket ID: <strong>{ticketResult.id}</strong></p>
              <p>Salesforce Case Reference: <strong>{ticketResult.salesforceCaseId}</strong></p>
            </div>
          )}

          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#44403C] mb-1">Order # (If applicable)</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. MYL-2026-1001"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF4E8]/50 border border-[#E7DFD5] rounded-xl focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#44403C] mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF4E8]/50 border border-[#E7DFD5] rounded-xl bg-white"
                >
                  <option value="NORMAL">Normal Inquiry</option>
                  <option value="HIGH">Delivery Delay / Wrong Dish</option>
                  <option value="URGENT">Allergen / Food Safety Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#44403C] mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Question about blast-chilling reheating instructions"
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF4E8]/50 border border-[#E7DFD5] rounded-xl focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#44403C] mb-1">Message Description</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe your question or issue in detail..."
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF4E8]/50 border border-[#E7DFD5] rounded-xl focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 bg-[#D95338] hover:bg-[#C84B31] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <span>Submitting Case...</span> : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Support Case</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* FAQs */}
        <div className="bg-white p-8 rounded-3xl border border-[#E7DFD5] shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#1C1917] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#C8851A]" />
            <span>Frequently Asked Questions</span>
          </h3>
          <div className="space-y-3 text-xs divide-y divide-[#E7DFD5]">
            <div className="pt-3 space-y-1">
              <h5 className="font-bold text-[#1C1917]">What does "Blast-Chilled" mean?</h5>
              <p className="text-[#57534E] leading-relaxed">
                Immediately after cooking in small handcrafted batches, our dishes are rapidly brought down to 38°F using professional blast-chillers. This locks in aroma, crispness, and prevents bacterial growth without a single pinch of preservatives.
              </p>
            </div>
            <div className="pt-3 space-y-1">
              <h5 className="font-bold text-[#1C1917]">How do I reheat Potato Kara Kari and Curries?</h5>
              <p className="text-[#57534E] leading-relaxed">
                For dry fries (Potato Kara Kari, Poriyals), empty into a stovetop pan on medium heat for 3-4 minutes to restore grandma-style crispness. For curries and rice dishes, microwave for 90-120 seconds or simmer gently on the stovetop.
              </p>
            </div>
            <div className="pt-3 space-y-1">
              <h5 className="font-bold text-[#1C1917]">What is your refund policy on cancelled orders?</h5>
              <p className="text-[#57534E] leading-relaxed">
                Orders cancelled before kitchen preparation starts receive a 100% immediate refund. If the order has been accepted into active cooking queues, a 50% refund is issued. Once blast-chilling and packaging has completed, cancellations can no longer be processed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
