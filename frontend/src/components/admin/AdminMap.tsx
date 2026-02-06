'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useMemo } from 'react';

// --- Components ---

// 1. Handle Map Clicks (to select coordinates)
function LocationSelector({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <CircleMarker 
      center={position} 
      radius={8} 
      pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.8 }} // Green dot for new selection
    >
      <Popup className="custom-popup">
        <div className="text-xs font-bold text-green-400">New Pole Location</div>
      </Popup>
    </CircleMarker>
  );
}

// 2. Auto-Fit Map Bounds to show all zones
function FitBounds({ zones }: { zones: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (zones.length > 0) {
      const bounds = L.latLngBounds([]);
      let hasPoints = false;
      zones.forEach(z => {
        z.poles.forEach((p: any) => {
          bounds.extend([p.latitude, p.longitude]);
          hasPoints = true;
        });
      });
      if (hasPoints && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [zones, map]);
  return null;
}

// --- Main Map Component ---

interface AdminMapProps {
  zones: any[];
  onLocationSelect: (lat: number, lng: number) => void;
  onZoneSelect: (zoneId: string) => void;
}

export default function AdminMap({ zones, onLocationSelect, onZoneSelect }: AdminMapProps) {
  const defaultCenter: [number, number] = [19.0760, 72.8777]; // Mumbai
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-96 w-full bg-gray-900 rounded-xl animate-pulse flex items-center justify-center text-gray-500">Loading Map...</div>;

  return (
    <div className="h-96 w-full rounded-xl overflow-hidden border border-gray-700 shadow-2xl relative z-0">
      
      {/* Key forces fresh render on mount to prevent "Map container reused" error */}
      <MapContainer 
        key="admin-map"
        center={defaultCenter} 
        zoom={11} 
        style={{ height: '100%', width: '100%', background: '#111827' }}
      >
        {/* Dark Mode Tiles (Matches Dashboard Theme) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds zones={zones} />
        <LocationSelector onLocationSelect={onLocationSelect} />

        {/* Render Zones and Poles */}
        {zones.map(zone => {
          // Calculate Zone Center
          let centerLat = 0, centerLng = 0;
          if (zone.poles.length > 0) {
            zone.poles.forEach((p: any) => { centerLat += p.latitude; centerLng += p.longitude; });
            centerLat /= zone.poles.length;
            centerLng /= zone.poles.length;
          }

          const zoneColor = zone.color || '#3b82f6';

          return (
            <div key={zone.id}>
              {/* ZONE AREA (Glowing Circle) */}
              {zone.poles.length > 0 && (
                <Circle
                  center={[centerLat, centerLng]}
                  pathOptions={{ 
                    color: zoneColor, 
                    fillColor: zoneColor, 
                    fillOpacity: 0.1, // Subtle glow
                    weight: 1,
                    dashArray: '5, 10' // Dashed line for technical look
                  }}
                  radius={1500} 
                  eventHandlers={{ click: () => onZoneSelect(zone.id) }}
                />
              )}

              {/* POLES (LED Dots) */}
              {zone.poles.map((pole: any) => (
                <CircleMarker 
                  key={pole.id} 
                  center={[pole.latitude, pole.longitude]} 
                  radius={6} // Small LED dot size
                  pathOptions={{
                    color: '#ffffff',
                    weight: 1,
                    fillColor: pole.status === 'ONLINE' ? zoneColor : '#ef4444', // Zone color if online, Red if offline
                    fillOpacity: 1
                  }}
                  eventHandlers={{
                    click: () => {
                      onZoneSelect(zone.id);
                      onLocationSelect(pole.latitude, pole.longitude);
                    }
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 min-w-[120px]">
                      <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">Pole ID</div>
                      <div className="text-sm font-mono font-bold text-white mb-2">{pole.id}</div>
                      
                      <div className="flex justify-between items-center border-t border-gray-700 pt-2">
                        <span className="text-xs text-gray-400">Status</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pole.status === 'ONLINE' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                          {pole.status}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </div>
          );
        })}

      </MapContainer>
      
      {/* Styles for Dark Glassmorphism Popups */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: rgba(17, 24, 39, 0.95) !important; /* Gray-900 */
          color: white !important;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(55, 65, 81, 1); /* Gray-700 */
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        .leaflet-popup-content { margin: 8px; }
        .leaflet-container { background: #111827; font-family: sans-serif; }
      `}</style>
      
      <div className="absolute top-4 right-4 bg-gray-900/90 text-[10px] text-gray-400 px-3 py-1.5 rounded border border-gray-700 z-[1000] pointer-events-none shadow-xl uppercase tracking-wider">
        Click map to set coordinates
      </div>
    </div>
  );
}