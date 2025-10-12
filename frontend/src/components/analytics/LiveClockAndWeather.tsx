// frontend/src/components/analytics/LiveClockAndWeather.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, Wind } from 'lucide-react';

// This is a simplified weather data structure.
// In a real app, you'd fetch this from a weather API.
interface LiveWeather {
  temp: number;
  condition: string;
  icon: React.ReactNode;
}

export default function LiveClockAndWeather() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<LiveWeather | null>(null);

  useEffect(() => {
    // Clock interval
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Fetch mock weather data
    // In a real application, you would fetch this from a weather API
    const fetchWeather = () => {
        // Mock data that changes based on the time
        const hour = new Date().getHours();
        if (hour > 6 && hour < 19) {
            setWeather({ temp: 31, condition: 'Sunny', icon: <Sun className="w-10 h-10 text-yellow-400" /> });
        } else {
             setWeather({ temp: 26, condition: 'Clear Night', icon: <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg> });
        }
    };
    
    fetchWeather();
    // Update weather every 5 minutes
    const weatherInterval = setInterval(fetchWeather, 300000);

    return () => {
      clearInterval(timer);
      clearInterval(weatherInterval);
    };
  }, []);

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/30 p-4 flex justify-between items-center">
      {/* Time and Date */}
      <div>
        <div className="text-3xl font-bold text-white">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-sm text-gray-400">
          {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      {/* Weather */}
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