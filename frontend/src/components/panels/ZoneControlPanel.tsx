'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ZONE_ICONS: { [key: string]: string } = {
  "CSM International Airport": "✈️",
  "KEM Hospital": "🏥",
  "Dadar Residential Area": "🏘️",
};

export default function ZoneControlPanel() {
  const { zones, latestAgentRun } = useSelector((state: RootState) => state.dashboard);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [config, setConfig] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle states
  const [showZoneStatus, setShowZoneStatus] = useState(true);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showAgentStatus, setShowAgentStatus] = useState(false);

  useEffect(() => {
    // If zones are loaded and no zone is selected yet, select the first one.
    if (zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0].name);
    }
  }, [zones, selectedZone]);

  // Fetch config when the selected zone changes
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

  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: Number(value) }));
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await fetch(`http://localhost:8000/api/v1/zones/${selectedZone}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error("Save config error:", error);
      alert('Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!zoneData) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl text-gray-300 border border-gray-700">
        <p className="text-center">Select a zone to see details.</p>
      </div>
    );
  }

  const isApproved = latestAgentRun?.final_verdict?.startsWith('APPROVE');

  return (
    <div className="flex flex-col gap-4">
      {/* Zone Selector */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 shadow-lg">
        <label htmlFor="zone-select" className="block text-sm font-medium text-gray-300 mb-2">
          Select Zone
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

      {/* Zone Status Card - Toggleable */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
        <button
          onClick={() => setShowZoneStatus(!showZoneStatus)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
        >
          <h4 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <span className="text-2xl">{ZONE_ICONS[zoneData.name] || '💡'}</span>
            Zone Status - {zoneData.name}
          </h4>
          {showZoneStatus ? <ChevronUp className="text-cyan-400" /> : <ChevronDown className="text-cyan-400" />}
        </button>
        
        {showZoneStatus && (
          <div className="p-6 pt-0">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Priority Level</div>
                <div className={`text-2xl font-bold ${
                  zoneData.priority === 'High' ? 'text-red-500' :
                  zoneData.priority === 'Medium' ? 'text-orange-400' :
                  'text-blue-400'
                }`}>
                  {zoneData.priority}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Units Online</div>
                <div className="text-2xl font-bold text-green-400">
                  {zoneData.onlineCount}/{zoneData.poles.length}
                </div>
              </div>
            </div>

            {/* Power Level Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm font-medium">Zone Power Level</span>
                <span className="text-xl font-bold text-yellow-300">
                  {zoneData.avgBrightness.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-900/80 rounded-full h-6 overflow-hidden border border-gray-700 shadow-inner">
                <div
                  className="bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${zoneData.avgBrightness}%` }}
                />
              </div>
            </div>

            {/* Override Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOverride(zoneData.poles.map(p => p.id), 100)}
                className="p-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-bold text-white shadow-lg hover:shadow-red-500/50 transition-all transform hover:scale-105"
              >
                <span className="text-xl mr-2">🔆</span>
                MAX POWER
              </button>
              <button
                onClick={() => handleOverride(zoneData.poles.map(p => p.id), 10)}
                className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-bold text-white shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
              >
                <span className="text-xl mr-2">🔅</span>
                MIN POWER
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Configuration Section - Toggleable */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-cyan-700/50 shadow-xl overflow-hidden">
        <button
          onClick={() => setShowAIConfig(!showAIConfig)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
        >
          <h4 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            AI Decision Configuration
          </h4>
          {showAIConfig ? <ChevronUp className="text-cyan-400" /> : <ChevronDown className="text-cyan-400" />}
        </button>
        
        {showAIConfig && (
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-spin text-4xl mb-2">⚙️</div>
                Loading configuration...
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {Object.entries(config).map(([key, value]) => (
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
                  ))}
                </div>
                
                <button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className={`w-full p-3 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-105 ${
                    isSaving
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-green-500/50'
                  }`}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⚙️</span>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>💾</span>
                      Save Configuration
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Agent Status Panel - Toggleable */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-purple-700/50 shadow-xl overflow-hidden">
        <button
          onClick={() => setShowAgentStatus(!showAgentStatus)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
        >
          <h4 className="text-xl font-bold text-purple-400 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI Agent Status
          </h4>
          {showAgentStatus ? <ChevronUp className="text-purple-400" /> : <ChevronDown className="text-purple-400" />}
        </button>
        
        {showAgentStatus && (
          <div className="p-6 pt-0">
            {!latestAgentRun ? (
              <p className="text-gray-400 text-center py-4">Awaiting first simulation run...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-300 mb-2">Anomalies Detected</h5>
                  <p className="text-sm text-orange-400 bg-gray-900/50 p-3 rounded border border-gray-700">
                    {latestAgentRun.anomalies?.anomalies.join(', ') || 'None'}
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-300 mb-2">Agent Decision</h5>
                  <p className="text-sm text-blue-300 bg-gray-900/50 p-3 rounded border border-gray-700">
                    {latestAgentRun.decision?.decision || 'N/A'}
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-300 mb-2">LLM Judge Verdict</h5>
                  <div className={`text-sm p-3 rounded border ${
                    isApproved 
                      ? 'bg-green-900/30 text-green-200 border-green-700' 
                      : 'bg-red-900/30 text-red-200 border-red-700'
                  }`}>
                    <span className="font-bold">{isApproved ? '✅ APPROVED' : '❌ REJECTED'}:</span>{' '}
                    {latestAgentRun.final_verdict?.split(': ')[1] || ''}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}