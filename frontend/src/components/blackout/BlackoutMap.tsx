'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PowerZone {
  id: string;
  name: string;
  zone_type: string;
  priority: string;
  power_state: string;
  current_load_mw: number;
  capacity_mw: number;
  backup_available: boolean;
  backup_capacity_mw: number;
  backup_duration_hours: number;
  affected_population: number;
  critical_facilities: string[];
  power_allocation_percent: number;
  lat: number;
  lon: number;
}

interface BlackoutIncident {
  incident_id: string;
  severity: string;
  affected_zones: string[];
}

interface BlackoutMapProps {
  zones: PowerZone[];
  selectedZone: PowerZone | null;
  activeIncidents: BlackoutIncident[];
  onZoneSelect: (zone: PowerZone) => void;
}

const getPowerStateColor = (state: string) => {
  switch (state) {
    case 'FULL_POWER': return '#10b981'; // green
    case 'REDUCED_POWER': return '#f59e0b'; // yellow
    case 'BACKUP_POWER': return '#ef4444'; // red
    case 'NO_POWER': return '#7f1d1d'; // dark red
    default: return '#6b7280';
  }
};

const getPowerStateLabel = (state: string) => {
  return state.replace('_', ' ');
};

export default function BlackoutMap({ zones, selectedZone, activeIncidents, onZoneSelect }: BlackoutMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.CircleMarker }>({});

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      mapRef.current = L.map('blackout-map').setView([19.076, 72.8777], 11);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add zone markers
    zones.forEach(zone => {
      if (mapRef.current) {
        const color = getPowerStateColor(zone.power_state);
        const isSelected = selectedZone?.id === zone.id;
        const isAffected = activeIncidents.some(inc => inc.affected_zones.includes(zone.id));
        
        const marker = L.circleMarker([zone.lat, zone.lon], {
          radius: isSelected ? 18 : 14,
          fillColor: color,
          color: isSelected ? '#ffffff' : isAffected ? '#ef4444' : color,
          weight: isSelected ? 4 : isAffected ? 3 : 2,
          opacity: 1,
          fillOpacity: zone.power_state === 'NO_POWER' ? 0.9 : 0.7
        }).addTo(mapRef.current);

        // Popup content
        const loadFactor = ((zone.current_load_mw / zone.capacity_mw) * 100).toFixed(1);
        const popupContent = `
          <div class="bg-gray-800 text-white p-3 rounded-lg min-w-[250px]">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-base">${zone.name}</h3>
              <span class="px-2 py-1 rounded text-xs font-bold" style="background-color: ${color}30; color: ${color};">
                ${getPowerStateLabel(zone.power_state)}
              </span>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between border-b border-gray-700 pb-1">
                <span class="text-gray-400">Priority:</span>
                <span class="font-semibold ${
                  zone.priority === 'CRITICAL' ? 'text-red-400' :
                  zone.priority === 'HIGH' ? 'text-orange-400' :
                  zone.priority === 'MEDIUM' ? 'text-yellow-400' :
                  'text-gray-400'
                }">${zone.priority}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-400">Power Allocation:</span>
                <span class="font-semibold text-yellow-400">${zone.power_allocation_percent.toFixed(0)}%</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-400">Load:</span>
                <span class="text-white">${zone.current_load_mw.toFixed(1)} / ${zone.capacity_mw.toFixed(1)} MW</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-400">Load Factor:</span>
                <span class="${loadFactor > 90 ? 'text-red-400' : loadFactor > 70 ? 'text-yellow-400' : 'text-green-400'}">${loadFactor}%</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-400">Population:</span>
                <span class="text-white">${zone.affected_population.toLocaleString()}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-400">Backup Power:</span>
                <span class="${zone.backup_available ? 'text-green-400' : 'text-red-400'}">
                  ${zone.backup_available ? `${zone.backup_capacity_mw.toFixed(0)} MW` : 'None'}
                </span>
              </div>
              
              ${zone.backup_available ? `
                <div class="flex justify-between">
                  <span class="text-gray-400">Backup Duration:</span>
                  <span class="text-green-400">${zone.backup_duration_hours.toFixed(0)}h</span>
                </div>
              ` : ''}
              
              <div class="mt-2 pt-2 border-t border-gray-700">
                <span class="text-gray-400 text-xs">Critical Facilities:</span>
                <div class="mt-1 flex flex-wrap gap-1">
                  ${zone.critical_facilities.slice(0, 3).map(f => 
                    `<span class="text-xs bg-gray-700 px-2 py-0.5 rounded">${f}</span>`
                  ).join('')}
                  ${zone.critical_facilities.length > 3 ? `<span class="text-xs text-gray-500">+${zone.critical_facilities.length - 3} more</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup'
        });

        marker.on('click', () => {
          onZoneSelect(zone);
        });

        // Pulse animation for zones with no power
        if (zone.power_state === 'NO_POWER' || zone.power_state === 'BACKUP_POWER') {
          let growing = true;
          let currentRadius = 14;
          setInterval(() => {
            if (growing) {
              currentRadius += 0.5;
              if (currentRadius >= 18) growing = false;
            } else {
              currentRadius -= 0.5;
              if (currentRadius <= 14) growing = true;
            }
            marker.setRadius(currentRadius);
          }, 100);
        }

        markersRef.current[zone.id] = marker;
      }
    });
  }, [zones, selectedZone, activeIncidents, onZoneSelect]);

  return (
    <div className="relative w-full h-full">
      <div id="blackout-map" className="w-full h-full"></div>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-gray-800/95 border border-gray-700 rounded-lg p-4 shadow-lg">
        <h4 className="text-sm font-bold text-white mb-2">Power State Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getPowerStateColor('FULL_POWER') }}></div>
            <span className="text-xs text-gray-300">Full Power</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getPowerStateColor('REDUCED_POWER') }}></div>
            <span className="text-xs text-gray-300">Reduced Power</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getPowerStateColor('BACKUP_POWER') }}></div>
            <span className="text-xs text-gray-300">Backup Power</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getPowerStateColor('NO_POWER') }}></div>
            <span className="text-xs text-gray-300">No Power</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-700">
          <h4 className="text-sm font-bold text-white mb-2">Priority Levels</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">●</span>
              <span className="text-xs text-gray-300">CRITICAL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-400">●</span>
              <span className="text-xs text-gray-300">HIGH</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-yellow-400">●</span>
              <span className="text-xs text-gray-300">MEDIUM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">●</span>
              <span className="text-xs text-gray-300">LOW</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



