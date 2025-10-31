'use client';

import { Shield, Activity, ShieldAlert, Globe, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CyberZone {
  id: string;
  name: string;
  security_state: 'GREEN' | 'YELLOW' | 'RED';
}

interface CyberDashboardData {
  zones: CyberZone[];
  active_incidents: any[];
  recent_events: any[];
  global_threat_level: string;
}

interface CyberHeaderProps {
  dashboardData: CyberDashboardData | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

// --- StatCard Sub-component ---
const StatCard = ({
  title,
  value,
  icon,
  colorClass,
  valueColorClass,
  subtext,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  valueColorClass?: string;
  subtext?: string;
}) => (
  <div
    className={cn(
      "bg-gray-700/50 rounded-lg p-4 transition-colors border border-gray-700/50 hover:bg-gray-700/70"
    )}
  >
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <div className={cn("p-2 rounded-md", colorClass)}>{icon}</div>
        <span className="text-gray-400 text-sm">{title}</span>
      </div>
    </div>
    <p className={cn("text-2xl font-bold", valueColorClass || "text-white")}>{value}</p>
    {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
  </div>
);

// --- Connection Status ---
const ConnectionStatus = ({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) => {
  const statusConfig = {
    connected: { text: 'Live', color: 'bg-green-400 animate-pulse', textColor: 'text-green-400', icon: <Wifi className="w-4 h-4" /> },
    connecting: { text: 'Connecting...', color: 'bg-yellow-400 animate-pulse', textColor: 'text-yellow-400', icon: <Wifi className="w-4 h-4 animate-pulse" /> },
    disconnected: { text: 'Disconnected', color: 'bg-red-400', textColor: 'text-red-400', icon: <WifiOff className="w-4 h-4" /> },
  };
  const cfg = statusConfig[status];
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
      <span className={`text-sm ${cfg.textColor}`}>{cfg.text}</span>
      {cfg.icon}
    </div>
  );
};

// --- Main Header Component ---
export default function CyberHeader({ dashboardData, connectionStatus }: CyberHeaderProps) {
  const zonesCount = dashboardData?.zones?.length || 0;
  const incidentsCount = dashboardData?.active_incidents?.length || 0;
  const zonesAtRisk = dashboardData?.zones?.filter(z => z.security_state !== 'GREEN').length || 0;
  const threatLevel = dashboardData?.global_threat_level || (zonesAtRisk > 0 ? 'HIGH' : 'LOW');

  const threatConfig = {
    LOW: { color: 'text-green-400', bg: 'bg-green-500/20', bar: 'bg-green-500' },
    MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', bar: 'bg-yellow-500' },
    HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/20', bar: 'bg-orange-500' },
    CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/20', bar: 'bg-red-500' },
  }[threatLevel] || { color: 'text-gray-400', bg: 'bg-gray-500/20', bar: 'bg-gray-500' };

  const hasActiveIncidents = incidentsCount > 0;

  return (
    <div
      className={cn(
        "border-b border-gray-700 p-4 transition-colors",
        hasActiveIncidents ? "bg-red-900/30" : "bg-gray-800"
      )}
    >
      <div className="max-w-full mx-auto">
        {/* Top Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${hasActiveIncidents ? 'bg-red-500/20' : threatConfig.bg}`}>
              {hasActiveIncidents ? (
                <ShieldAlert className="w-8 h-8 text-red-400 animate-pulse" />
              ) : (
                <Shield className={`w-8 h-8 ${threatConfig.color}`} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Cyber Defense Command Center</h1>
              <p className="text-gray-400 text-sm">Real-time Security Operations & Incident Response</p>
            </div>
          </div>
          <ConnectionStatus status={connectionStatus} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Protected Zones"
            value={zonesCount}
            icon={<Shield className="w-5 h-5 text-blue-400" />}
            colorClass="bg-blue-500/20"
            subtext="Active security regions"
          />
          <StatCard
            title="Active Incidents"
            value={incidentsCount}
            icon={<Activity className="w-5 h-5 text-orange-400" />}
            colorClass="bg-orange-500/20"
            valueColorClass={incidentsCount > 0 ? 'text-red-400' : 'text-green-400'}
            subtext={hasActiveIncidents ? 'Incidents under investigation' : 'All systems stable'}
          />
          <StatCard
            title="Zones at Risk"
            value={zonesAtRisk}
            icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
            colorClass="bg-red-500/20"
            valueColorClass={zonesAtRisk > 0 ? 'text-red-400' : 'text-green-400'}
            subtext={zonesAtRisk > 0 ? 'Requires immediate attention' : 'Secure'}
          />
          <StatCard
            title="Global Threat Level"
            value={threatLevel}
            icon={<Globe className={`w-5 h-5 ${threatConfig.color}`} />}
            colorClass={threatConfig.bg}
            valueColorClass={threatConfig.color}
            subtext="Dynamic global status"
          />
          <StatCard
            title="Recent Alerts"
            value={dashboardData?.recent_events?.length || 0}
            icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />}
            colorClass="bg-yellow-500/20"
            valueColorClass="text-yellow-400"
            subtext="Last 24 hours"
          />
        </div>
      </div>
    </div>
  );
}
