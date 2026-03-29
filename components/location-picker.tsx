'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function LocationMarker({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([latitude || 25.2621, longitude || 82.9910]);
  const center: [number, number] = [latitude || 25.2621, longitude || 82.9910]; // Default to IIT BHU

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter([lat, lng]);
        onLocationChange(lat, lng);
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  if (!mounted) {
    return (
      <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
        <p className="text-slate-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative">
      <MapContainer
        center={center}
        zoom={latitude && longitude ? 15 : 13}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {latitude && longitude && (
          <Marker position={[latitude, longitude]} />
        )}
        <LocationMarker onLocationChange={onLocationChange} />
        <RecenterMap lat={mapCenter[0]} lng={mapCenter[1]} />
      </MapContainer>
      
      {/* Move to Current Location Button */}
      <Button
        type="button"
        size="sm"
        onClick={handleGetCurrentLocation}
        disabled={gettingLocation}
        className="absolute top-2 right-2 z-[1000] gap-2 shadow-lg"
      >
        <Navigation className="h-4 w-4" />
        {gettingLocation ? 'Locating...' : 'My Location'}
      </Button>
    </div>
  );
}
