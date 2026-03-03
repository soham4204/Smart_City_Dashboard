'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as esri from 'esri-leaflet';

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

            // Draw start and end markers if it's a LineString
            if (routeData.type === 'FeatureCollection' && routeData.features.length > 0) {
                const feature = routeData.features[0];
                if (feature.geometry && feature.geometry.type === 'LineString') {
                    const coords = feature.geometry.coordinates;
                    if (coords.length > 0) {
                        const startCoord = coords[0];
                        const endCoord = coords[coords.length - 1];

                        // Leaflet expects [lat, lng]
                        L.circleMarker([startCoord[1], startCoord[0]], {
                            radius: 8,
                            fillColor: '#10b981', // emerald-500
                            color: '#fff',
                            weight: 2,
                            fillOpacity: 1
                        }).addTo(layerGroupRef.current);

                        L.circleMarker([endCoord[1], endCoord[0]], {
                            radius: 8,
                            fillColor: '#8b5cf6', // violet-500
                            color: '#fff',
                            weight: 2,
                            fillOpacity: 1
                        }).addTo(layerGroupRef.current);
                    }
                }
            }
        }
    }, [routeData]);

    return (
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
    );
}
