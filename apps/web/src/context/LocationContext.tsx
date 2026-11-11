'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface LocationInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isEligible: boolean;
  deliveryType: string;
  deliveryTypeLabel: string;
  estimatedFee: number;
  freeDeliveryThreshold: number;
  distanceKm?: number;
  nearestKitchen: string;
  availableSlots: string[];
}

interface LocationContextType {
  location: LocationInfo;
  orderType: 'DELIVERY' | 'PICKUP';
  isModalOpen: boolean;
  isLocating: boolean;
  locationError: string | null;
  openModal: () => void;
  closeModal: () => void;
  setOrderType: (type: 'DELIVERY' | 'PICKUP') => void;
  updateLocationByAddress: (address: string) => Promise<void>;
  detectCurrentLocation: () => Promise<void>;
  selectPickup: () => void;
}

const DEFAULT_LOCATION: LocationInfo = {
  address: '1244 S Capitol Ave, San Jose, CA 95127',
  city: 'San Jose',
  state: 'CA',
  zipCode: '95127',
  isEligible: true,
  deliveryType: 'LOCAL_EXPRESS_BLAST_CHILLED',
  deliveryTypeLabel: 'Same-Day Blast-Chilled Delivery',
  estimatedFee: 4.99,
  freeDeliveryThreshold: 45.0,
  nearestKitchen: 'Mylapore Express Central Bay Area Kitchen (San Jose, CA)',
  availableSlots: [
    'Today, 12:30 PM - 1:30 PM (Lunch Delivery)',
    'Today, 6:00 PM - 7:30 PM (Dinner Delivery)'
  ]
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Load saved location from localStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('mylapore_location');
      if (saved) {
        setLocation(JSON.parse(saved));
      }
      const savedType = localStorage.getItem('mylapore_order_type');
      if (savedType === 'PICKUP' || savedType === 'DELIVERY') {
        setOrderType(savedType);
      }
    } catch (e) {
      console.warn('Failed to parse saved location:', e);
    }
  }, []);

  // Save to localStorage whenever location changes
  const persistLocation = (newLoc: LocationInfo, type: 'DELIVERY' | 'PICKUP' = orderType) => {
    setLocation(newLoc);
    setOrderType(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mylapore_location', JSON.stringify(newLoc));
      localStorage.setItem('mylapore_order_type', type);
      localStorage.setItem('mylapore_delivery_address', newLoc.address);
      window.dispatchEvent(new Event('mylapore_location_changed'));
    }
  };

  const updateLocationByAddress = async (address: string) => {
    setLocationError(null);
    try {
      const zipMatch = address.match(/\b\d{5}\b/);
      const zipCode = zipMatch ? zipMatch[0] : '';
      const res = await api.checkDeliveryLocation({ address, zipCode });

      const newLocation: LocationInfo = {
        address,
        city: res.detectedCity,
        state: res.detectedState,
        zipCode: res.postalCode,
        isEligible: res.isEligible,
        deliveryType: res.deliveryType,
        deliveryTypeLabel: res.deliveryTypeLabel,
        estimatedFee: res.estimatedFee,
        freeDeliveryThreshold: res.freeDeliveryThreshold,
        distanceKm: res.distanceKm,
        nearestKitchen: res.nearestKitchen,
        availableSlots: res.availableSlots
      };

      persistLocation(newLocation, 'DELIVERY');
    } catch (err: any) {
      console.error('Failed to update address:', err);
      setLocationError(err.message || 'Could not verify delivery zone.');
    }
  };

  const detectCurrentLocation = async () => {
    setIsLocating(true);
    setLocationError(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.checkDeliveryLocation({ latitude, longitude });

          const detectedAddress = `${res.detectedCity}, ${res.detectedState} ${res.postalCode}`;

          const newLocation: LocationInfo = {
            address: detectedAddress,
            city: res.detectedCity,
            state: res.detectedState,
            zipCode: res.postalCode,
            isEligible: res.isEligible,
            deliveryType: res.deliveryType,
            deliveryTypeLabel: res.deliveryTypeLabel,
            estimatedFee: res.estimatedFee,
            freeDeliveryThreshold: res.freeDeliveryThreshold,
            distanceKm: res.distanceKm,
            nearestKitchen: res.nearestKitchen,
            availableSlots: res.availableSlots
          };

          persistLocation(newLocation, 'DELIVERY');
        } catch (err: any) {
          console.error('Geolocation lookup failed:', err);
          setLocationError('Unable to resolve delivery zone from GPS coordinates.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please enter your ZIP code or address manually.');
        } else {
          setLocationError('Unable to detect current GPS location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const selectPickup = () => {
    const pickupLoc: LocationInfo = {
      ...location,
      address: 'Pickup: Mylapore Express Central Kitchen (San Jose, CA)',
      deliveryTypeLabel: 'Direct Kitchen Pickup (Free)',
      estimatedFee: 0
    };
    persistLocation(pickupLoc, 'PICKUP');
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        orderType,
        isModalOpen,
        isLocating,
        locationError,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        setOrderType,
        updateLocationByAddress,
        detectCurrentLocation,
        selectPickup
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
