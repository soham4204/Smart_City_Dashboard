'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, Activity, Cloud, Brain, CheckCircle, XCircle } from 'lucide-react';

interface BlackoutIncident {
  incident_id: string;
  severity: string;
  affected_zones: string[];
  cause: string;
  total_capacity_lost_mw: number;
  estimated_recovery_hours: number;
  status: string;
  initiated_at: string;
  resolved_at?: string;
  weather_related: boolean;
  cascade_risk: number;
}

interface PowerZone {
  id: string;
  name: string;
  power_allocation_percent: number;
}

interface SOARAnalysis {
  grid_analysis?: any;
  weather_impact?: any;
  allocation_plan?: any;
  execution_status?: any;
}

interface IncidentPanelProps {
  incident: BlackoutIncident;
  soarAnalysis: SOARAnalysis | null;
  zones: PowerZone[];
  onManualAllocation: (allocations: Record<string, number>) => void;
  onResolve: (incidentId: string) => void;
}

export default function IncidentPanel({ incident, soarAnalysis, zones, onManualAllocation, onResolve }: IncidentPanelProps) {
  const [showManualControl, setShowManualControl] = useState(false);
  const [manualAllocations, setManualAllocations] = useState<Record<string, number>>({});

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CATASTROPHIC': return 'text-purple-400 bg-purple-500/20 border-purple-500/50';
      case 'MAJOR': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'MODERATE': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'MINOR': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const affectedZoneObjects = zones.filter(z => incident.affected_zones.includes(z.id));

  const handleAllocationChange = (zoneId: string, value: number) => {
    setManualAllocations(prev => ({ ...prev, [zoneId]: value }));
  };

  const applyManualAllocation = () => {
    onManualAllocation(manualAllocations);
    setShowManualControl(false);
    setManualAllocations({});
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          <h2 className="text-lg font-bold text-white">Active Incident</h2>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold border ${getSeverityColor(incident.severity)}`}>
          {incident.severity}
        </span>
      </div>

      {/* Incident ID */}
      <div className="mb-3 p-2 bg-gray-700/50 rounded">
        <span className="text-xs text-gray-400">Incident ID: </span>
        <span className="text-xs text-white font-mono">{incident.incident_id}</span>
      </div>

      {/* Basic Info */}
      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Cause:</span>
          <span className="text-white font-semibold">{incident.cause.replace('_', ' ').toUpperCase()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={`font-semibold ${
            incident.status === 'ACTIVE' ? 'text-red-400' :
            incident.status === 'RECOVERING' ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {incident.status}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Capacity Lost:</span>
          <span className="text-red-400 font-bold">{incident.total_capacity_lost_mw.toFixed(1)} MW</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Recovery Time:</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400">{incident.estimated_recovery_hours.toFixed(1)}h</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Cascade Risk:</span>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-orange-400" />
            <span className={`font-bold ${
              incident.cascade_risk > 0.7 ? 'text-red-400' :
              incident.cascade_risk > 0.4 ? 'text-orange-400' :
              'text-yellow-400'
            }`}>
              {(incident.cascade_risk * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {incident.weather_related && (
          <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
            <Cloud className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">Weather Related</span>
          </div>
        )}
      </div>

      {/* Affected Zones */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-400 mb-2">
          Affected Zones ({incident.affected_zones.length})
        </h3>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {affectedZoneObjects.map(zone => (
            <div key={zone.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded text-xs">
              <span className="text-white">{zone.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-600 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      zone.power_allocation_percent >= 80 ? 'bg-green-500' :
                      zone.power_allocation_percent >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${zone.power_allocation_percent}%` }}
                  ></div>
                </div>
                <span className="text-gray-400 w-8 text-right">{zone.power_allocation_percent.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SOAR Analysis */}
      {soarAnalysis && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-blue-400">AI Agent Analysis</h3>
          </div>

          {soarAnalysis.grid_analysis && (
            <div className="mb-2 text-xs">
              <p className="text-gray-400 mb-1">Grid Stability: 
                <span className="ml-1 font-bold text-white">
                  {soarAnalysis.grid_analysis.grid_stability}%
                </span>
              </p>
              {soarAnalysis.grid_analysis.llm_assessment && (
                <p className="text-gray-300 italic text-xs leading-relaxed">
                  "{soarAnalysis.grid_analysis.llm_assessment}"
                </p>
              )}
            </div>
          )}

          {soarAnalysis.weather_impact?.impact_assessment && (
            <div className="mb-2 text-xs">
              <p className="text-gray-400">Weather Impact: 
                <span className="ml-1 font-bold text-orange-400">
                  {soarAnalysis.weather_impact.impact_assessment.combined_severity_factor}x
                </span>
              </p>
            </div>
          )}

          {soarAnalysis.allocation_plan?.strategy && (
            <div className="text-xs">
              <p className="text-gray-400 mb-1">Allocation Strategy:</p>
              <p className="text-gray-300 italic leading-relaxed">
                "{soarAnalysis.allocation_plan.strategy}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Control */}
      <div className="mb-4">
        <button
          onClick={() => setShowManualControl(!showManualControl)}
          className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded text-sm text-blue-400 transition-colors"
        >
          {showManualControl ? 'Hide' : 'Show'} Manual Power Control
        </button>

        {showManualControl && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {affectedZoneObjects.map(zone => (
              <div key={zone.id} className="p-2 bg-gray-700/50 rounded">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white">{zone.name}</span>
                  <span className="text-xs text-gray-400">
                    {manualAllocations[zone.id] ?? zone.power_allocation_percent.toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={manualAllocations[zone.id] ?? zone.power_allocation_percent}
                  onChange={(e) => handleAllocationChange(zone.id, Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
            ))}
            <button
              onClick={applyManualAllocation}
              className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-sm text-white font-semibold transition-colors"
            >
              Apply Allocation
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => onResolve(incident.incident_id)}
          className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-sm text-white font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Resolve Incident
        </button>
      </div>
    </div>
  );
}




