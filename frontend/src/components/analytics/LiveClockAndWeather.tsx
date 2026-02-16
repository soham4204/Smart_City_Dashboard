// frontend/src/components/analytics/LiveClockAndWeather.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sun } from 'lucide-react';

interface LiveWeather {
  temp: number;
  condition: string;
  icon: React.ReactNode;
}

export default function LiveClockAndWeather() {
  // Fix 1: Initialize with null to prevent Hydration Mismatch
  const [time, setTime] = useState<Date | null>(null);
  const [weather, setWeather] = useState<LiveWeather | null>(null);

  useEffect(() => {
    // Set time immediately on client mount
    setTime(new Date());
    
    const timer = setInterval(() => setTime(new Date()), 1000);

    const fetchWeather = () => {
        const hour = new Date().getHours();
        if (hour > 6 && hour < 19) {
            setWeather({ temp: 31, condition: 'Sunny', icon: <Sun className="w-10 h-10 text-yellow-400" /> });
        } else {
             // Fix 2, 3, 4: Use camelCase for SVG attributes (strokeWidth, strokeLinecap, strokeLinejoin)
             setWeather({ 
               temp: 26, 
               condition: 'Clear Night', 
               icon: (
                 <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                 </svg>
               )
             });
        }
    };
    
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 300000);

    return () => {
      clearInterval(timer);
      clearInterval(weatherInterval);
    };
  }, []);

  // Prevent rendering until client-side hydration is complete
  if (!time) return <div className="bg-gray-800/50 rounded-xl border border-gray-700/30 p-4 h-24 animate-pulse" />;

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/30 p-4 flex justify-between items-center">
      <div>
        <div className="text-3xl font-bold text-white">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-sm text-gray-400">
          {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      {weather && (
        <div className="flex items-center space-x-4">
          <div className="text-4xl">
            {weather.icon}
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{weather.temp}°C</div>
            <div className="text-sm text-gray-400">{weather.condition}</div>
          </div>
        </div>
      )}
    </div>
  );
}