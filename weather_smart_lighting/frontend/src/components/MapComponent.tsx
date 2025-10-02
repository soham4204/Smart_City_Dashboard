// frontend/src/components/MapComponent.tsx
'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';

// Interfaces for our data props
interface Pole {
  id: string;
  location: [number, number];
  status: string;
  brightness: number;
  priority: string;
  group: string;
}
interface Zone {
  id: string;
  name: string;
  color: string;
  poles: Pole[];
}
interface MapComponentProps {
  zones: Zone[];
}

const PRIORITY_COLORS: { [key: string]: string } = {
  High: "239, 68, 68", // Red
  Medium: "249, 115, 22", // Orange
  Low: "59, 130, 246", // Blue
};

// --- Function to create dynamic, glowing icons ---
const createPoleIcon = (pole: Pole) => {
  if (pole.status !== 'ONLINE') {
    return L.divIcon({
      html: `<div class="flex items-center justify-center w-6 h-6 bg-red-700 border-2 border-white rounded-full text-white font-bold shadow-lg">X</div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  const brightness = pole.brightness / 100; // Normalize to 0-1
  const priorityColor = PRIORITY_COLORS[pole.priority] || PRIORITY_COLORS['Low'];
  
  const size = 12 + Math.floor(brightness * 12); // Size from 12px to 24px
  const opacity = 0.7 + brightness * 0.3; // Opacity from 70% to 100%
  const glowSize = Math.floor(brightness * 15);
  
  const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: rgba(${priorityColor}, ${opacity});
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, ${0.5 + brightness * 0.5});
      box-shadow: 0 0 ${glowSize}px 2px rgba(${priorityColor}, ${opacity * 0.7});
      transition: all 0.3s ease;
    ">
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '', // Important to override default Leaflet styles
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function MapComponent({ zones }: MapComponentProps) {
  const position: [number, number] = [19.076, 72.8777];

  return (
    <MapContainer
      center={position}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Render zones as semi-transparent polygons */}
      {zones.map(zone => {
          const poleLocations: L.LatLngExpression[] = zone.poles.map(p => p.location);
          if (poleLocations.length < 3) return null; // Need at least 3 points for a polygon

          const totalBrightness = zone.poles.reduce((acc, p) => acc + (p.status === 'ONLINE' ? p.brightness : 0), 0);
          const onlineCount = zone.poles.filter(p => p.status === 'ONLINE').length;
          const avgBrightness = onlineCount > 0 ? totalBrightness / onlineCount : 0;
          const zoneOpacity = 0.1 + (avgBrightness / 100) * 0.4; // Opacity from 10% to 50%

          return (
            <Polygon 
              key={zone.id} 
              positions={poleLocations} 
              pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: zoneOpacity, weight: 1 }}
            />
          );
      })}

      {/* Render poles with dynamic icons */}
      {zones.flatMap((zone) =>
        zone.poles.map((pole) => (
          <Marker
            key={pole.id}
            position={pole.location}
            icon={createPoleIcon(pole)}
          >
            <Popup>
              <div className="p-1 text-gray-800">
                <h3 className="font-bold text-base mb-1">{pole.id}</h3>
                <p><b>Status:</b> {pole.status}</p>
                <p><b>Brightness:</b> {pole.brightness}%</p>
                <p><b>Priority:</b> {pole.priority}</p>
                <p><b>Zone:</b> {pole.group}</p>
              </div>
            </Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  );
}