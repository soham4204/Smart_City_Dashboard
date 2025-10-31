'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Lightbulb, Zap, Wifi, WifiOff, Thermometer, CloudSun } from 'lucide-react'; // Added CloudSun
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

// This type now matches the status from your dashboardSlice
type DashboardStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export default function DashboardMetrics() {
  // Get raw state from Redux, as defined in your slice
  const { zones, status } = useSelector((state: RootState) => state.dashboard);

  // Calculate stats with useMemo so it only runs when 'zones' changes
  const stats = useMemo(() => {
    const allPoles = zones.flatMap(zone => zone.poles);
    const onlinePoles = allPoles.filter(p => p.status === 'ONLINE');
    
    const avgBrightness = onlinePoles.length > 0
      ? onlinePoles.reduce((acc, p) => acc + p.brightness, 0) / onlinePoles.length
      : 0;

    const onlinePercentage = allPoles.length > 0 ? (onlinePoles.length / allPoles.length) * 100 : 0;
    
    // Assuming 150W (0.15kW) per pole at 100% brightness
    const totalPowerLoad = onlinePoles.reduce((acc, pole) => {
      return acc + (pole.brightness / 100) * 0.15; // kW
    }, 0);

    return {
      allPolesCount: allPoles.length,
      onlinePolesCount: onlinePoles.length,
      avgBrightness,
      onlinePercentage,
      totalPowerLoad
    };
  }, [zones]); // Dependency array: only recalculate when zones change

  const getConnectionStatus = () => {
    switch (status) {
      case 'succeeded':
        return { text: 'Live', color: 'bg-green-400', pulse: true };
      case 'loading':
        return { text: 'Connecting', color: 'bg-yellow-400', pulse: true };
      case 'failed':
      case 'idle':
      default:
        return { text: 'Disconnected', color: 'bg-red-400', pulse: false };
    }
  };

  const connection = getConnectionStatus();

  // This is static for now, as it's not in the Redux slice
  const weatherAlert = {
    value: "Clear",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50"
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4 transition-colors">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <CloudSun className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Weather & Lighting Command</h1>
              <p className="text-gray-400 text-sm">
                Real-time environmental monitoring & smart grid control
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", connection.color, { 'animate-pulse': connection.pulse })} />
              <span className="text-sm text-gray-400">
                {connection.text}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Poles Online */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-sm">Poles Online</span>
            </div>
            <p className={cn("text-2xl font-bold", stats.onlinePercentage < 95 ? "text-yellow-400" : "text-white")}>
              {stats.onlinePolesCount} / {stats.allPolesCount}
            </p>
            <p className="text-xs text-gray-400">
              {stats.onlinePercentage.toFixed(1)}% operational
            </p>
          </div>

          {/* Avg. Brightness */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400 text-sm">Avg. Brightness</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgBrightness.toFixed(0)}%</p>
            <p className="text-xs text-gray-400">Network average</p>
          </div>

          {/* Est. Power Load */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-gray-400 text-sm">Est. Power Load</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalPowerLoad.toFixed(2)}</p>
            <p className="text-xs text-gray-400">kW</p>
          </div>

          {/* Weather Alert */}
          <div className={cn("rounded-lg p-4", weatherAlert.bgColor, weatherAlert.borderColor, "border")}>
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className={cn("w-4 h-4", weatherAlert.color)} />
              <span className="text-gray-400 text-sm">Weather Alert</span>
            </div>
            <p className={cn("text-2xl font-bold", weatherAlert.color)}>
              {weatherAlert.value}
            </p>
            <p className="text-xs text-gray-400">
              All systems normal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

