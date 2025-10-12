// frontend/src/components/panels/ZoneDetailsPanel.tsx
'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';

interface Pole {
  id: string;
  status: string;
  brightness: number;
}

interface Zone {
  id: string;
  name: string;
  poles: Pole[];
}

interface ZoneDetailsPanelProps {
  zone: Zone | null;
  onClose: () => void;
}

export default function ZoneDetailsPanel({ zone, onClose }: ZoneDetailsPanelProps) {
  const stats = useMemo(() => {
    if (!zone) return null;

    const onlinePoles = zone.poles.filter(p => p.status === 'ONLINE');
    const offlinePoles = zone.poles.filter(p => p.status === 'OFFLINE').length;
    const maintenancePoles = zone.poles.filter(p => p.status === 'MAINTENANCE').length;

    const avgBrightness = onlinePoles.length > 0
      ? onlinePoles.reduce((acc, p) => acc + p.brightness, 0) / onlinePoles.length
      : 0;

    return {
      totalPoles: zone.poles.length,
      onlineCount: onlinePoles.length,
      offlineCount: offlinePoles,
      maintenanceCount: maintenancePoles,
      avgBrightness,
    };
  }, [zone]);

  if (!zone || !stats) return null;

  return (
    <div className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-lg p-4 z-[1000] w-72 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">{zone.name}</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Poles</span>
          <span className="font-bold text-white">{stats.totalPoles}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Online</span>
          <span className="font-bold text-green-400">{stats.onlineCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Offline</span>
          <span className="font-bold text-red-500">{stats.offlineCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Maintenance</span>
          <span className="font-bold text-yellow-400">{stats.maintenanceCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Avg. Brightness</span>
          <span className="font-bold text-cyan-400">{stats.avgBrightness.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}