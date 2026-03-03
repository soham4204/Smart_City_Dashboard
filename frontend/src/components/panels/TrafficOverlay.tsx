'use client';

import { useState } from 'react';
import { MapPin, Navigation, AlertTriangle, CheckCircle2, Clock, Activity, Info } from 'lucide-react';
import AsyncSelect from 'react-select/async';

interface TrafficOverlayProps {
    onCalculateRoute: (origin: [number, number], destination: [number, number]) => void;
    routeSummary: string | null;
    impactState: string | null;
    durationMin: number | null;
    distanceKm: number | null;
    onClear: () => void;
    onWeatherSimulated: () => void;
}

export default function TrafficOverlay({
    onCalculateRoute,
    routeSummary,
    impactState,
    durationMin,
    distanceKm,
    onClear,
    onWeatherSimulated
}: TrafficOverlayProps) {
    // Default locations for Mumbai to provide instant options
    const MUMBAI_DEFAULTS = [
        { label: "Gateway of India, Mumbai", value: "[72.8347, 18.9220]" },
        { label: "Dadar Station, Mumbai", value: "[72.8427, 19.0193]" },
        { label: "Andheri Station, Mumbai", value: "[72.8464, 19.1197]" },
        { label: "Bandra Kurla Complex (BKC)", value: "[72.8656, 19.0658]" },
        { label: "Chhatrapati Shivaji Maharaj Terminus (CSMT)", value: "[72.8351, 18.9398]" }
    ];

    const [loading, setLoading] = useState(false);
    const [simRegion, setSimRegion] = useState("");
    const [simCondition, setSimCondition] = useState("");

    // Selected options from react-select
    const [originOption, setOriginOption] = useState<{ value: string, label: string } | null>(null);
    const [destOption, setDestOption] = useState<{ value: string, label: string } | null>(null);

    // Resolved Coordinates
    const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
    const [destCoords, setDestCoords] = useState<[number, number] | null>(null);

    // Fetch Autosuggestions from Nominatim
    const loadOptions = async (inputValue: string) => {
        if (!inputValue || inputValue.length < 2) return [];

        // Append Mumbai to queries automatically to find local places
        const query = inputValue.toLowerCase().includes("mumbai") ? inputValue : `${inputValue} Mumbai`;

        // Fallback filter
        const fallbackResults = MUMBAI_DEFAULTS.filter(def =>
            def.label.toLowerCase().includes(inputValue.toLowerCase())
        );

        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
            const res = await fetch(url, { headers: { "User-Agent": "SmartCityDashboard/1.0" } });

            // If rate limited or failed, return the fallback
            if (!res.ok) return fallbackResults;

            const data = await res.json();

            // If the API found no results, also return the fallback
            if (!data || data.length === 0) return fallbackResults;

            // Otherwise, map and return the API results
            return data.map((item: any) => ({
                label: item.display_name.split(',').slice(0, 3).join(', '), // Shorter display name
                value: JSON.stringify([parseFloat(item.lon), parseFloat(item.lat)])
            }));
        } catch (e) {
            console.error("Autosuggest failed: ", e);
            return fallbackResults;
        }
    };

    const handleCalculate = async () => {
        if (!originOption || !destOption) return;
        setLoading(true);

        try {
            const oCoords = JSON.parse(originOption.value) as [number, number];
            const dCoords = JSON.parse(destOption.value) as [number, number];

            setOriginCoords(oCoords);
            setDestCoords(dCoords);
            onCalculateRoute(oCoords, dCoords);
        } catch (e) {
            console.error("Could not parse coordinates", e);
            alert("Error parsing selected locations.");
        } finally {
            setLoading(false);
        }
    };

    const handleSimulateWeather = async () => {
        if (!simRegion || !simCondition) return;
        setLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_TRAFFIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiBase}/api/v1/traffic/simulate-weather`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region: simRegion, condition: simCondition })
            });
            if (res.ok) {
                onWeatherSimulated();
            }
        } catch (e) {
            console.error("Simulation failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleClearWeather = async () => {
        setLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_TRAFFIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiBase}/api/v1/traffic/clear-weather`, { method: 'DELETE' });
            if (res.ok) {
                setSimRegion("");
                setSimCondition("");
                onWeatherSimulated();
            }
        } catch (e) {
            console.error("Clear failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleLocalClear = () => {
        setOriginOption(null);
        setDestOption(null);
        setOriginCoords(null);
        setDestCoords(null);
        onClear();
    };

    // Dark theme styles for react-select
    const selectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            backgroundColor: 'rgba(15, 23, 42, 0.6)', // slate-900/60
            borderColor: state.isFocused ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
            boxShadow: state.isFocused ? '0 0 0 1px rgba(16, 185, 129, 0.2)' : 'none',
            color: 'white',
            padding: '2px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.2)'
            }
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            overflow: 'hidden',
            zIndex: 100,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            color: state.isFocused ? '#10b981' : 'white',
            padding: '10px 12px',
            '&:active': {
                backgroundColor: 'rgba(16, 185, 129, 0.2)'
            }
        }),
        singleValue: (base: any) => ({
            ...base,
            color: '#e2e8f0', // slate-200
            fontWeight: '500'
        }),
        input: (base: any) => ({
            ...base,
            color: 'white',
            "input": { color: "white !important" }
        }),
        placeholder: (base: any) => ({
            ...base,
            color: '#64748b' // slate-500
        })
    };

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 transition-all duration-500 hover:ring-white/10">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                    <Navigation className="w-5 h-5" />
                    <h3 className="font-semibold tracking-wide text-xs uppercase">Route Parameters</h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">

                {/* Search Origin */}
                <div className="space-y-1 z-50">
                    <label className="text-slate-500 text-[10px] font-bold px-1 flex items-center gap-1 uppercase tracking-widest">
                        <MapPin className="w-3 h-3 text-emerald-500" /> Origin
                    </label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={loadOptions}
                        defaultOptions={MUMBAI_DEFAULTS}
                        value={originOption}
                        onChange={(val: any) => setOriginOption(val)}
                        placeholder="Select Origin..."
                        styles={selectStyles}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    />
                </div>

                {/* Search Destination */}
                <div className="space-y-1 z-40">
                    <label className="text-slate-500 text-[10px] font-bold px-1 flex items-center gap-1 uppercase tracking-widest">
                        <MapPin className="w-3 h-3 text-violet-500" /> Destination
                    </label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={loadOptions}
                        defaultOptions={MUMBAI_DEFAULTS}
                        value={destOption}
                        onChange={(val: any) => setDestOption(val)}
                        placeholder="Select Destination..."
                        styles={selectStyles}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 z-10">
                    <button
                        onClick={handleLocalClear}
                        className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all uppercase tracking-wider active:scale-95"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleCalculate}
                        disabled={!originOption || !destOption || loading}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2 relative group overflow-hidden uppercase tracking-widest"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[20deg]" />
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Activity className="w-4 h-4" />
                        )}
                        <span className="relative z-10">{loading ? 'Computing...' : 'Calculate Route'}</span>
                    </button>
                </div>

                {/* --- WEATHER SIMULATION CONTROL --- */}
                <div className="pt-2 border-t border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                        <AlertTriangle className="w-3 h-3 text-orange-500" /> Environment Simulation
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <select
                            className="bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                            onChange={(e) => setSimRegion(e.target.value)}
                            value={simRegion}
                        >
                            <option value="">Select Region...</option>
                            <option value="Colaba">Colaba</option>
                            <option value="Dadar">Dadar</option>
                            <option value="BKC">BKC</option>
                            <option value="Andheri">Andheri</option>
                            <option value="Borivali">Borivali</option>
                        </select>
                        <select
                            className="bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                            onChange={(e) => setSimCondition(e.target.value)}
                            value={simCondition}
                        >
                            <option value="">Condition...</option>
                            <option value="Cyclone">Cyclone</option>
                            <option value="Heavy Rain">Heavy Rain</option>
                            <option value="Dense Fog">Dense Fog</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleClearWeather}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                        >
                            Reset sky
                        </button>
                        <button
                            onClick={handleSimulateWeather}
                            disabled={!simRegion || !simCondition || loading}
                            className="flex-[2] py-3 bg-orange-500/10 hover:bg-orange-600/20 border border-orange-500/30 text-orange-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2 relative overflow-hidden group active:scale-95 shadow-lg shadow-orange-500/10"
                        >
                            <div className="absolute inset-0 bg-orange-400/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[20deg]" />
                            <Activity className="w-4 h-4" />
                            Launch Hazard
                        </button>
                    </div>
                </div>

                {/* --- IMPORTANT METRICS DISPLAY --- */}
                {durationMin !== null && distanceKm !== null && impactState !== 'Error' && (
                    <div className="grid grid-cols-2 gap-3 animate-in zoom-in-95 duration-300">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center group transition-all hover:bg-emerald-500/10">
                            <Clock className="w-5 h-5 text-emerald-400 mb-1 pointer-events-none group-hover:scale-110 transition-transform" />
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">EST. DURATION</div>
                            <div className="text-lg font-black text-emerald-400">{durationMin} <span className="text-[10px] font-light italic">min</span></div>
                        </div>
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center group transition-all hover:bg-blue-500/10">
                            <Navigation className="w-5 h-5 text-blue-400 mb-1 pointer-events-none group-hover:scale-110 transition-transform" />
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">TOTAL DISTANCE</div>
                            <div className="text-lg font-black text-blue-400">{distanceKm} <span className="text-[10px] font-light italic">km</span></div>
                        </div>
                    </div>
                )}

                {/* Summary / Analysis Output */}
                {routeSummary && (
                    <div className={`p-4 rounded-2xl border text-[11px] font-medium leading-relaxed flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-400 ${impactState === 'Route Impacted by Weather'
                        ? 'bg-orange-500/5 border-orange-500/30 text-orange-200'
                        : impactState === 'Clear'
                            ? 'bg-slate-800/40 border-white/5 text-slate-300'
                            : 'bg-red-500/5 border-red-500/30 text-red-200'
                        }`}>
                        <div className="mt-0.5">
                            {impactState === 'Route Impacted by Weather' ? (
                                <AlertTriangle className="w-4 h-4 text-orange-400" />
                            ) : impactState === 'Clear' ? (
                                <Info className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <span className="block text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">Intelligence Insight</span>
                            {routeSummary}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
