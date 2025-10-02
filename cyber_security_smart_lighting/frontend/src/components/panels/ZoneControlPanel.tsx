'use client';

import { DashboardData } from '@/hooks/useWebsocket';
import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../../app/StoreProvider';

// Changed from interface to type with intersection
type Pole = DashboardData['mapData'][number] & {
  onlineStatus: 'ONLINE' | 'OFFLINE';
  brightness: number;
  priority: 'High' | 'Medium' | 'Low';
};

interface Zone {
  name: string;
  poles: Pole[];
}

const ZONE_ICONS: { [key: string]: string } = {
  "CSM International Airport": "✈️",
  "KEM Hospital": "🏥",
  "Dadar Residential Area": "🏘️",
};

export default function ZoneControlPanel() {
  const { data } = useDashboard();

  const zones: Zone[] = useMemo(() => {
    if (!data?.mapData) return [];
    
    const zonesMap = data.mapData.reduce((acc, pole) => {
      if (!pole?.zoneType) return acc;
      
      const zoneName = pole.zoneType;
      if (!acc[zoneName]) {
        acc[zoneName] = { name: zoneName, poles: [] };
      }
      
      acc[zoneName].poles.push({
        ...pole,
        id: `${pole.lat}-${pole.lng}`,
        onlineStatus: pole.status === 'RED' ? 'OFFLINE' : 'ONLINE',
        brightness: pole.status === 'RED' ? 10 : 90,
        priority: pole.status === 'RED' ? 'High' : 'Low',
      });
      return acc;
    }, {} as { [key: string]: Zone });
    
    return Object.values(zonesMap);
  }, [data?.mapData]);

  const initialDefaultZone = zones.length > 0 ? zones[0].name : '';
  const [selectedZone, setSelectedZone] = useState<string>(initialDefaultZone);

  useEffect(() => {
    if (zones.length > 0 && !zones.find(z => z.name === selectedZone)) {
      setSelectedZone(zones[0].name);
    }
  }, [zones, selectedZone]);

  const zoneData = useMemo(() => {
    const zone = zones.find(z => z.name === selectedZone);
    if (!zone) return null;
    
    const onlinePoles = zone.poles.filter(p => p.onlineStatus === 'ONLINE');
    const totalBrightness = onlinePoles.reduce((acc, p) => acc + p.brightness, 0);
    const avgBrightness = onlinePoles.length ? totalBrightness / onlinePoles.length : 0;
    const priority = zone.poles[0]?.priority ?? 'N/A';
    
    return {
      ...zone,
      onlineCount: onlinePoles.length,
      avgBrightness,
      priority,
    };
  }, [selectedZone, zones]);

  const handleOverride = async (poleIds: string[], brightness: number) => {
    try {
      await Promise.all(
        poleIds.map((poleId) =>
          fetch(`http://localhost:8000/api/v1/poles/${poleId}/override`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manual_override: true, brightness }),
          })
        )
      );
      alert(`Successfully updated ${poleIds.length} poles to ${brightness}% brightness`);
    } catch (error) {
      console.error('Failed to override poles:', error);
      alert('Failed to update poles. Please check the console for details.');
    }
  };

  if (!data?.mapData) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg text-gray-300">
        Loading zone data...
      </div>
    );
  }

  if (!zoneData) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg text-gray-300">
        Select a zone to see details. (No zone data available)
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-semibold">🎛 Live Zone Control</h3>
      <label htmlFor="zone-select" className="block text-sm font-medium text-gray-300 mb-1">
        Select Zone
      </label>
      <select
        id="zone-select"
        value={selectedZone}
        onChange={(e) => setSelectedZone(e.target.value)}
        className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
      >
        {zones.map(zone => (
          <option key={zone.name} value={zone.name}>{zone.name}</option>
        ))}
      </select>
      <div className="p-4 bg-gray-800 rounded-lg text-white">
        <h4 className="text-lg font-bold text-cyan-400 mb-4">
          {ZONE_ICONS[zoneData.name] || '💡'} {zoneData.name}
        </h4>
        <div className="grid grid-cols-2 gap-4 mb-4 text-center">
          <div>
            <div className="text-gray-400 text-sm">Priority</div>
            <div className={`text-xl font-bold ${
              zoneData.priority === 'High' ? 'text-red-500' :
              zoneData.priority === 'Medium' ? 'text-orange-400' :
              'text-blue-400'
            }`}>{zoneData.priority}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Unit Status</div>
            <div className="text-xl font-bold text-green-400">
              {zoneData.onlineCount}/{zoneData.poles.length}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <div className="text-gray-400 text-sm mb-2">Zone Power Level</div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${zoneData.avgBrightness}%` }}
            />
          </div>
          <div className="text-right text-lg font-bold text-yellow-300 mt-1">
            {zoneData.avgBrightness.toFixed(0)}%
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleOverride(zoneData.poles.map(p => p.id), 100)}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >🔆 MAX POWER</button>
          <button
            onClick={() => handleOverride(zoneData.poles.map(p => p.id), 10)}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >🔅 MIN POWER</button>
        </div>
      </div>
    </div>
  );
}