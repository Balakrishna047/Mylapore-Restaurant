import { Injectable } from '@nestjs/common';

export interface LocationCheckDto {
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface DeliveryEligibilityResult {
  isEligible: boolean;
  deliveryType: 'LOCAL_EXPRESS_BLAST_CHILLED' | 'NEXT_DAY_CHILLED' | 'NATIONWIDE_AIR' | 'UNSUPPORTED';
  deliveryTypeLabel: string;
  estimatedFee: number;
  freeDeliveryThreshold: number;
  distanceKm?: number;
  nearestKitchen: string;
  detectedCity: string;
  detectedState: string;
  postalCode: string;
  availableSlots: string[];
  freshnessGuarantee: string;
}

@Injectable()
export class DeliveryService {
  // Mylapore Express Central Delivery Hub (San Jose, Silicon Valley, CA)
  private readonly KITCHEN_LAT = 37.3382;
  private readonly KITCHEN_LNG = -121.8863;
  private readonly KITCHEN_NAME = 'Mylapore Express Central Bay Area Kitchen (San Jose, CA)';

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  checkEligibility(dto: LocationCheckDto): DeliveryEligibilityResult {
    let distanceKm: number | undefined;
    let zip = dto.zipCode ? dto.zipCode.trim() : '';

    // If coordinates are provided, compute distance
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      distanceKm = this.calculateDistance(
        this.KITCHEN_LAT,
        this.KITCHEN_LNG,
        dto.latitude,
        dto.longitude
      );
      if (!zip) {
        // Approximate zip based on distance
        zip = distanceKm <= 50 ? '95127' : '94103';
      }
    }

    // Default sample zip if none provided
    if (!zip && dto.address) {
      const match = dto.address.match(/\b\d{5}\b/);
      if (match) {
        zip = match[0];
      }
    }

    if (!zip) {
      zip = '95127';
    }

    const zipNum = parseInt(zip, 10);
    const isBayArea = (zipNum >= 94000 && zipNum <= 95999) || (distanceKm !== undefined && distanceKm <= 90);
    const isCalifornia = zipNum >= 90000 && zipNum <= 96199;
    const isUSMainland = zipNum >= 10000 && zipNum <= 99999;

    let deliveryType: DeliveryEligibilityResult['deliveryType'] = 'UNSUPPORTED';
    let deliveryTypeLabel = 'Delivery Not Available';
    let estimatedFee = 0;
    let city = 'San Jose';
    let state = 'CA';

    if (isBayArea) {
      deliveryType = 'LOCAL_EXPRESS_BLAST_CHILLED';
      deliveryTypeLabel = 'Same-Day Blast-Chilled Delivery';
      estimatedFee = 4.99;
      city = zipNum >= 95100 && zipNum <= 95199 ? 'San Jose' : zipNum >= 94085 && zipNum <= 94089 ? 'Sunnyvale' : zipNum >= 94536 && zipNum <= 94555 ? 'Fremont' : 'San Francisco Bay Area';
      state = 'CA';
    } else if (isCalifornia) {
      deliveryType = 'NEXT_DAY_CHILLED';
      deliveryTypeLabel = 'Next-Day Chilled Insulated Courier';
      estimatedFee = 9.99;
      city = 'California';
      state = 'CA';
    } else if (isUSMainland) {
      deliveryType = 'NATIONWIDE_AIR';
      deliveryTypeLabel = 'Nationwide Overnight Cold Shipping';
      estimatedFee = 14.99;
      city = 'United States';
      state = 'US';
    }

    const availableSlots = [
      'Today, 12:30 PM - 1:30 PM (Lunch Delivery)',
      'Today, 6:00 PM - 7:30 PM (Dinner Delivery)',
      'Tomorrow, 11:30 AM - 1:00 PM',
      'Tomorrow, 5:30 PM - 7:00 PM'
    ];

    return {
      isEligible: deliveryType !== 'UNSUPPORTED',
      deliveryType,
      deliveryTypeLabel,
      estimatedFee,
      freeDeliveryThreshold: 45.0,
      distanceKm,
      nearestKitchen: this.KITCHEN_NAME,
      detectedCity: city,
      detectedState: state,
      postalCode: zip,
      availableSlots,
      freshnessGuarantee: 'Pre-cooled to 38°F with food-grade dry cold packs in thermal insulated tote bags.'
    };
  }

  getDeliveryZones() {
    return [
      {
        zone: 'South Bay',
        cities: ['San Jose', 'Santa Clara', 'Sunnyvale', 'Cupertino', 'Campbell', 'Saratoga', 'Los Gatos', 'Milpitas'],
        deliveryType: 'Same-Day Courier',
        minimumOrder: 15.0,
        freeDeliveryAt: 45.0
      },
      {
        zone: 'East Bay',
        cities: ['Fremont', 'Newark', 'Union City', 'Hayward', 'Dublin', 'Pleasanton', 'San Ramon'],
        deliveryType: 'Same-Day Courier',
        minimumOrder: 15.0,
        freeDeliveryAt: 45.0
      },
      {
        zone: 'Peninsula & SF',
        cities: ['Palo Alto', 'Mountain View', 'San Mateo', 'Redwood City', 'San Francisco'],
        deliveryType: 'Same-Day Courier',
        minimumOrder: 25.0,
        freeDeliveryAt: 55.0
      },
      {
        zone: 'Nationwide US',
        cities: ['All 48 Continental US States'],
        deliveryType: 'Overnight Cold Shipping',
        minimumOrder: 40.0,
        freeDeliveryAt: 100.0
      }
    ];
  }
}
