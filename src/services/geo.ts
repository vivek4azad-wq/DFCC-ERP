/**
 * GPS Geolocation & Navigation Utilities
 * DFCCIL IMSD SMUN Unit
 */

export const CORRIDOR_BOUNDS = {
  minLat: 29.5000,
  maxLat: 31.5000,
  minLon: 75.8000,
  maxLon: 78.0000
};

export function validateCoordinates(lat: number | null | undefined, lon: number | null | undefined): boolean {
  if (lat === null || lon === null || lat === undefined || lon === undefined) return false;
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return (
    lat >= CORRIDOR_BOUNDS.minLat &&
    lat <= CORRIDOR_BOUNDS.maxLat &&
    lon >= CORRIDOR_BOUNDS.minLon &&
    lon <= CORRIDOR_BOUNDS.maxLon
  );
}

export function buildNavigationUri(lat: number, lon: number, title = ''): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`Invalid navigation coordinates: lat=${lat}, lon=${lon}`);
  }
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const dest = `&destination=${lat},${lon}`;
  const label = title ? `&destination_place_id=${encodeURIComponent(title)}` : '';
  return `${baseUrl}${dest}${label}`;
}

export function buildGeoUri(lat: number, lon: number, label = ''): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`Invalid geo coordinates: lat=${lat}, lon=${lon}`);
  }
  const q = label ? `${lat},${lon}(${encodeURIComponent(label)})` : `${lat},${lon}`;
  return `geo:${lat},${lon}?q=${q}`;
}

import { Capacitor } from '@capacitor/core';

export function launchNavigation(lat: number, lon: number, label = ''): void {
  const url = buildNavigationUri(lat, lon, label);
  if (typeof window !== 'undefined') {
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
