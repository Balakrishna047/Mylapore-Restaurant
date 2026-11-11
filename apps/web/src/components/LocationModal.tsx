'use client';

import React, { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { MapPin, Navigation, X, Check, AlertCircle, Building2, ShieldCheck, Clock } from 'lucide-react';

const POPULAR_HUBS = [
  { name: 'San Jose, CA', zip: '95127', label: 'South Bay Central' },
  { name: 'Santa Clara, CA', zip: '95051', label: 'Silicon Valley' },
  { name: 'Sunnyvale, CA', zip: '94086', label: 'South Bay' },
  { name: 'Fremont, CA', zip: '94538', label: 'East Bay' },
  { name: 'Pleasanton, CA', zip: '94566', label: 'Tri-Valley' },
  { name: 'San Francisco, CA', zip: '94103', label: 'SF Peninsula' }
];

export default function LocationModal() {
  const {
    location,
    orderType,
    isModalOpen,
    isLocating,
    locationError,
    closeModal,
    updateLocationByAddress,
    detectCurrentLocation,
    selectPickup
  } = useLocation();

  const [inputAddress, setInputAddress] = useState(location.address);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isModalOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAddress.trim()) return;
    setIsVerifying(true);
    await updateLocationByAddress(inputAddress.trim());
    setIsVerifying(false);
  };

  const handleSelectHub = async (hub: typeof POPULAR_HUBS[0]) => {
    const full = `${hub.name} ${hub.zip}`;
    setInputAddress(full);
    setIsVerifying(true);
    await updateLocationByAddress(full);
    setIsVerifying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E7DFD5] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#E7DFD5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF4E8] border border-[#C8851A]/30 flex items-center justify-center text-[#D95338]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1C1917]">Delivery Location & Hubs</h3>
              <p className="text-[11px] text-[#78716C]">Verify blast-chilled delivery to your door</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-[#FAF4E8] hover:bg-[#EAE2D5] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Location / Geolocation Button */}
        <div className="mt-5 space-y-4">
          <button
            onClick={detectCurrentLocation}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-[#C8851A]/50 bg-[#FAF4E8] hover:bg-[#F3EAD9] text-[#1C1917] font-semibold text-xs transition-all shadow-xs group"
          >
            <Navigation className={`w-4 h-4 text-[#D95338] ${isLocating ? 'animate-spin' : 'group-hover:rotate-45'} transition-transform`} />
            <span>{isLocating ? 'Detecting GPS Coordinates...' : 'Use My Current Location (GPS)'}</span>
          </button>

          {locationError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Manual Input Form */}
          <form onSubmit={handleVerify} className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              Street Address or Zip Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                placeholder="e.g. 1244 S Capitol Ave, San Jose, CA 95127"
                className="flex-1 px-4 py-2.5 text-xs bg-white border border-[#E7DFD5] rounded-xl focus:outline-hidden focus:border-[#C8851A] focus:ring-1 focus:ring-[#C8851A]"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="px-5 py-2.5 bg-[#1C1917] hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
              >
                {isVerifying ? 'Checking...' : 'Check Zone'}
              </button>
            </div>
          </form>

          {/* Status Details Card */}
          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E7DFD5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                Delivery Coverage Status
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Check className="w-3 h-3" />
                <span>{location.deliveryTypeLabel}</span>
              </span>
            </div>

            <div className="text-xs text-[#1C1917] space-y-1">
              <p className="font-semibold">{location.address}</p>
              {location.distanceKm !== undefined && (
                <p className="text-[11px] text-[#78716C]">
                  Distance: <span className="font-bold text-[#1C1917]">{location.distanceKm} km</span> from {location.nearestKitchen}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7DFD5] text-[11px]">
              <div>
                <span className="text-[#78716C]">Next Delivery Slot:</span>
                <p className="font-bold text-[#1C1917]">{location.availableSlots[0] || 'Today 12:30 PM'}</p>
              </div>
              <div>
                <span className="text-[#78716C]">Delivery Fee:</span>
                <p className="font-bold text-[#D95338]">
                  ${location.estimatedFee.toFixed(2)}{' '}
                  <span className="text-[10px] text-emerald-700 font-normal">
                    (Free over ${location.freeDeliveryThreshold})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Hubs */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              Popular Bay Area Hubs
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_HUBS.map((hub) => (
                <button
                  key={hub.zip}
                  type="button"
                  onClick={() => handleSelectHub(hub)}
                  className="p-2.5 rounded-xl border border-[#E7DFD5] bg-white hover:bg-[#FAF4E8] hover:border-[#C8851A] text-left transition-colors"
                >
                  <p className="text-xs font-bold text-[#1C1917]">{hub.name}</p>
                  <span className="text-[10px] text-[#78716C]">{hub.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-[#E7DFD5] flex gap-3">
          <button
            type="button"
            onClick={() => {
              selectPickup();
              closeModal();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl border border-[#E7DFD5] bg-white hover:bg-neutral-50 text-xs font-semibold text-[#1C1917] transition-colors"
          >
            Select Kitchen Pickup (Free)
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#D95338] hover:bg-[#C84B31] text-white font-bold text-xs shadow-xs transition-colors"
          >
            Confirm & Save Location
          </button>
        </div>
      </div>
    </div>
  );
}
