'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import LiveClockAndWeather from '@/components/analytics/LiveClockAndWeather';
import TrafficOverlay from '@/components/panels/TrafficOverlay';
import { Navigation, Activity } from 'lucide-react';

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

    // The controls to inject into the general mission control Sidebar
    const trafficControls = (
        <TrafficOverlay
            onCalculateRoute={handleCalculateRoute}
            routeSummary={routeSummary}
            impactState={impactState}
            durationMin={durationMin}
            distanceKm={distanceKm}
            onClear={clearRoute}
        />
    );

    return (
        <div className="flex h-screen bg-[#020617] text-white overflow-hidden font-sans selection:bg-emerald-500/30">
            <Sidebar />

            <div className="flex-1 flex flex-col p-8 overflow-y-auto space-y-8">
                {/* Header Elements */}
                <div className="flex justify-between items-start shrink-0 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Traffic & Pathfinding
                        </h1>
                        <p className="text-slate-400 mt-1">Live ArcGIS Network Analytics</p>
                    </div>
                    <LiveClockAndWeather />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
                    {/* Left & Middle: Traffic Map (3/4) */}
                    <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur border border-white/10 rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative min-h-[600px] ring-1 ring-white/5 transition-all hover:ring-white/10 group">
                        <TrafficMapMain routeData={routeData} />
                    </div>

                    {/* Right Column: Controls & Analysis (1/4) */}
                    <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-1">
                        <div className="bg-transparent">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    System Controls
                                </h3>
                                <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500">
                                    ENCRYPTED
                                </div>
                            </div>
                            <TrafficOverlay
                                onCalculateRoute={handleCalculateRoute}
                                routeSummary={routeSummary}
                                impactState={impactState}
                                durationMin={durationMin}
                                distanceKm={distanceKm}
                                onClear={clearRoute}
                            />
                        </div>

                        {/* Network Diagnostics */}
                        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Navigation className="w-3 h-3" /> Digital Twin Status
                                </h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'OSRM Logic', status: 'Optimal', color: 'emerald' },
                                        { label: 'ArcGIS Flow', status: 'Live', color: 'blue' },
                                        { label: 'Weather Link', status: 'Synced', color: 'teal' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 transition-colors hover:bg-white/[0.08]">
                                            <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                                            <span className={`text-[10px] font-black uppercase text-${item.color}-400 bg-${item.color}-400/10 px-2 py-1 rounded-md border border-${item.color}-400/20`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mb-2">
                                    <span>Network Load</span>
                                    <span>64%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full w-[64%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
