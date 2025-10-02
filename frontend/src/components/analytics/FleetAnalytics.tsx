// frontend/src/components/analytics/FleetAnalytics.tsx
'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

// Define the shape of a pole object to avoid using 'any'
interface LightPole {
  id: string;
  status: string;
  priority: string;
  manual_override: boolean;
}

const PriorityCard = ({ title, color, poles }: { title: string, color: string, poles: LightPole[] }) => {
  const total = poles.length;
  const online = poles.filter(p => p.status === 'ONLINE').length;
  const onlinePct = total > 0 ? (online / total) * 100 : 0;

  return (
    <div className="metric-card">
      <div className={`text-2xl font-bold ${color}`}>{online}/{total}</div>
      <div className="mt-2 text-gray-400">{title}</div>
      <div className={`mt-1 text-sm font-semibold ${color}`}>{onlinePct.toFixed(1)}% Online</div>
      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
        <div className={`bg-current ${color} h-1.5 rounded-full`} style={{ width: `${onlinePct}%` }}></div>
      </div>
    </div>
  );
};

export default function FleetAnalytics() {
  const { zones } = useSelector((state: RootState) => state.dashboard);

  const stats = useMemo(() => {
    const allPoles = zones.flatMap(zone => zone.poles);
    return {
      highPriority: allPoles.filter(p => p.priority === 'High'),
      mediumPriority: allPoles.filter(p => p.priority === 'Medium'),
      lowPriority: allPoles.filter(p => p.priority === 'Low'),
      manualOverride: allPoles.filter(p => p.manual_override).length,
    };
  }, [zones]);

  return (
    <>
      <h3 className="text-xl font-semibold mb-4 fade-in">📊 Live Fleet Analytics</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PriorityCard title="🛡️ High Priority" color="text-red-500" poles={stats.highPriority} />
        <PriorityCard title="⚠️ Medium Priority" color="text-orange-400" poles={stats.mediumPriority} />
        <PriorityCard title="📍 Low Priority" color="text-blue-400" poles={stats.lowPriority} />

        <div className="metric-card">
          <div className="text-2xl font-bold text-yellow-400">{stats.manualOverride}</div>
          <div className="mt-2 text-gray-400">🔓 Manual Override</div>
          <div className="mt-1 text-sm font-semibold text-yellow-400">Active Interventions</div>
        </div>
      </div>
    </>
  );
}