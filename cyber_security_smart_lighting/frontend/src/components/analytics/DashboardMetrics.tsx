// src/app/components/analytics/DashboardMetrics.tsx
// frontend/src/app/components/analytics/DashboardMetrics.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useDashboard } from '../../app/StoreProvider'; // Path is two levels up

// Define the MetricCard component here (or ensure it's imported correctly elsewhere)
const MetricCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-800 shadow-lg min-w-[150px]">
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-sm font-medium text-gray-400 mt-1">{title}</div>
    </div>
);


export const DashboardMetrics: React.FC = () => {
  const { data, isConnected } = useDashboard();
  const [isClient, setIsClient] = useState(false); // New State for Hydration Fix

  // Effect to confirm client-side execution, preventing Hydration error on Date/Time values
  useEffect(() => {
    setIsClient(true);
  }, []);

  const threatColor = data.threatLevel === 'SECURE' ? 'text-green-500' : 'text-red-500';
  
  // Use a placeholder until the client mounts to avoid hydration error
  const lastUpdateValue = isClient ? data.lastUpdate : '...'; 

  return (
    <div className="flex gap-4 p-4 justify-start overflow-x-auto">
      {/* 1. Active Units */}
      <MetricCard
        title="Active Units"
        value={`${data.activeUnits}/${data.totalUnits}`}
        color="text-green-500"
      />
      
      {/* 2. Avg Power */}
      <MetricCard
        title="Avg Power"
        value={`${data.avgPower}%`}
        color="text-yellow-400"
      />
      
      {/* 3. High Priority */}
      <MetricCard
        title="High Priority"
        value={data.highPriority}
        color="text-red-500"
      />
      
      {/* 4. Threat Level */}
      <MetricCard
        title="Threat Level"
        value={data.threatLevel}
        color={threatColor}
      />
      
      {/* 5. Last Update (The problematic metric) */}
      <MetricCard
        title="Last Update"
        value={lastUpdateValue} 
        color={isConnected ? 'text-blue-400' : 'text-gray-500'}
      />
    </div>
  );
};
// 'use client';

// import React from 'react';
// import { useDashboard } from '../../app/StoreProvider';

// const MetricCard: React.FC<{ title: string; value: string | number; color: string; }> = ({ title, value, color }) => (
//   <div className="flex flex-col items-center justify-center p-4 rounded-xl shadow-lg bg-gray-700 text-white min-w-[150px] border border-gray-600">
//     <div className={`text-2xl font-bold ${color}`}>{value}</div>
//     <div className="text-sm font-medium text-gray-400 mt-1">{title}</div>
//   </div>
// );

// export const DashboardMetrics: React.FC = () => {
//   const { data, isConnected } = useDashboard();
  
//   // Convert numeric threat level to display value
//   // Assuming: 0 = SECURE, 1+ = ALERT/WARNING, high numbers = CRITICAL
//   const getThreatDisplay = (level: number): string => {
//     if (level === 0) return 'SECURE';
//     if (level <= 2) return 'LOW';
//     if (level <= 5) return 'MEDIUM';
//     return 'HIGH';
//   };
  
//   const getThreatColor = (level: number): string => {
//     if (level === 0) return 'text-green-400';
//     if (level <= 2) return 'text-yellow-400';
//     if (level <= 5) return 'text-orange-400';
//     return 'text-red-500';
//   };
  
//   const threatDisplay = getThreatDisplay(data.threatLevel);
//   const threatColor = getThreatColor(data.threatLevel);
  
//   // Other metrics retain their yellow/green logic for warning signs
//   const unitsColor = data.activeUnits < data.totalUnits ? 'text-yellow-400' : 'text-green-400';
//   const highPriorityColor = data.highPriority > 0 ? 'text-red-500' : 'text-green-400';

//   return (
//     <div className="flex gap-4 p-4 justify-start overflow-x-auto bg-gray-900">
//       <MetricCard 
//         title="Active Units" 
//         value={`${data.activeUnits}/${data.totalUnits}`} 
//         color={unitsColor} 
//       />
//       <MetricCard 
//         title="Avg Power" 
//         value={`${data.avgPower}%`} 
//         color={data.avgPower > 80 ? 'text-yellow-400' : 'text-green-400'}
//       />
//       <MetricCard 
//         title="High Priority" 
//         value={data.highPriority} 
//         color={highPriorityColor} 
//       />
//       <MetricCard 
//         title="Threat Level" 
//         value={threatDisplay} 
//         color={threatColor} 
//       />
//       <MetricCard 
//         title="Last Update" 
//         value={data.lastUpdate} 
//         color={isConnected ? 'text-blue-400' : 'text-gray-500'} 
//       />
//     </div>
//   );
// };