// components/cyber/ZoneStatusPanel.tsx
'use client';

import React, { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface CyberZone {
  id: string;
  name: string;
  zone_type: string;
  security_state: 'GREEN' | 'YELLOW' | 'RED';
  critical_assets: string[];
  active_incidents: number;
  threat_level: string;
  compliance_status: string;
}

interface ZoneStatusPanelProps {
  zone: CyberZone;
  onRefresh: () => void;
}

export default function ZoneStatusPanel({ zone, onRefresh }: ZoneStatusPanelProps) {
  const [loading, setLoading] = useState(false);

  const getSecurityStateIcon = () => {
    switch (zone.security_state) {
      case 'GREEN':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'YELLOW':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'RED':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  const getSecurityStateColor = () => {
    switch (zone.security_state) {
      case 'GREEN': return 'text-green-400 bg-green-600/20 border-green-500/30';
      case 'YELLOW': return 'text-yellow-400 bg-yellow-600/20 border-yellow-500/30';
      case 'RED': return 'text-red-400 bg-red-600/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-600/20 border-gray-500/30';
    }
  };

  const getThreatLevelColor = () => {
    switch (zone.threat_level) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-orange-400';
      case 'CRITICAL': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Zone Details</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Zone Name */}
      <div className="mb-4">
        <h4 className="text-xl font-bold text-white">{zone.name}</h4>
        <p className="text-gray-400 text-sm capitalize">{zone.zone_type.replace('_', ' ')}</p>
      </div>

      {/* Security State */}
      <div className={`p-3 rounded-lg border mb-4 ${getSecurityStateColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getSecurityStateIcon()}
            <span className="font-semibold">Security State</span>
          </div>
          <span className="font-bold">{zone.security_state}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Threat Level */}
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="text-center">
            <p className={`font-bold text-lg ${getThreatLevelColor()}`}>
              {zone.threat_level}
            </p>
            <p className="text-gray-400 text-xs">Threat Level</p>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="text-center">
            <p className={`font-bold text-lg ${zone.active_incidents > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {zone.active_incidents}
            </p>
            <p className="text-gray-400 text-xs">Active Incidents</p>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
          <span className="text-gray-300">Compliance</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            zone.compliance_status === 'COMPLIANT' 
              ? 'bg-green-600/20 text-green-400' 
              : 'bg-yellow-600/20 text-yellow-400'
          }`}>
            {zone.compliance_status}
          </span>
        </div>
      </div>

      {/* Critical Assets */}
      <div>
        <h5 className="text-sm font-semibold text-gray-300 mb-2">Critical Assets</h5>
        <div className="space-y-2">
          {zone.critical_assets.map((asset, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-2 bg-gray-700/30 rounded-lg"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              <span className="text-gray-300 text-sm capitalize">
                {asset.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center space-x-2 text-gray-400 text-xs">
          <Clock className="h-3 w-3" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}