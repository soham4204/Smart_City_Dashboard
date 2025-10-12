// frontend/src/components/MapComponent.tsx
'use client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import { useEffect } from 'react';

// ... (interfaces and other functions remain the same) ...
interface Pole {
  id: string;
  location: [number, number];
  status: string;
  brightness: number;
  priority: string;
  group: string;
  manual_override: boolean;
}
interface Zone {
  id: string;
  name: string;
  color: string;
  poles: Pole[];
}

interface MapComponentProps {
  zones: Zone[];
  weatherCondition: string;
  onZoneClick: (zoneId: string) => void; // Add click handler prop
}

const PRIORITY_COLORS: { [key: string]: string } = {
  High: "239, 68, 68", // Red
  Medium: "249, 115, 22", // Orange
  Low: "59, 130, 246", // Blue
};

const getWeatherSVG = (condition: string): string => {
  const commonProps = `fill="none" stroke="white" stroke-width="2" strokeLinecap="round" strokeLinejoin="round"`;
  if (condition.includes('rain') || condition.includes('drizzle')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${commonProps}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M8 19v1m4-1v1m4-1v1"/></svg>`;
  }
  if (condition.includes('fog') || condition.includes('mist')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${commonProps}><path d="M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M22 21H2M12 15H2.5"/></svg>`;
  }
  if (condition.includes('cyclone') || condition.includes('storm') || condition.includes('thunder')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${commonProps}><path d="M21 4H3"/><path d="M18 8H6"/><path d="M15 12H9"/><path d="M12 16h.01"/></svg>`;
  }
  if (condition.includes('clear') || condition.includes('sunny')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${commonProps}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
  }
  if (condition.includes('cloudy') || condition.includes('overcast')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${commonProps}><path d="M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${commonProps}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
};

const createPoleIcon = (pole: Pole, weatherCondition: string) => {
    if (pole.status !== 'ONLINE') {
        return L.divIcon({
        html: `<div class="flex items-center justify-center w-6 h-6 bg-red-700 border-2 border-white rounded-full text-white font-bold shadow-lg">X</div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        });
    }

    const svgIcon = getWeatherSVG(weatherCondition);
    const brightness = pole.brightness / 100;
    const priorityColor = PRIORITY_COLORS[pole.priority] || PRIORITY_COLORS['Low'];
    const glowSize = 2 + Math.floor(brightness * 12);
    const opacity = 0.8 + brightness * 0.2;
    
    const iconHtml = `
        <div style="
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: rgba(${priorityColor}, 0.3);
        box-shadow: 0 0 ${glowSize}px 2px rgba(${priorityColor}, ${opacity * 0.7});
        opacity: ${opacity};
        transition: all 0.3s ease;
        ">
        ${svgIcon}
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14], 
    });
};

// A simple component to handle events on map layers
function ZoneEventHandlers({ zones, onZoneClick }: { zones: Zone[], onZoneClick: (zoneId: string) => void }) {
  zones.forEach(zone => {
    const poleLocations: L.LatLngExpression[] = zone.poles.map(p => p.location);
    if (poleLocations.length >= 3) {
      const polygon = L.polygon(poleLocations);
      polygon.on('click', () => {
        onZoneClick(zone.id);
      });
    }
  });
  return null;
}

export default function MapComponent({ zones, weatherCondition, onZoneClick }: MapComponentProps) {
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
      
      {/* Render zones as clickable polygons */}
      {zones.map(zone => {
          const poleLocations: L.LatLngExpression[] = zone.poles.map(p => p.location);
          if (poleLocations.length < 3) return null;

          const onlinePoles = zone.poles.filter(p => p.status === 'ONLINE');
          const avgBrightness = onlinePoles.length > 0 ? onlinePoles.reduce((acc, p) => acc + p.brightness, 0) / onlinePoles.length : 0;
          const zoneOpacity = 0.1 + (avgBrightness / 100) * 0.4;

          return (
            <Polygon 
              key={zone.id} 
              positions={poleLocations} 
              pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: zoneOpacity, weight: 1 }}
              eventHandlers={{
                click: () => {
                  onZoneClick(zone.id);
                },
              }}
            />
          );
      })}

      {/* Render poles with dynamic icons */}
      {zones.flatMap((zone) =>
        zone.poles.map((pole) => (
          <Marker
            key={pole.id}
            position={pole.location}
            icon={createPoleIcon(pole, weatherCondition)}
          >
            <Popup>
              <div className="p-1 text-gray-800">
                  <h3 className="font-bold text-base mb-1">{pole.id}</h3>
                  <p><b>Status:</b> {pole.status}</p>
                  <p><b>Brightness:</b> {pole.brightness}%</p>
                  <p><b>Priority:</b> {pole.priority}</p>
                  <p><b>Zone:</b> {pole.group}</p>
                  <p><b>Manual Override:</b> {pole.manual_override ? 'Yes' : 'No'}</p>
              </div>
            </Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  );
}