'use client';

import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

const ZONE_ICONS: { [key: string]: string } = {
  "CSM International Airport": "✈️",
  "KEM Hospital": "🏥",
  "Dadar Residential Area": "🏘️",
};

export default function ZoneControlPanel() {
  const { zones } = useSelector((state: RootState) => state.dashboard);

  // Guard against empty zones
  const defaultZone = zones.length > 0 ? zones[0].name : '';
  const [selectedZone, setSelectedZone] = useState<string>(defaultZone);

  const zoneData = useMemo(() => {
    const zone = zones.find(z => z.name === selectedZone);
    if (!zone) return null;

    const onlinePoles = zone.poles.filter(p => p.status === 'ONLINE');
    const avgBrightness = onlinePoles.length
      ? onlinePoles.reduce((acc, p) => acc + p.brightness, 0) / onlinePoles.length
      : 0;

    return {
      ...zone,
      onlineCount: onlinePoles.length,
      avgBrightness,
      priority: zone.poles[0]?.priority ?? 'N/A',
    };
  }, [selectedZone, zones]);

  const handleOverride = async (poleIds: string[], brightness: number) => {
    alert(`Applying override to ${poleIds.length} poles. Setting brightness to ${brightness}%.`);

    // Send requests in parallel for better performance
    await Promise.all(
      poleIds.map((poleId) =>
        fetch(`http://localhost:8000/api/v1/poles/${poleId}/override`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manual_override: true, brightness }),
        })
      )
    );
  };

  if (!zoneData) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg text-gray-300">
        Select a zone to see details.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-semibold">🎛 Live Zone Control</h3>

        {/* Accessible label for select */}
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
            <option key={zone.id} value={zone.name}>{zone.name}</option>
        ))}
        </select>


      <div className="p-4 bg-gray-800 rounded-lg text-white">
        <h4 className="text-lg font-bold text-cyan-400 mb-4">
          {ZONE_ICONS[zoneData.name] || '💡'} {zoneData.name}
        </h4>

        {/* Stats Grid */}
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

        {/* Progress Bar */}
        {/* Tailwind-based progress bar using dynamic width class */}
        <div className="mb-4">
        <div className="text-gray-400 text-sm mb-2">Zone Power Level</div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ '--tw-w': `${zoneData.avgBrightness}%` } as React.CSSProperties}
            />
        </div>
        <div className="text-right text-lg font-bold text-yellow-300 mt-1">
            {zoneData.avgBrightness.toFixed(0)}%
        </div>
        </div>


        {/* Override Buttons */}
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
