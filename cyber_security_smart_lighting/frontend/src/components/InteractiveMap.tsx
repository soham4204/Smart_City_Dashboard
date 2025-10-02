// src/app/components/layout/panels/InteractiveMap.tsx

'use client';

import { DashboardData } from '@/hooks/useWebsocket';
import React, { useEffect, useState } from 'react';
import { useDashboard } from '../app/StoreProvider';

// FIX: Declare variables with type 'any' to satisfy TypeScript
let MapContainer: any, TileLayer: any, Marker: any, Popup: any, L: any; 

if (typeof window !== 'undefined') {
  // Only import map components on the client side
  const leaflet = require('leaflet');
  const reactLeaflet = require('react-leaflet');
  
  MapContainer = reactLeaflet.MapContainer;
  TileLayer = reactLeaflet.TileLayer;
  Marker = reactLeaflet.Marker;
  Popup = reactLeaflet.Popup;
  L = leaflet;
  
  // FIX: Fix for Leaflet default marker icons (path issue in Next.js)
  if (L.Icon.Default.prototype) {
    (L.Icon.Default.prototype as any)._getIconUrl = function (name: string) {
      return `/leaflet/images/marker-${name}.png`;
    }; 
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
      iconUrl: '/leaflet/images/marker-icon.png',
      shadowUrl: '/leaflet/images/marker-shadow.png',
    });
  }
}

// Helper function to set custom icon colors based on status (Red or Green)
const getMarkerIcon = (status: 'SECURE' | 'RED') => {
    let color = status === 'RED' ? '#ef4444' : '#4ade80';
    
    if (typeof L === 'undefined') return null; 

    const iconHtml = `<div style="
        background-color: ${color}; 
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        border: 3px solid white;
        opacity: 0.9;
        box-shadow: 0 0 8px ${color};
    "></div>`;

    return L.divIcon({
        className: 'custom-div-icon',
        html: iconHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

export const InteractiveMap: React.FC = () => {
  const { data } = useDashboard();
  const [mapReady, setMapReady] = useState(false);
  
  // State check to only render the MapContainer after the window object is available
  useEffect(() => {
    if (typeof window !== 'undefined' && MapContainer) {
        setMapReady(true);
    }
  }, []);

  if (!mapReady) {
    return <div className="h-full w-full flex items-center justify-center text-gray-500">Loading Map...</div>;
  }
  
  const mumbaiCenter: [number, number] = [19.0760, 72.8777]; 

  return (
    <MapContainer 
      center={mumbaiCenter} 
      zoom={11} 
      scrollWheelZoom={true}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {data.mapData.map((unit: DashboardData['mapData'][number]) => {
        const icon = getMarkerIcon(unit.status);
        if (!icon) return null; 
        
        return (
          <Marker 
            key={unit.id} 
            position={[unit.lat, unit.lng]} 
            icon={icon}
          >
            <Popup>
              <div className="font-bold">{unit.id} ({unit.zoneType})</div>
              <div>Status: <span className={unit.status === 'RED' ? 'text-red-500' : 'text-green-500'}>{unit.status.toUpperCase()}</span></div>
            </Popup>
          </Marker>
        );
      })}

      <div className="absolute top-2 right-2 z-[1000] p-3 bg-gray-700 text-white rounded-lg shadow-md">
        Select a zone to see details.
      </div>
    </MapContainer>
  );
};