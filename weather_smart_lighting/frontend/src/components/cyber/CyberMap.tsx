// components/cyber/CyberMap.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CyberZone {
  id: string;
  name: string;
  zone_type: string;
  security_state: 'GREEN' | 'YELLOW' | 'RED';
  critical_assets: string[];
  active_incidents: number;
  threat_level: string;
  compliance_status: string;
}

interface CyberMapProps {
  zones: CyberZone[];
  selectedZone: CyberZone | null;
  onZoneSelect: (zone: CyberZone) => void;
}

export default function CyberMap({ zones, selectedZone, onZoneSelect }: CyberMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.CircleMarker }>({});

  // Zone coordinates (Mumbai locations)
  const zoneLocations: { [key: string]: [number, number] } = {
    'airport_zone': [19.0896, 72.8656],
    'hospital_zone': [19.0150, 72.8400],
    'defence_zone': [18.9220, 72.8347],
    'education_zone': [19.0728, 72.8826],
    'commercial_zone': [19.0596, 72.8295],
    'residential_zone': [19.0220, 72.8440]
  };

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      const map = L.map('cyber-map', {
        zoomControl: false,
        attributionControl: false
      }).setView([19.0760, 72.8777], 11);

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Add zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
    }

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = {};

    // Add zone markers
    zones.forEach(zone => {
      const location = zoneLocations[zone.id];
      if (location && mapRef.current) {
        const color = getSecurityStateColor(zone.security_state);
        const isSelected = selectedZone?.id === zone.id;
        
        const marker = L.circleMarker(location, {
          radius: isSelected ? 25 : 20,
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 2,
          opacity: 1,
          fillOpacity: zone.security_state === 'RED' ? 0.9 : 0.7
        }).addTo(mapRef.current);

        // Add pulsing effect for RED zones
        if (zone.security_state === 'RED') {
          marker.setStyle({
            className: 'pulse-red'
          });
        }

        // Popup content
        const popupContent = `
          <div class="bg-gray-800 text-white p-3 rounded-lg min-w-[200px]">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-sm">${zone.name}</h3>
              <span class="px-2 py-1 rounded text-xs ${getSecurityStateBadgeClass(zone.security_state)}">
                ${zone.security_state}
              </span>
            </div>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-gray-400">Threat Level:</span>
                <span class="text-${getThreatLevelColor(zone.threat_level)}-400">${zone.threat_level}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Active Incidents:</span>
                <span class="${zone.active_incidents > 0 ? 'text-red-400' : 'text-green-400'}">${zone.active_incidents}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Compliance:</span>
                <span class="text-${zone.compliance_status === 'COMPLIANT' ? 'green' : 'yellow'}-400">${zone.compliance_status}</span>
              </div>
              <div class="mt-2">
                <span class="text-gray-400 text-xs">Critical Assets:</span>
                <div class="text-xs mt-1">
                  ${zone.critical_assets.slice(0, 2).map(asset => 
                    `<span class="bg-gray-700 px-1 py-0.5 rounded mr-1">${asset.replace(/_/g, ' ')}</span>`
                  ).join('')}
                </div>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          className: 'cyber-popup'
        });

        // Click handler
        marker.on('click', () => {
          onZoneSelect(zone);
        });

        markersRef.current[zone.id] = marker;
      }
    });

  }, [zones, selectedZone]);

  const getSecurityStateColor = (state: string): string => {
    switch (state) {
      case 'GREEN': return '#10b981';
      case 'YELLOW': return '#f59e0b';
      case 'RED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSecurityStateBadgeClass = (state: string): string => {
    switch (state) {
      case 'GREEN': return 'bg-green-600/20 text-green-400';
      case 'YELLOW': return 'bg-yellow-600/20 text-yellow-400';
      case 'RED': return 'bg-red-600/20 text-red-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  const getThreatLevelColor = (level: string): string => {
    switch (level) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'yellow';
      case 'HIGH': return 'orange';
      case 'CRITICAL': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="relative h-full">
      <div id="cyber-map" className="h-full w-full"></div>
      
      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur border border-gray-700 rounded-lg p-3 z-[1000]">
        <h4 className="text-white font-semibold text-sm mb-2">Security Status</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-300 text-xs">Secure</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-300 text-xs">Warning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-gray-300 text-xs">Under Attack</span>
          </div>
        </div>
      </div>

      {/* Zone Counter */}
      <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur border border-gray-700 rounded-lg p-3 z-[1000]">
        <div className="text-center">
          <p className="text-cyan-400 font-bold text-lg">{zones.length}</p>
          <p className="text-gray-400 text-xs">Monitored Zones</p>
        </div>
      </div>

      <style jsx>{`
        .pulse-red {
          animation: pulse-red 2s infinite;
        }
        
        @keyframes pulse-red {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 20px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
      `}</style>
    </div>
  );
}