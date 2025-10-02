// components/cyber/AttackSimulator.tsx
'use client';

import React, { useState } from 'react';
import { Zap, Target, AlertTriangle, Play, Loader2 } from 'lucide-react';

interface CyberZone {
  id: string;
  name: string;
  zone_type: string;
  security_state: 'GREEN' | 'YELLOW' | 'RED';
}

interface AttackSimulatorProps {
  zones: CyberZone[];
}

const ATTACK_TYPES = [
  { id: 'ransomware', name: 'Ransomware', icon: '🔒', description: 'Data encryption attack' },
  { id: 'brute_force', name: 'Brute Force', icon: '🔨', description: 'Password cracking attempt' },
  { id: 'ddos', name: 'DDoS', icon: '⚡', description: 'Network flooding attack' },
  { id: 'data_exfiltration', name: 'Data Theft', icon: '📤', description: 'Data exfiltration attempt' },
  { id: 'apt', name: 'APT', icon: '🎯', description: 'Advanced persistent threat' }
];

const SEVERITY_LEVELS = [
  { id: 'LOW', name: 'Low', color: 'text-green-400' },
  { id: 'MEDIUM', name: 'Medium', color: 'text-yellow-400' },
  { id: 'HIGH', name: 'High', color: 'text-orange-400' },
  { id: 'CRITICAL', name: 'Critical', color: 'text-red-400' }
];

export default function AttackSimulator({ zones }: AttackSimulatorProps) {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedAttack, setSelectedAttack] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('MEDIUM');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSimulate = async () => {
    if (!selectedZone || !selectedAttack) {
      alert('Please select both a zone and attack type');
      return;
    }

    setIsSimulating(true);
    setLastResult(null);

    try {
      const response = await fetch('http://localhost:8001/api/v1/cyber/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zone_id: selectedZone,
          attack_type: selectedAttack,
          severity: selectedSeverity,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastResult(result);
        console.log('✅ Attack simulation completed:', result);
      } else {
        console.error('❌ Attack simulation failed');
        alert('Simulation failed. Please check if the backend is running on port 8001.');
      }
    } catch (error) {
      console.error('❌ Error during simulation:', error);
      alert('Failed to connect to cybersecurity backend');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-4 border-b border-gray-700">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="bg-red-600 p-2 rounded-lg">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Attack Simulator</h2>
          <p className="text-gray-400 text-sm">Test SOAR pipeline response</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Zone Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Zone
          </label>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Select a zone...</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        {/* Attack Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Attack Type
          </label>
          <div className="grid grid-cols-1 gap-2">
            {ATTACK_TYPES.map((attack) => (
              <button
                key={attack.id}
                onClick={() => setSelectedAttack(attack.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedAttack === attack.id
                    ? 'border-cyan-500 bg-cyan-600/20 text-cyan-400'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{attack.icon}</span>
                  <div>
                    <p className="font-medium">{attack.name}</p>
                    <p className="text-xs text-gray-400">{attack.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Severity Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Severity Level
          </label>
          <div className="flex space-x-2">
            {SEVERITY_LEVELS.map((severity) => (
              <button
                key={severity.id}
                onClick={() => setSelectedSeverity(severity.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedSeverity === severity.id
                    ? `bg-opacity-20 ${severity.color} border-2 border-current`
                    : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                }`}
              >
                {severity.name}
              </button>
            ))}
          </div>
        </div>

        {/* Simulate Button */}
        <button
          onClick={handleSimulate}
          disabled={isSimulating || !selectedZone || !selectedAttack}
          className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
            isSimulating || !selectedZone || !selectedAttack
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isSimulating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Simulating Attack...</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              <span>Launch Attack Simulation</span>
            </>
          )}
        </button>

        {/* Results */}
        {lastResult && (
          <div className="mt-4 p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
            <h3 className="text-sm font-semibold text-white mb-2">Last Simulation Result</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Incident ID:</span>
                <span className="text-cyan-400 font-mono">{lastResult.incident_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time to Detection:</span>
                <span className="text-green-400">{lastResult.time_to_detection?.toFixed(1)}min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time to Mitigation:</span>
                <span className="text-green-400">{lastResult.time_to_mitigation?.toFixed(1)}min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Anomalies Detected:</span>
                <span className="text-yellow-400">{lastResult.anomalies_detected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Threat Neutralized:</span>
                <span className={lastResult.validation_passed ? 'text-green-400' : 'text-red-400'}>
                  {lastResult.validation_passed ? 'YES' : 'NO'}
                </span>
              </div>
              {lastResult.mitre_ttps && lastResult.mitre_ttps.length > 0 && (
                <div className="mt-2">
                  <span className="text-gray-400 text-xs">MITRE TTPs:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lastResult.mitre_ttps.map((ttp: string, index: number) => (
                      <span key={index} className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs">
                        {ttp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}