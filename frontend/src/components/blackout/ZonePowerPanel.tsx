'use client';

import { Zap, Users, Building, Battery, AlertTriangle } from 'lucide-react';

interface PowerZone {
  id: string;
  name: string;
  zone_type: string;
  priority: string;
  power_state: string;
  current_load_mw: number;
  capacity_mw: number;
  backup_available: boolean;
  backup_capacity_mw: number;
  backup_duration_hours: number;
  affected_population: number;
  critical_facilities: string[];
  power_allocation_percent: number;
}

interface ZonePowerPanelProps {
  zone: PowerZone;
  onRefresh: () => void;
}

export default function ZonePowerPanel({ zone, onRefresh }: ZonePowerPanelProps) {
  const loadFactor = ((zone.current_load_mw / zone.capacity_mw) * 100).toFixed(1);

  const getPowerStateColor = (state: string) => {
    switch (state) {
      case 'FULL_POWER': return 'text-green-400';
      case 'REDUCED_POWER': return 'text-yellow-400';
      case 'BACKUP_POWER': return 'text-orange-400';
      case 'NO_POWER': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-400 bg-red-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20';
      case 'LOW': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Zone Details</h2>
        <button
          onClick={onRefresh}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Zone Name and Priority */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">{zone.name}</h3>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded text-sm font-bold ${getPriorityColor(zone.priority)}`}>
            {zone.priority}
          </span>
          <span className="text-sm text-gray-400">{zone.zone_type}</span>
        </div>
      </div>

      {/* Power State */}
      <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Power State</span>
          <span className={`text-sm font-bold ${getPowerStateColor(zone.power_state)}`}>
            {zone.power_state.replace('_', ' ')}
          </span>
        </div>
        
        {/* Power Allocation Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Power Allocation</span>
            <span>{zone.power_allocation_percent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                zone.power_allocation_percent >= 90 ? 'bg-green-500' :
                zone.power_allocation_percent >= 60 ? 'bg-yellow-500' :
                zone.power_allocation_percent >= 30 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${zone.power_allocation_percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Load Metrics */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Current Load</span>
          </div>
          <span className="text-sm font-bold text-white">
            {zone.current_load_mw.toFixed(1)} MW
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 ml-6">Capacity</span>
          <span className="text-sm text-gray-300">{zone.capacity_mw.toFixed(1)} MW</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 ml-6">Load Factor</span>
          <span className={`text-sm font-bold ${
            parseFloat(loadFactor) > 90 ? 'text-red-400' :
            parseFloat(loadFactor) > 70 ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {loadFactor}%
          </span>
        </div>
      </div>

      {/* Backup Power */}
      {zone.backup_available && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold text-green-400">Backup Power Available</span>
          </div>
          <div className="space-y-1 text-sm ml-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Capacity:</span>
              <span className="text-white">{zone.backup_capacity_mw.toFixed(0)} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{zone.backup_duration_hours.toFixed(0)} hours</span>
            </div>
          </div>
        </div>
      )}

      {!zone.backup_available && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-red-400">No Backup Power</span>
          </div>
        </div>
      )}

      {/* Population Impact */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-400">Affected Population</span>
        </div>
        <p className="text-2xl font-bold text-white ml-6">
          {zone.affected_population.toLocaleString()}
        </p>
      </div>

      {/* Critical Facilities */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Building className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-400">Critical Facilities</span>
        </div>
        <div className="ml-6 space-y-1">
          {zone.critical_facilities.map((facility, index) => (
            <div key={index} className="text-sm text-gray-300 flex items-center gap-2">
              <span className="text-purple-400">•</span>
              {facility}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


