'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

export default function ZoneControlPanel() {
  const { zones } = useSelector((state: RootState) => state.dashboard);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [config, setConfig] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0].name);
    }
  }, [zones, selectedZone]);

  useEffect(() => {
    if (!selectedZone) return;
    
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/api/v1/zones/${selectedZone}/config`);
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("Failed to fetch zone config:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConfig();
  }, [selectedZone]);

  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: Number(value) }));
  };

  const handleSaveConfig = async () => {
    if (!selectedZone) return;
    setIsSaving(true);
    try {
      await fetch(`http://localhost:8000/api/v1/zones/${selectedZone}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      // You could add a success toast here
    } catch (error) {
      console.error("Save config error:", error);
      // You could add an error toast here
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Zone Selector */}
      <div>
        <label htmlFor="zone-select" className="block text-sm font-medium text-gray-300 mb-2">
          Select Zone for Configuration
        </label>
        <select
          id="zone-select"
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
        >
          {zones.map(zone => (
            <option key={zone.id} value={zone.name}>{zone.name}</option>
          ))}
        </select>
      </div>

      {/* AI Thresholds */}
      <div className="space-y-4">
        <h4 className="text-xl font-bold text-cyan-300">AI Decision Thresholds</h4>
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">
            Loading configuration...
          </div>
        ) : (
          <>
            {Object.keys(config).length > 0 ? (
                Object.entries(config).map(([key, value]) => (
                <div key={key} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <label htmlFor={`config-${key}`} className="text-sm font-medium text-gray-300 capitalize mb-2 block">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    id={`config-${key}`}
                    type="number"
                    value={value}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                </div>
              ))
            ) : (
                <p className="text-gray-500">No configurable thresholds for this zone.</p>
            )}
            
            <button
              onClick={handleSaveConfig}
              disabled={isSaving || isLoading || Object.keys(config).length === 0}
              className={`w-full p-3 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                isSaving
                  ? 'bg-gray-600'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-green-500/50'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
