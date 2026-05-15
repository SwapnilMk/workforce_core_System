'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPreviewProps {
  center: [number, number];
  userLocation?: [number, number];
  radius: number;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  return null;
}

export default function MapPreview({ center, userLocation, radius }: MapPreviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[300px] w-full bg-muted animate-pulse rounded-xl" />;

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 border-white/10 shadow-inner">
      {/* @ts-ignore */}
      <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        {/* @ts-ignore */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ChangeView center={userLocation || center} />
        
        {/* Office Circle */}
        {/* @ts-ignore */}
        <Circle 
          center={center} 
          radius={radius} 
          pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.2, color: '#3b82f6', weight: 1 }} 
        />
        
        {/* User Marker */}
        {userLocation && (
          <Marker position={userLocation}>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
