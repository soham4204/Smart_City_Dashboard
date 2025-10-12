// frontend/src/components/InteractiveMap.tsx
'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import ZoneDetailsPanel from './panels/ZoneDetailsPanel'; // Import the new panel

// Define Zone type locally for this component
interface Zone {
  id: string;
  name: string;
  color: string;
  poles: any[];
}

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center">Loading Map...</div>
});

export default function InteractiveMap() {
  const { zones, status, latestAgentRun } = useSelector((state: RootState) => state.dashboard);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const weatherCondition = latestAgentRun?.fused_environmental_state?.weather_context?.condition?.toLowerCase() || 'clear';

  const handleZoneClick = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      setSelectedZone(zone as Zone);
    }
  };

  const handleClosePanel = () => {
    setSelectedZone(null);
  };

  if (status === 'idle' || status === 'loading') {
    return <div className="h-full w-full bg-gray-800 flex items-center justify-center">Connecting to live feed...</div>;
  }

  if (status === 'failed') {
    return <div className="h-full w-full bg-gray-800 flex items-center justify-center">Failed to load map data.</div>;
  }

  return (
    <div className="relative h-full w-full">
        <MapComponent 
            zones={zones} 
            weatherCondition={weatherCondition} 
            onZoneClick={handleZoneClick} 
        />
        <ZoneDetailsPanel zone={selectedZone} onClose={handleClosePanel} />
    </div>
  );
}