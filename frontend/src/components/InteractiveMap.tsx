// frontend/src/components/InteractiveMap.tsx
'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import ZoneDetailsPanel from './panels/ZoneDetailsPanel';
import { AlertTriangle } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  color: string;
  poles: any[];
}

const Map3DComponent = dynamic(() => import('./Map3DComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 flex items-center justify-center text-emerald-400 font-mono animate-pulse">Initializing Geospatial Systems...</div>
});

export default function InteractiveMap() {
  const { zones, status, latestAgentRun } = useSelector((state: RootState) => state.dashboard);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  // Use type casting to handle dynamic agent payload structures
  const agentRunData = latestAgentRun as any;
  const weatherCondition = agentRunData?.fused_environmental_state?.weather_context?.condition?.toLowerCase() || 'clear';

  const handleZoneClick = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (zone) setSelectedZone(zone as Zone);
  };

  if (status === 'idle' || status === 'loading') {
    return <div className="h-full w-full bg-slate-900 flex items-center justify-center text-blue-400">Syncing live data streams...</div>;
  }

  if (status === 'failed') {
    return <div className="h-full w-full bg-red-900/20 text-red-500 flex items-center justify-center">Critical Error: Sensor feed disconnected.</div>;
  }

  return (
    <div className="relative h-full w-full bg-slate-900">
      <Map3DComponent
        zones={zones}
        weatherCondition={weatherCondition}
        onZoneClick={handleZoneClick}
      />
      <ZoneDetailsPanel zone={selectedZone} onClose={() => setSelectedZone(null)} />
    </div>
  );
}