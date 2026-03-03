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
}

export default function TrafficMap({ routeData }: TrafficMapProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerGroupRef = useRef<L.LayerGroup | null>(null);

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
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

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
