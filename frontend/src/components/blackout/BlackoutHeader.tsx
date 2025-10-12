'use client';

import { Zap, ZapOff, Battery, AlertTriangle } from 'lucide-react';

interface BlackoutHeaderProps {
  dashboardData: {
    total_grid_capacity_mw: number;
    current_grid_load_mw: number;
    available_backup_mw: number;
    grid_health_score: number;
    active_incidents: any[];
  };
  connectionStatus: 'connected' | 'disconnected';
}

export default function BlackoutHeader({ dashboardData, connectionStatus }: BlackoutHeaderProps) {
  const { total_grid_capacity_mw, current_grid_load_mw, available_backup_mw, grid_health_score, active_incidents } = dashboardData;
  
  const loadPercentage = (current_grid_load_mw / total_grid_capacity_mw) * 100;
  const hasActiveIncidents = active_incidents.length > 0;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`${hasActiveIncidents ? 'bg-red-900/30' : 'bg-gray-800'} border-b border-gray-700 p-4 transition-colors`}>
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${hasActiveIncidents ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
              {hasActiveIncidents ? (
                <ZapOff className="w-8 h-8 text-red-400" />
              ) : (
                <Zap className="w-8 h-8 text-yellow-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mumbai Power Grid - Blackout Management</h1>
              <p className="text-gray-400 text-sm">
                Real-time power allocation & emergency response system
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-400">
                {connectionStatus === 'connected' ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-5 gap-4">
          {/* Grid Health */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Grid Health</span>
              <div className={`px-2 py-1 rounded text-xs font-bold ${getHealthColor(grid_health_score)}`}>
                {grid_health_score.toFixed(1)}%
              </div>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getHealthBgColor(grid_health_score)}`}
                style={{ width: `${grid_health_score}%` }}
              ></div>
            </div>
          </div>

          {/* Total Capacity */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-sm">Total Capacity</span>
            </div>
            <p className="text-2xl font-bold text-white">{total_grid_capacity_mw.toFixed(0)}</p>
            <p className="text-xs text-gray-400">MW</p>
          </div>

          {/* Current Load */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400 text-sm">Current Load</span>
            </div>
            <p className="text-2xl font-bold text-white">{current_grid_load_mw.toFixed(0)}</p>
            <p className="text-xs text-gray-400">{loadPercentage.toFixed(1)}% of capacity</p>
          </div>

          {/* Backup Power */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Battery className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Backup Available</span>
            </div>
            <p className="text-2xl font-bold text-white">{available_backup_mw.toFixed(0)}</p>
            <p className="text-xs text-gray-400">MW capacity</p>
          </div>

          {/* Active Incidents */}
          <div className={`rounded-lg p-4 ${hasActiveIncidents ? 'bg-red-500/20 border border-red-500/50' : 'bg-gray-700/50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${hasActiveIncidents ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
              <span className="text-gray-400 text-sm">Active Incidents</span>
            </div>
            <p className={`text-2xl font-bold ${hasActiveIncidents ? 'text-red-400' : 'text-green-400'}`}>
              {active_incidents.length}
            </p>
            <p className="text-xs text-gray-400">
              {hasActiveIncidents ? 'Emergency Response Active' : 'All Systems Normal'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



