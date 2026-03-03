'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import LiveClockAndWeather from '@/components/analytics/LiveClockAndWeather';
import TrafficOverlay from '@/components/panels/TrafficOverlay';
import { Navigation, Activity, AlertTriangle, Clock } from 'lucide-react';

// Dynamically import the new Traffic Map to prevent SSR
const TrafficMapMain = dynamic(() => import('@/components/panels/TrafficMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center rounded-lg animate-pulse shadow-lg ring-1 ring-white/10 m-6"><span className="text-emerald-400 font-bold tracking-widest text-xl">LOADING TRAFFIC GRID...</span></div>
});

export default function TrafficPage() {
    const [routeData, setRouteData] = useState<any>(null);
    const [routeSummary, setRouteSummary] = useState<string | null>(null);
    const [impactState, setImpactState] = useState<string | null>(null);
    const [durationMin, setDurationMin] = useState<number | null>(null);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [weatherRefreshKey, setWeatherRefreshKey] = useState(0);
    const [activeHazardsCount, setActiveHazardsCount] = useState<number>(0);

    const fetchActiveHazards = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_TRAFFIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${baseUrl}/api/v1/traffic/weather-anomalies`);
            const data = await response.json();
            setActiveHazardsCount(Array.isArray(data) ? data.length : 0);
        } catch (e) {
            console.error("Failed to fetch active hazards:", e);
        }
    };

    // Initial fetch and sub-sync
    useEffect(() => {
        fetchActiveHazards();
    }, []);

    const handleWeatherSimulated = () => {
        setWeatherRefreshKey(prev => prev + 1);
        fetchActiveHazards(); // Immediate sync on simulation
    };

    const handleCalculateRoute = async (origin: [number, number], destination: [number, number]) => {
        setIsCalculating(true);
        setRouteSummary("Analyzing live traffic and weather conditions...");
        setImpactState(null);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_TRAFFIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${baseUrl}/api/v1/traffic/calculate-smart-route`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    origin: origin,
                    destination: destination
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.detail || "API Route request failed");
            }

            console.log("Routing Response:", data);
            setRouteData(data.geojson);
            setRouteSummary(data.route_summary);
            setImpactState(data.impact_state);
            setDurationMin(data.duration_min);
            setDistanceKm(data.distance_km);
            fetchActiveHazards(); // Also sync hazards on route calc
        } catch (e: any) {
            console.error(e);
            setRouteSummary(e.message || "Failed to calculate route. Ensure Backend is running.");
            setImpactState("Error");
        } finally {
            setIsCalculating(false);
        }
    };

    const clearRoute = () => {
        setRouteData(null);
        setRouteSummary(null);
        setImpactState(null);
        setDurationMin(null);
        setDistanceKm(null);
    };

    return (
        <div className="flex h-screen bg-[#020617] text-white overflow-hidden font-sans selection:bg-emerald-500/30">
            <Sidebar />

            <div className="flex-1 flex flex-col p-8 overflow-hidden">
                {/* Header Elements */}
                <div className="flex justify-between items-start shrink-0 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent transition-all hover:brightness-110">
                            Traffic & Pathfinding
                        </h1>
                        <p className="text-slate-400 mt-1 uppercase tracking-[0.2em] text-[10px] font-black opacity-60 flex items-center gap-2">
                            <span className="w-2 h-[1px] bg-slate-700"></span>
                            Live ArcGIS Network Analytics • v2.6.4
                        </p>
                    </div>
                    <LiveClockAndWeather />
                </div>

                {/* Mission Metrics Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 animate-in slide-in-from-top-4 duration-700">
                    {[
                        {
                            label: 'Active Hazards',
                            value: activeHazardsCount > 0 ? `${activeHazardsCount} Hazards Active` : 'None',
                            subValue: activeHazardsCount > 0 ? 'Emergency Response Active' : 'All Systems Normal',
                            icon: AlertTriangle,
                            color: activeHazardsCount > 0 ? 'red' : 'emerald',
                            alert: activeHazardsCount > 0
                        },
                        { label: 'Network Integrity', value: '98.4%', subValue: 'Encrypted Grid Link', icon: Activity, color: 'emerald', alert: false },
                        { label: 'Route ETA', value: durationMin ? `${durationMin} mins` : '--', subValue: 'Optimized Flow', icon: Clock, color: 'blue', alert: false },
                        { label: 'Total Distance', value: distanceKm ? `${distanceKm} km` : '--', subValue: 'Smart Evasive Path', icon: Navigation, color: 'teal', alert: false }
                    ].map((metric, idx) => (
                        <div key={idx} className={`relative overflow-hidden transition-all duration-300 border border-white/5 rounded-2xl p-5 group cursor-default shadow-2xl hover:border-white/10 ${metric.alert
                                ? 'bg-red-500/10'
                                : metric.color === 'emerald'
                                    ? 'bg-emerald-500/10'
                                    : 'bg-slate-900/40'
                            }`}>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`p-3 rounded-xl transition-transform duration-500 group-hover:scale-110 ${metric.alert ? 'bg-red-500/20 text-red-400' :
                                    metric.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                                        `bg-${metric.color}-500/10 text-${metric.color}-400`
                                    }`}>
                                    <metric.icon className={`w-6 h-6 ${metric.alert ? 'animate-pulse' : ''}`} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{metric.label}</p>
                                    <p className={`text-lg font-black leading-tight ${metric.alert ? 'text-red-400' :
                                        metric.color === 'emerald' ? 'text-emerald-400' : 'text-slate-200'
                                        }`}>
                                        {metric.value}
                                    </p>
                                    <p className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter mt-1 opacity-80">{metric.subValue}</p>
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${metric.alert ? 'bg-red-500' :
                                metric.color === 'emerald' ? 'bg-emerald-500' : `bg-${metric.color}-500`
                                }`} />
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0 mt-8">
                    {/* Left & Middle: Traffic Map (3/4) */}
                    <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur border border-white/10 rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative min-h-[500px] ring-1 ring-white/5 transition-all hover:ring-white/10 group">
                        <TrafficMapMain routeData={routeData} refreshKey={weatherRefreshKey} />
                    </div>

                    {/* Right Column: Controls & Analysis (1/4) */}
                    <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-4">
                        <div className="bg-transparent animate-in slide-in-from-right-4 duration-700 delay-150">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Intelligence
                                </h3>
                                <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">
                                    Live Sync
                                </div>
                            </div>
                            <TrafficOverlay
                                onCalculateRoute={handleCalculateRoute}
                                routeSummary={routeSummary}
                                impactState={impactState}
                                durationMin={durationMin}
                                distanceKm={distanceKm}
                                onClear={clearRoute}
                                onWeatherSimulated={handleWeatherSimulated}
                            />
                        </div>

                        {/* Network Diagnostics */}
                        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-300 hover:border-white/10 transition-all group">
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 group-hover:text-slate-400 transition-colors">
                                    <Activity className="w-3 h-3" /> Digital Twin Status
                                </h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'OSRM Logic', status: 'Optimal', color: 'emerald' },
                                        { label: 'ArcGIS Flow', status: 'Live', color: 'blue' },
                                        { label: 'Weather Link', status: 'Synced', color: 'teal' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 transition-all hover:bg-white/[0.08] hover:translate-x-1">
                                            <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                                            <span className={`text-[9px] font-black uppercase text-${item.color}-400 bg-${item.color}-400/10 px-2 py-0.5 rounded-md border border-${item.color}-400/20 shadow-sm`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-white/5">
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mb-2">
                                    <span>Engine Load</span>
                                    <span>24%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full w-[24%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
