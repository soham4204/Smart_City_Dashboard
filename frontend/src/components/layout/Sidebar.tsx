'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const weatherScenarios = [
  { 
    id: 'heavy_rainfall', 
    name: 'Heavy Rainfall',
    icon: '🌧️',
    description: 'Intense precipitation conditions',
    severity: 'high'
  },
  { 
    id: 'dense_fog', 
    name: 'Dense Fog',
    icon: '🌫️',
    description: 'Low visibility conditions',
    severity: 'medium'
  },
  { 
    id: 'cyclone_alert', 
    name: 'Cyclone Alert',
    icon: '🌪️',
    description: 'Extreme weather warning',
    severity: 'critical'
  },
  { 
    id: 'clear_sky', 
    name: 'Clear Sky',
    icon: '☀️',
    description: 'Return to normal conditions',
    severity: 'low'
  },
];

const severityStyles = {
  critical: 'border-red-500/30 bg-gradient-to-r from-red-900/20 to-red-800/10 hover:from-red-800/30 hover:to-red-700/20',
  high: 'border-orange-500/30 bg-gradient-to-r from-orange-900/20 to-orange-800/10 hover:from-orange-800/30 hover:to-orange-700/20',
  medium: 'border-yellow-500/30 bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 hover:from-yellow-800/30 hover:to-yellow-700/20',
  low: 'border-green-500/30 bg-gradient-to-r from-green-900/20 to-green-800/10 hover:from-green-800/30 hover:to-green-700/20'
};

export default function Sidebar() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [lastSimulation, setLastSimulation] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleSimulate = async (scenarioId: string) => {
    setIsLoading(scenarioId);
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulation/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId }),
      });
      if (!response.ok) throw new Error('Simulation request failed');
      const result = await response.json();
      console.log('Simulation successful:', result);
      setLastSimulation(scenarioId);
      
      // Show success feedback
      setTimeout(() => setLastSimulation(null), 3000);
    } catch (error) {
      console.error('Failed to run simulation:', error);
      // Better error handling with toast-like notification
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-900/90 border border-red-500/50 text-white px-4 py-3 rounded-lg shadow-lg z-50';
      errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <span>❌</span>
          <span>Simulation failed. Check server connection.</span>
        </div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => document.body.removeChild(errorDiv), 4000);
    } finally {
      setIsLoading(null);
    }
  };

  const handleCyberClick = () => {
    router.push('/cybersecurity');
  };

  const handleDashboardClick = () => {
    router.push('/');
  };

  const isCyberPage = pathname === '/cybersecurity';
  const isDashboardPage = pathname === '/';

  return (
    <div className="w-80 min-h-screen max-h-screen bg-gradient-to-b from-slate-900 via-gray-900 to-slate-900 text-white flex flex-col flex-shrink-0 border-r border-gray-700/50 shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-lg">🎛️</span>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Mission Control
            </h2>
            <p className="text-xs text-gray-400 mt-1">Smart City Operations</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6">
          {/* Status Indicator */}
          <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">System Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">OPERATIONAL</span>
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="space-y-6">
            {/* Dashboard Navigation */}
            <button
              onClick={handleDashboardClick}
              className={`
                w-full text-left p-4 rounded-xl transition-all duration-300
                border backdrop-blur-sm relative overflow-hidden group
                ${isDashboardPage 
                  ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-blue-500/50 ring-2 ring-blue-500/30' 
                  : 'border-blue-500/30 bg-gradient-to-r from-blue-900/20 to-cyan-800/10 hover:from-blue-800/30 hover:to-cyan-700/20'
                }
                hover:transform hover:scale-[1.02] hover:shadow-lg
              `}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🏙️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors">
                    Weather Dashboard
                  </h3>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    Environmental monitoring & control
                  </p>
                  {isDashboardPage && (
                    <span className="text-xs text-blue-400 font-medium">✓ ACTIVE</span>
                  )}
                </div>
              </div>
            </button>

            {/* Cybersecurity Navigation */}
            <button
              onClick={handleCyberClick}
              className={`
                w-full text-left p-4 rounded-xl transition-all duration-300
                border backdrop-blur-sm relative overflow-hidden group
                ${isCyberPage 
                  ? 'bg-gradient-to-r from-red-600/30 to-purple-600/30 border-red-500/50 ring-2 ring-red-500/30' 
                  : 'border-red-500/30 bg-gradient-to-r from-red-900/20 to-purple-800/10 hover:from-red-800/30 hover:to-purple-700/20'
                }
                hover:transform hover:scale-[1.02] hover:shadow-lg
              `}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🛡️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-red-200 transition-colors">
                    Cyber Defense
                  </h3>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    Security monitoring & SOAR pipeline
                  </p>
                  {isCyberPage && (
                    <span className="text-xs text-red-400 font-medium">✓ ACTIVE</span>
                  )}
                </div>
              </div>
            </button>

            {/* Weather Simulation Section - Only show on dashboard */}
            {isDashboardPage && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4 pt-4 border-t border-gray-700/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🌦️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Weather Simulation</h3>
                    <p className="text-xs text-gray-400">Environmental scenario testing</p>
                  </div>
                </div>

                {/* Scenario Buttons */}
                <div className="space-y-3">
                  {weatherScenarios.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => handleSimulate(scenario.id)}
                      disabled={!!isLoading}
                      className={`
                        group w-full text-left p-4 rounded-xl transition-all duration-300
                        border backdrop-blur-sm relative overflow-hidden
                        ${isLoading === scenario.id 
                          ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-500/50 cursor-wait' 
                          : severityStyles[scenario.severity as keyof typeof severityStyles]
                        }
                        ${isLoading && isLoading !== scenario.id 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:transform hover:scale-[1.02] hover:shadow-lg'
                        }
                        ${lastSimulation === scenario.id ? 'ring-2 ring-green-500/50' : ''}
                        disabled:transform-none
                      `}
                    >
                      {/* Loading overlay */}
                      {isLoading === scenario.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse" />
                      )}
                      
                      <div className="relative flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">{scenario.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-white group-hover:text-blue-200 transition-colors">
                              {scenario.name}
                            </h4>
                            {lastSimulation === scenario.id && (
                              <span className="text-xs text-green-400 font-medium">✓ ACTIVE</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">
                            {scenario.description}
                          </p>
                          {isLoading === scenario.id && (
                            <div className="flex items-center space-x-2 mt-2">
                              <div className="w-4 h-1 bg-blue-600/30 rounded-full overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
                              </div>
                              <span className="text-xs text-blue-400 font-medium">Simulating...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cybersecurity Info - Only show on cyber page */}
            {isCyberPage && (
              <div className="space-y-4 pt-4 border-t border-gray-700/30">
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span className="text-red-400 font-semibold text-sm">CYBER DEFENSE ACTIVE</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    SOAR pipeline monitoring all zones. Use the attack simulator to test response capabilities.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                    <p className="text-green-400 font-bold text-lg">5</p>
                    <p className="text-gray-400 text-xs">Protected Zones</p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                    <p className="text-cyan-400 font-bold text-lg">0</p>
                    <p className="text-gray-400 text-xs">Active Threats</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}