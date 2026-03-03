'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as esri from 'esri-leaflet';

// --- Custom SVG Icons ---
const createPulseIcon = (color: string) => L.divIcon({
    className: 'custom-pulse-icon',
    html: `
        <div class="relative flex items-center justify-center">
            <div class="absolute w-4 h-4 rounded-full animate-ping opacity-75" style="background-color: ${color}"></div>
            <div class="relative w-3 h-3 rounded-full border-2 border-white shadow-lg" style="background-color: ${color}"></div>
        </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

interface TrafficMapProps {
    routeData?: any; // Expects GeoJSON
    refreshKey?: number;
}

export default function TrafficMap({ routeData, refreshKey = 0 }: TrafficMapProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerGroupRef = useRef<L.LayerGroup | null>(null);
    const weatherLayerGroupRef = useRef<L.LayerGroup | null>(null);

    const fetchAnomalies = async () => {
        if (!mapRef.current || !weatherLayerGroupRef.current) return;

        try {
            const apiBase = process.env.NEXT_PUBLIC_TRAFFIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiBase}/api/v1/traffic/weather-anomalies`);
            const anomalies = await res.json();

            weatherLayerGroupRef.current.clearLayers();

            anomalies.forEach((anomaly: any) => {
                const center: [number, number] = [
                    (anomaly.bbox_min_lat + anomaly.bbox_max_lat) / 2,
                    (anomaly.bbox_min_lon + anomaly.bbox_max_lon) / 2
                ];

                const bounds: L.LatLngBoundsExpression = [
                    [anomaly.bbox_min_lat, anomaly.bbox_min_lon],
                    [anomaly.bbox_max_lat, anomaly.bbox_max_lon]
                ];

                // Boundary Rectangle
                const color = anomaly.condition === 'Cyclone' ? '#ef4444' : anomaly.condition === 'Heavy Rain' ? '#f97316' : '#94a3b8';
                L.rectangle(bounds, {
                    color: color,
                    weight: 1,
                    fillOpacity: 0.1,
                    dashArray: '5, 5'
                }).addTo(weatherLayerGroupRef.current!);

                // Weather Icon
                let iconHtml = '';
                if (anomaly.condition === 'Cyclone') {
                    iconHtml = `
                        <div class="relative group">
                            <div class="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                            <div class="relative p-2.5 bg-red-500/30 backdrop-blur-xl border border-red-500/50 rounded-full text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all group-hover:scale-110">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-spin-slow"><path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H5"/><path d="M16 16H8"/><path d="M11 20h2"/></svg>
                            </div>
                        </div>
                    `;
                } else if (anomaly.condition === 'Heavy Rain') {
                    iconHtml = `
                        <div class="relative group">
                            <div class="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse"></div>
                            <div class="relative p-2.5 bg-blue-600/30 backdrop-blur-xl border border-blue-400/50 rounded-full text-blue-100 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all group-hover:scale-110">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19c.3 0 .5-.2.5-.5V10c0-3-2.5-5.5-5.5-5.5S7 7 7 10v8.5c0 .3.2.5.5.5h10Z"/><path d="M12 19v3"/><path d="M9 19v3"/><path d="M15 19v3"/></svg>
                            </div>
                        </div>
                    `;
                } else {
                    iconHtml = `
                        <div class="relative group">
                            <div class="absolute inset-0 bg-slate-500/20 rounded-full"></div>
                            <div class="relative p-2.5 bg-slate-600/30 backdrop-blur-xl border border-slate-400/50 rounded-full text-slate-100 shadow-[0_0_20px_rgba(71,85,105,0.4)] transition-all group-hover:scale-110">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.89 6.73 17H13a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H4"/><path d="M5 12V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3"/><circle cx="12" cy="12" r="10"/></svg>
                            </div>
                        </div>
                    `;
                }

                L.marker(center, {
                    icon: L.divIcon({
                        className: 'weather-icon-marker',
                        html: iconHtml,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                    })
                }).addTo(weatherLayerGroupRef.current!)
                    .bindTooltip(`
                    <div class="bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg shadow-2xl">
                        <span class="text-[10px] font-black uppercase text-white tracking-widest">${anomaly.condition} HAZARD</span>
                        <div class="text-[8px] text-slate-400 uppercase font-bold mt-0.5">Automated Evasive Protocol Active</div>
                    </div>
                  `, { direction: 'top', className: 'custom-weather-tooltip', offset: [0, -20] });
            });
        } catch (e) {
            console.error("Anomalies fetch failed", e);
        }
    };

    useEffect(() => {
        // Initialize map only once
        if (!mapRef.current && mapContainerRef.current) {
            const map = L.map(mapContainerRef.current).setView([19.0760, 72.8777], 12); // Mumbai

            // Dark theme map layer
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap & CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            // Live Traffic Layer from ArcGIS
            const apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY || '';
            esri.dynamicMapLayer({
                url: 'https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer',
                opacity: 0.7,
                token: apiKey
            }).addTo(map);

            layerGroupRef.current = L.layerGroup().addTo(map);
            weatherLayerGroupRef.current = L.layerGroup().addTo(map);
            mapRef.current = map;

            // Add Legend
            const legend = new L.Control({ position: 'bottomleft' });
            legend.onAdd = () => {
                const div = L.DomUtil.create('div', 'info legend');
                div.innerHTML = `
                    <div class="bg-gray-900/80 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl text-[10px] font-mono tracking-tighter">
                        <div class="text-emerald-400 font-bold mb-2 uppercase opacity-70">Traffic Density</div>
                        <div class="space-y-1.5 text-gray-300">
                            <div class="flex items-center gap-2"><div class="w-2.5 h-1 rounded bg-green-500"></div> Low (Clear)</div>
                            <div class="flex items-center gap-2"><div class="w-2.5 h-1 rounded bg-orange-500"></div> Moderate</div>
                            <div class="flex items-center gap-2"><div class="w-2.5 h-1 rounded bg-red-600"></div> High (Congested)</div>
                            <div class="flex items-center gap-2 border-t border-white/10 pt-1 mt-1"><div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Origin</div>
                            <div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full bg-violet-500"></div> Destination</div>
                        </div>
                    </div>
                `;
                return div;
            };
            legend.addTo(map);

            // Initial fetch
            fetchAnomalies();
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Effect for handling refreshKey
    useEffect(() => {
        fetchAnomalies();
    }, [refreshKey]);

    // Effect for handling routeData updates
    useEffect(() => {
        if (!mapRef.current || !layerGroupRef.current) return;

        layerGroupRef.current.clearLayers();

        if (routeData) {
            // Draw route line segments with their assigned live traffic color
            const geojsonLayer = L.geoJSON(routeData, {
                style: (feature) => {
                    return {
                        color: feature?.properties?.color || '#38bdf8', // Default to sky-400 if no live color
                        weight: 6,
                        opacity: 0.9,
                        lineCap: 'round',
                        lineJoin: 'round'
                    };
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        const status = feature.properties.status || "Unknown";
                        const popupContent = `
                            <div class="px-2 py-1">
                                <div class="text-xs font-bold uppercase text-gray-500 mb-1">Live Segment Condition</div>
                                <div class="text-sm font-medium ${status === 'Severe' || status === 'Heavy' ? 'text-red-600' : status === 'Moderate' ? 'text-orange-500' : 'text-emerald-600'}">
                                    ${status} Traffic
                                </div>
                            </div>
                        `;
                        layer.bindPopup(popupContent, { className: 'custom-traffic-popup' });

                        // Add highlight on hover
                        layer.on('mouseover', function (e) {
                            const l = e.target;
                            l.setStyle({ weight: 9, opacity: 1 });
                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                l.bringToFront();
                            }
                        });
                        layer.on('mouseout', function (e) {
                            geojsonLayer.resetStyle(e.target);
                        });
                    }
                }
            }).addTo(layerGroupRef.current);

            // Fit bounds to route
            if (geojsonLayer.getBounds().isValid()) {
                mapRef.current.fitBounds(geojsonLayer.getBounds(), { padding: [50, 50] });
            }

            // Draw start and end markers
            if (routeData.type === 'FeatureCollection' && routeData.features.length > 0) {
                // Find start (first feature) and end (last feature)
                const firstFeature = routeData.features[0];
                const lastFeature = routeData.features[routeData.features.length - 1];

                if (firstFeature.geometry && firstFeature.geometry.coordinates) {
                    const startCoord = firstFeature.geometry.coordinates[0];
                    L.marker([startCoord[1], startCoord[0]], {
                        icon: createPulseIcon('#10b981')
                    }).addTo(layerGroupRef.current);
                }

                if (lastFeature.geometry && lastFeature.geometry.coordinates) {
                    const endCoords = lastFeature.geometry.coordinates;
                    const endCoord = endCoords[endCoords.length - 1];
                    L.marker([endCoord[1], endCoord[0]], {
                        icon: createPulseIcon('#8b5cf6')
                    }).addTo(layerGroupRef.current);
                }
            }
        }
    }, [routeData]);

    return (
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
    );
}
