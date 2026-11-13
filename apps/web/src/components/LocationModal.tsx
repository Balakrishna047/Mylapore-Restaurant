'use client';

import React, { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { useToast } from '@/context/ToastContext';
import { DrawerSheet } from '@/components/ui/DrawerSheet';
import { Button } from '@/components/ui/Button';
import { MapPin, Navigation, Check, AlertCircle, Building2 } from 'lucide-react';

const POPULAR_HUBS = [
  { name: 'San Jose, CA', zip: '95127', label: 'South Bay Central' },
  { name: 'Santa Clara, CA', zip: '95051', label: 'Silicon Valley' },
  { name: 'Sunnyvale, CA', zip: '94086', label: 'South Bay' },
  { name: 'Fremont, CA', zip: '94538', label: 'East Bay' },
  { name: 'Pleasanton, CA', zip: '94566', label: 'Tri-Valley' },
  { name: 'San Francisco, CA', zip: '94103', label: 'SF Peninsula' },
];

export default function LocationModal() {
  const {
    location,
    isModalOpen,
    isLocating,
    locationError,
    closeModal,
    updateLocationByAddress,
    detectCurrentLocation,
    selectPickup,
  } = useLocation();

  const toast = useToast();
  const [inputAddress, setInputAddress] = useState(location.address);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAddress.trim()) return;
    setIsVerifying(true);
    try {
      await updateLocationByAddress(inputAddress.trim());
      toast.success('Location Updated', `Delivery set to ${inputAddress.trim()}`);
    } catch {
      toast.error('Location Check Failed', 'Please verify your address or zip code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectHub = async (hub: typeof POPULAR_HUBS[0]) => {
    const full = `${hub.name} ${hub.zip}`;
    setInputAddress(full);
    setIsVerifying(true);
    try {
      await updateLocationByAddress(full);
      toast.success('Hub Selected', `Set to ${hub.name}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <DrawerSheet
      isOpen={isModalOpen}
      onClose={closeModal}
      maxWidth="max-w-lg"
      title="Delivery Location & Hubs"
      description="Verify blast-chilled delivery coverage to your doorstep"
    >
      <div className="space-y-4 pt-1">
        {/* Current Location / Geolocation Button */}
        <Button
          type="button"
          onClick={detectCurrentLocation}
          isLoading={isLocating}
          variant="secondary"
          className="w-full text-xs font-semibold py-3 border-accent/40"
          leftIcon={<Navigation className="w-4 h-4 text-primary" />}
        >
          {isLocating ? 'Detecting GPS Coordinates...' : 'Use My Current Location (GPS)'}
        </Button>

        {locationError && (
          <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
            <span>{locationError}</span>
          </div>
        )}

        {/* Manual Input Form */}
        <form onSubmit={handleVerify} className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Street Address or Zip Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="e.g. 1244 S Capitol Ave, San Jose, CA 95127"
              className="flex-1 px-4 py-2.5 text-xs bg-surface text-foreground border border-border rounded-xl focus:outline-none focus:border-accent"
            />
            <Button
              type="submit"
              isLoading={isVerifying}
              variant="primary"
              size="sm"
              className="font-bold shrink-0"
            >
              Check Zone
            </Button>
          </div>
        </form>

        {/* Status Details Card */}
        <div className="p-4 rounded-2xl bg-surface-muted border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Delivery Coverage Status
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success/15 text-success border border-success/30">
              <Check className="w-3 h-3" />
              <span>{location.deliveryTypeLabel}</span>
            </span>
          </div>

          <div className="text-xs text-foreground space-y-1">
            <p className="font-semibold">{location.address}</p>
            {location.distanceKm !== undefined && (
              <p className="text-[11px] text-muted-foreground">
                Distance: <span className="font-bold text-foreground">{location.distanceKm} km</span> from {location.nearestKitchen}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-[11px]">
            <div>
              <span className="text-muted-foreground">Next Delivery Slot:</span>
              <p className="font-bold text-foreground">{location.availableSlots[0] || 'Today 12:30 PM'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Delivery Fee:</span>
              <p className="font-bold text-primary">
                ${location.estimatedFee.toFixed(2)}{' '}
                <span className="text-[10px] text-success font-normal">
                  (Free over ${location.freeDeliveryThreshold})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Hubs */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Popular Bay Area Delivery Hubs
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POPULAR_HUBS.map((hub) => (
              <button
                key={hub.zip}
                type="button"
                onClick={() => handleSelectHub(hub)}
                className="p-2.5 rounded-xl border border-border bg-surface hover:border-accent text-left transition-colors cursor-pointer"
              >
                <p className="text-xs font-bold text-foreground">{hub.name}</p>
                <span className="text-[10px] text-muted-foreground">{hub.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              selectPickup();
              closeModal();
              toast.info('Pickup Selected', 'Ready for kitchen pickup.');
            }}
            className="flex-1 text-xs"
          >
            Kitchen Pickup (Free)
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={closeModal}
            className="flex-1 text-xs font-bold"
          >
            Confirm & Save
          </Button>
        </div>
      </div>
    </DrawerSheet>
  );
}
