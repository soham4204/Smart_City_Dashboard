'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

export default function DashboardMetrics() {
  const { zones } = useSelector((state: RootState) => state.dashboard);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('--:--:--');
  const [isClient, setIsClient] = useState(false);

  // useMemo will re-calculate stats only when the 'zones' data changes
  const stats = useMemo(() => {
    const allPoles = zones.flatMap(zone => zone.poles);
    const onlinePoles = allPoles.filter(p => p.status === 'ONLINE');
    
    const totalPoles = allPoles.length;
    const onlineCount = onlinePoles.length;
    
    const avgBrightness = onlinePoles.length > 0
      ? onlinePoles.reduce((acc, p) => acc + p.brightness, 0) / onlinePoles.length
      : 0;
      
    const highPriorityCount = allPoles.filter(p => p.priority === 'High').length;

    return {
      totalPoles,
      onlineCount,
      avgBrightness,
      highPriorityCount,
    };
  }, [zones]);

  // Handle client-side hydration and time updates
  useEffect(() => {
    setIsClient(true);
    
    const updateTime = () => {
      setLastUpdateTime(new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    };

    // Set initial time
    updateTime();
    
    // Update time every second
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h3 className="text-xl font-semibold mb-4 fade-in">📊 Smart City Dashboard</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Active Units Card */}
        <div className="metric-card fade-in">
          <div className="text-3xl font-bold text-green-400">{stats.onlineCount}/{stats.totalPoles}</div>
          <div className="mt-2 text-gray-400">🟢 Active Units</div>
        </div>

        {/* Average Power Card */}
        <div className="metric-card fade-in">
          <div className="text-3xl font-bold text-yellow-400">{stats.avgBrightness.toFixed(0)}%</div>
          <div className="mt-2 text-gray-400">⚡ Avg Power</div>
        </div>

        {/* High Priority Card */}
        <div className="metric-card fade-in">
          <div className="text-3xl font-bold text-red-500">{stats.highPriorityCount}</div>
          <div className="mt-2 text-gray-400">🛡 High Priority</div>
        </div>

        {/* Threat Level Card */}
        <div className="metric-card fade-in">
          <div className="text-3xl font-bold text-green-400">SECURE</div>
          <div className="mt-2 text-gray-400">🚨 Threat Level</div>
        </div>

        {/* Last Update Card */}
        <div className="metric-card fade-in">
          <div className="text-2xl font-bold text-cyan-400">
            {isClient ? lastUpdateTime : '--:--:--'}
          </div>
          <div className="mt-2 text-gray-400">🕐 Last Update</div>
        </div>
      </div>
    </>
  );
}