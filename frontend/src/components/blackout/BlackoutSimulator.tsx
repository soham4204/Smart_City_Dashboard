'use client';

import { useState } from 'react';
import { Zap, Cloud, AlertCircle } from 'lucide-react';

interface PowerZone {
  id: string;
  name: string;
  priority: string;
}

interface BlackoutSimulatorProps {
  zones: PowerZone[];
  onSimulationComplete: (result: any) => void;
}

const CAUSES = [
  { value: 'grid_failure', label: 'Grid Failure', icon: '⚡' },
  { value: 'overload', label: 'Overload', icon: '🔥' },
  { value: 'weather_damage', label: 'Weather Damage', icon: '🌩️' },
  { value: 'cyber_attack', label: 'Cyber Attack', icon: '🔒' },
  { value: 'equipment_failure', label: 'Equipment Failure', icon: '🔧' }
];

const SEVERITIES = [
  { value: 'MINOR', label: 'Minor', color: 'bg-yellow-500', description: '< 30% capacity lost' },
  { value: 'MODERATE', label: 'Moderate', color: 'bg-orange-500', description: '30-60% capacity lost' },
  { value: 'MAJOR', label: 'Major', color: 'bg-red-500', description: '60-85% capacity lost' },
  { value: 'CATASTROPHIC', label: 'Catastrophic', color: 'bg-purple-600', description: '> 85% capacity lost' }
];

const WEATHER_CONDITIONS = [
  { value: '', label: 'No Weather Impact' },
  { value: 'clear', label: 'Clear' },
  { value: 'rain', label: 'Rain' },
  { value: 'storm', label: 'Storm' },
  { value: 'cyclone', label: 'Cyclone' },
  { value: 'flooding', label: 'Flooding' },
  { value: 'heatwave', label: 'Heatwave' }
];

export default function BlackoutSimulator({ zones, onSimulationComplete }: BlackoutSimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [cause, setCause] = useState('grid_failure');
  const [severity, setSeverity] = useState('MODERATE');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [capacityLost, setCapacityLost] = useState(50);
  const [weatherCondition, setWeatherCondition] = useState('');

  const handleZoneToggle = (zoneId: string) => {
    setSelectedZones(prev => 
      prev.includes(zoneId) 
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  const handleSimulate = async () => {
    if (selectedZones.length === 0) {
      alert('Please select at least one zone to affect');
      return;
    }

    setIsSimulating(true);

    try {
      const response = await fetch('http://localhost:8002/api/v1/blackout/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cause,
          severity,
          affected_zones: selectedZones,
          capacity_lost_percent: capacityLost,
          weather_condition: weatherCondition || null
        })
      });

      const result = await response.json();
      console.log('Blackout simulation result:', result);
      onSimulationComplete(result);
    } catch (error) {
      console.error('Simulation failed:', error);
      alert('Failed to simulate blackout. Please try again.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleQuickScenario = (scenario: string) => {
    switch (scenario) {
      case 'weather_catastrophe':
        setCause('weather_damage');
        setSeverity('CATASTROPHIC');
        setCapacityLost(90);
        setWeatherCondition('cyclone');
        setSelectedZones(zones.filter(z => z.priority === 'LOW' || z.priority === 'MEDIUM').map(z => z.id));
        break;
      case 'cyber_major':
        setCause('cyber_attack');
        setSeverity('MAJOR');
        setCapacityLost(70);
        setWeatherCondition('');
        setSelectedZones(zones.filter(z => z.priority === 'HIGH' || z.priority === 'MEDIUM').map(z => z.id).slice(0, 3));
        break;
      case 'equipment_minor':
        setCause('equipment_failure');
        setSeverity('MINOR');
        setCapacityLost(25);
        setWeatherCondition('');
        setSelectedZones([zones[zones.length - 1]?.id]);
        break;
    }
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-bold text-white">Blackout Simulator</h2>
      </div>

      {/* Quick Scenarios */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Quick Scenarios</label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => handleQuickScenario('weather_catastrophe')}
            className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded text-sm text-white text-left transition-colors"
          >
            🌩️ Weather Catastrophe
          </button>
          <button
            onClick={() => handleQuickScenario('cyber_major')}
            className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded text-sm text-white text-left transition-colors"
          >
            🔒 Cyber Attack - Major
          </button>
          <button
            onClick={() => handleQuickScenario('equipment_minor')}
            className="px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 rounded text-sm text-white text-left transition-colors"
          >
            🔧 Equipment Failure - Minor
          </button>
        </div>
      </div>

      {/* Cause */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Blackout Cause</label>
        <select 
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
        >
          {CAUSES.map(c => (
            <option key={c.value} value={c.value}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Severity */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Severity Level</label>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITIES.map(s => (
            <button
              key={s.value}
              onClick={() => setSeverity(s.value)}
              className={`px-3 py-2 rounded text-sm font-semibold transition-all ${
                severity === s.value 
                  ? `${s.color} text-white` 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {SEVERITIES.find(s => s.value === severity)?.description}
        </p>
      </div>

      {/* Capacity Lost */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">
          Capacity Lost: {capacityLost}%
        </label>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={capacityLost}
          onChange={(e) => setCapacityLost(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Weather Condition */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          Weather Condition
        </label>
        <select 
          value={weatherCondition}
          onChange={(e) => setWeatherCondition(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
        >
          {WEATHER_CONDITIONS.map(w => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      </div>

      {/* Zone Selection */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">
          Affected Zones ({selectedZones.length} selected)
        </label>
        <div className="max-h-40 overflow-y-auto bg-gray-700/50 rounded p-2 space-y-1">
          {zones.map(zone => (
            <label key={zone.id} className="flex items-center gap-2 p-2 hover:bg-gray-600/50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedZones.includes(zone.id)}
                onChange={() => handleZoneToggle(zone.id)}
                className="form-checkbox"
              />
              <span className="text-sm text-white flex-1">{zone.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                zone.priority === 'CRITICAL' ? 'bg-red-500/30 text-red-300' :
                zone.priority === 'HIGH' ? 'bg-orange-500/30 text-orange-300' :
                zone.priority === 'MEDIUM' ? 'bg-yellow-500/30 text-yellow-300' :
                'bg-gray-500/30 text-gray-300'
              }`}>
                {zone.priority}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Simulate Button */}
      <button
        onClick={handleSimulate}
        disabled={isSimulating || selectedZones.length === 0}
        className={`w-full py-3 rounded font-bold transition-colors ${
          isSimulating || selectedZones.length === 0
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {isSimulating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Simulating...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Initiate Blackout
          </span>
        )}
      </button>
    </div>
  );
}


