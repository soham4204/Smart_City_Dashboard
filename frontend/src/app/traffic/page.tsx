'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import LiveClockAndWeather from '@/components/analytics/LiveClockAndWeather';
import TrafficOverlay from '@/components/panels/TrafficOverlay';

// Dynamically import the new Traffic Map to prevent SSR
const TrafficMapMain = dynamic(() => import('@/components/panels/TrafficMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center rounded-lg animate-pulse shadow-lg ring-1 ring-white/10 m-6"><span className="text-emerald-400 font-bold tracking-widest text-xl">LOADING TRAFFIC GRID...</span></div>
});

export default function TrafficPage() {
    const [routeData, setRouteData] = useState<any>(null);
    const [routeSummary, setRouteSummary] = useState<string | null>(null);
    const [impactState, setImpactState] = useState<string | null>(null);
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

            if (!response.ok) throw new Error("API Route request failed");

            const data = await response.json();
            console.log("Routing Response:", data);
            setRouteData(data.geojson);
            setRouteSummary(data.route_summary);
            setImpactState(data.impact_state);
        } catch (e) {
            console.error(e);
            setRouteSummary("Failed to calculate route. Ensure Backend is running.");
            setImpactState("Error");
        } finally {
            setIsCalculating(false);
        }
    };

    const clearRoute = () => {
        setRouteData(null);
        setRouteSummary(null);
        setImpactState(null);
    };

    // The controls to inject into the general mission control Sidebar
    const trafficControls = (
        <TrafficOverlay
            onCalculateRoute={handleCalculateRoute}
            routeSummary={routeSummary}
            impactState={impactState}
            onClear={clearRoute}
        />
    );

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* 1. Sidebar with injected routing controls */}
            <Sidebar trafficControls={trafficControls} />

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                {/* Header Elements */}
                <div className="flex justify-between items-start mb-6 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Traffic & Pathfinding
                        </h1>
                        <p className="text-gray-400 mt-1">Live ArcGIS Network Analytics</p>
                    </div>
                    <LiveClockAndWeather />
                </div>

                {/* Traffic Map Rendering */}
                <div className="flex-1 min-h-0 bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-2xl relative">
                    <TrafficMapMain routeData={routeData} />
                </div>
            </div>
        </div>
    );
}
