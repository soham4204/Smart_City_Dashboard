'use client';

import { useState } from 'react';
import { MapPin, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AsyncSelect from 'react-select/async';

interface TrafficOverlayProps {
    onCalculateRoute: (origin: [number, number], destination: [number, number]) => void;
    routeSummary: string | null;
    impactState: string | null;
    onClear: () => void;
}

export default function TrafficOverlay({
    onCalculateRoute,
    routeSummary,
    impactState,
    onClear
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

    const handleLocalClear = () => {
        setOriginOption(null);
        setDestOption(null);
        setOriginCoords(null);
        setDestCoords(null);
        onClear();
    };

    // Dark theme styles for react-select
    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: '#1e293b', // bg-slate-800
            borderColor: '#334155', // border-slate-700
            color: 'white',
            padding: '2px',
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: '#0f172a', // bg-slate-900
            zIndex: 50
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused ? '#1e293b' : '#0f172a',
            color: 'white',
            '&:active': {
                backgroundColor: '#334155'
            }
        }),
        singleValue: (base: any) => ({
            ...base,
            color: 'white'
        }),
        input: (base: any) => ({
            ...base,
            color: 'white',
            "input": {
                color: "white !important"
            }
        }),
        placeholder: (base: any) => ({
            ...base,
            color: '#64748b' // text-slate-500
        })
    };

    return (
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                    <Navigation className="w-5 h-5" />
                    <h3 className="font-semibold tracking-wide">Route Finder</h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">

                {/* Search Origin */}
                <div className="space-y-1 z-50">
                    <label className="text-slate-400 text-xs font-semibold px-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" /> ORIGIN
                    </label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={loadOptions}
                        defaultOptions={MUMBAI_DEFAULTS}
                        value={originOption}
                        onChange={(val: any) => setOriginOption(val)}
                        placeholder="e.g. Gateway of India"
                        styles={selectStyles}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        noOptionsMessage={(obj: any) => {
                            if (!obj.inputValue) return "Type to search locations...";
                            if (obj.inputValue.length < 3) return "Type at least 3 characters...";
                            return "No locations found.";
                        }}
                    />
                </div>

                {/* Search Destination */}
                <div className="space-y-1 z-40">
                    <label className="text-slate-400 text-xs font-semibold px-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-400" /> DESTINATION
                    </label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={loadOptions}
                        defaultOptions={MUMBAI_DEFAULTS}
                        value={destOption}
                        onChange={(val: any) => setDestOption(val)}
                        placeholder="e.g. Dadar Station, Mumbai"
                        styles={selectStyles}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        noOptionsMessage={(obj: any) => {
                            if (!obj.inputValue) return "Type to search locations...";
                            if (obj.inputValue.length < 3) return "Type at least 3 characters...";
                            return "No locations found.";
                        }}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 z-10">
                    <button
                        onClick={handleLocalClear}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleCalculate}
                        disabled={!originOption || !destOption || loading}
                        className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {loading ? 'Routing...' : 'Calculate Route'}
                    </button>
                </div>

                {/* Summary Output */}
                {routeSummary && (
                    <div className={`mt-4 p-3 rounded-lg border text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${impactState === 'Route Impacted by Weather'
                        ? 'bg-orange-900/20 border-orange-500/50 text-orange-200'
                        : impactState === 'Clear'
                            ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-200'
                            : 'bg-red-900/20 border-red-500/50 text-red-200'
                        }`}>
                        {impactState === 'Route Impacted by Weather' ? (
                            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        ) : impactState === 'Clear' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className="leading-relaxed">{routeSummary}</p>
                            {/* Optional: Show resolved coordinates to prove we queried them */}
                            {originCoords && destCoords && impactState !== 'Error' && (
                                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                                    Resolved: {originCoords[1].toFixed(2)},{originCoords[0].toFixed(2)} → {destCoords[1].toFixed(2)},{destCoords[0].toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
