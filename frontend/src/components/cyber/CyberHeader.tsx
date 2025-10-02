// components/cyber/CyberHeader.tsx
import React from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface CyberHeaderProps {
  dashboardData: any;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

export default function CyberHeader({ dashboardData, connectionStatus }: CyberHeaderProps) {
  const getSecureZoneCount = () => {
    return dashboardData?.zones?.filter((z: any) => z.security_state === 'GREEN').length || 0;
  };

  const getTotalZones = () => {
    return dashboardData?.zones?.length || 0;
  };

  const getActiveThreats = () => {
    return dashboardData?.zones?.filter((z: any) => z.security_state === 'RED').length || 0;
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Cyber Defense Command</h1>
            <p className="text-gray-400 text-sm">Mumbai Smart City Security Operations</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="flex space-x-4">
          {/* Secure Zones */}
          <div className="bg-green-600/20 border border-green-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">{getSecureZoneCount()}/{getTotalZones()}</p>
                <p className="text-gray-400 text-xs">Secure Zones</p>
              </div>
            </div>
          </div>

          {/* Active Threats */}
          <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-red-400 font-semibold">{getActiveThreats()}</p>
                <p className="text-gray-400 text-xs">Active Threats</p>
              </div>
            </div>
          </div>

          {/* Threat Level */}
          <div className="bg-cyan-600/20 border border-cyan-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-cyan-400 font-semibold">{dashboardData?.global_threat_level || 'LOW'}</p>
                <p className="text-gray-400 text-xs">Threat Level</p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className={`rounded-lg px-4 py-2 border ${
            connectionStatus === 'connected' 
              ? 'bg-green-600/20 border-green-500/30' 
              : 'bg-red-600/20 border-red-500/30'
          }`}>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className={`font-semibold ${
                  connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {connectionStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
                </p>
                <p className="text-gray-400 text-xs">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}