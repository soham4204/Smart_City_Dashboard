// frontend/src/components/Map3DComponent.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Map from '@arcgis/core/Map';
import SceneView from '@arcgis/core/views/SceneView';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import WebTileLayer from '@arcgis/core/layers/WebTileLayer';
import Graphic from '@arcgis/core/Graphic';
import Polygon from '@arcgis/core/geometry/Polygon';
import Point from '@arcgis/core/geometry/Point';
import { PointSymbol3D, ObjectSymbol3DLayer } from '@arcgis/core/symbols';
import Color from '@arcgis/core/Color';
import esriConfig from "@arcgis/core/config";
import { Monitor, Map as MapIcon } from 'lucide-react';

// IMPORTANT: Replace with your actual API Key
esriConfig.apiKey = "YOUR_ARCGIS_API_KEY_HERE";

interface Pole {
  id: string;
  location: [number, number, number?];
  status: string;
  brightness: number;
  priority: string;
  group: string;
  manual_override: boolean;
  temperature?: number;
}

interface Zone {
  id: string;
  name: string;
  color: string;
  poles: Pole[];
  height?: number;
}

interface Map3DProps {
  zones: Zone[];
  weatherCondition: string;
  onZoneClick: (zoneId: string) => void;
}

export default function Map3DComponent({ zones, weatherCondition, onZoneClick }: Map3DProps) {
  const mapDiv = useRef<HTMLDivElement>(null);
  
  // References
  const viewRef = useRef<SceneView | MapView | null>(null);
  const zoneLayerRef = useRef<GraphicsLayer | null>(null);
  const heatmapLayerRef = useRef<FeatureLayer | null>(null);

  // Toggle State
  const [is3D, setIs3D] = useState(true);

  // 1. Initialize Map & View (Re-runs on Toggle)
  useEffect(() => {
    if (!mapDiv.current) return;

    // Cleanup previous view
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    // --- 3D MODE (SATELLITE / REALISTIC) ---
    if (is3D) {
      // Create Map with SATELLITE basemap
      const map = new Map({
        basemap: "satellite", // <--- RESTORED REALISM
        ground: "world-elevation" 
      });

      const view = new SceneView({
        container: mapDiv.current,
        map: map,
        camera: {
          position: { x: 72.8777, y: 19.00, z: 3000 },
          tilt: 60
        },
        environment: {
          atmosphere: { quality: "high" },
          lighting: { directShadowsEnabled: true, date: new Date("2024-01-01T12:00:00") }
        },
        popup: { defaultPopupTemplateEnabled: true }
      });

      // 3D-Specific Layers
      const zoneLayer = new GraphicsLayer({ elevationInfo: { mode: "relative-to-ground" } });
      map.add(zoneLayer);
      
      zoneLayerRef.current = zoneLayer;
      viewRef.current = view;
    } 
    
    // --- 2D MODE (STREET MAP / HEATMAP) ---
    else {
      // Create Map with OpenStreetMap (Standard 2D look)
      const osmLayer = new WebTileLayer({
        urlTemplate: "https://a.tile.openstreetmap.org/{level}/{col}/{row}.png",
        subDomains: ["a", "b", "c"],
        copyright: 'Map data © OpenStreetMap contributors'
      });

      const map = new Map({
        layers: [osmLayer] // <--- KEEPS 2D MAP CLEAN
      });

      const view = new MapView({
        container: mapDiv.current,
        map: map,
        center: [72.8777, 19.0760],
        zoom: 13,
        popup: { defaultPopupTemplateEnabled: true }
      });

      // 2D-Specific Layers
      const zoneLayer = new GraphicsLayer();
      map.add(zoneLayer);
      zoneLayerRef.current = zoneLayer;

      // Heatmap Layer (Only added in 2D mode)
      const heatmapLayer = new FeatureLayer({
        source: [], // Populated in Rendering Logic
        objectIdField: "ObjectID",
        fields: [
            { name: "ObjectID", type: "oid" },
            { name: "temperature", type: "double" }
        ],
        renderer: {
            type: "heatmap",
            field: "temperature",
            colorStops: [
                { ratio: 0, color: "rgba(0, 0, 255, 0)" },
                { ratio: 0.4, color: "rgba(0, 255, 255, 0.5)" },
                { ratio: 0.6, color: "rgba(255, 255, 0, 0.8)" },
                { ratio: 1, color: "rgba(255, 0, 0, 1)" }
            ],
            minPixelIntensity: 0,
            maxPixelIntensity: 100,
            radius: 25,
            blurRadius: 15
        } as any
      });
      map.add(heatmapLayer);
      heatmapLayerRef.current = heatmapLayer;

      viewRef.current = view;
    }

    // Click Handler
    viewRef.current?.on("click", (event) => {
      viewRef.current?.hitTest(event).then((response) => {
        const result = response.results.find((r) => r.layer === zoneLayerRef.current);
        if (result && result.type === "graphic") {
            const graphic = result.graphic;
            if (graphic.attributes?.type === "zone") {
                onZoneClick(graphic.attributes.id);
            }
        }
      });
    });

  }, [is3D]);

  // 2. Weather Logic (3D Only)
  useEffect(() => {
    if (!viewRef.current || !is3D) return;
    const view = viewRef.current as SceneView;
    const env = view.environment;

    switch (weatherCondition.toLowerCase()) {
        case 'rainy': case 'storm': env.weather = { type: "rainy", cloudCover: 0.8, precipitation: 0.8 } as any; break;
        case 'foggy': env.weather = { type: "foggy", fogStrength: 0.8 } as any; break;
        case 'cloudy': env.weather = { type: "cloudy", cloudCover: 0.8 } as any; break;
        default: env.weather = { type: "sunny", cloudCover: 0.1 } as any; break;
    }
  }, [weatherCondition, is3D]);

  // 3. Rendering Logic
  useEffect(() => {
    if (!zoneLayerRef.current) return;
    
    zoneLayerRef.current.removeAll();
    const heatmapFeatures: any[] = [];

    zones.forEach(zone => {
      const zoneColor = new Color(zone.color);
      const rings = zone.poles.map(p => [p.location[1], p.location[0]]);
      
      if (rings.length >= 3) {
        const polygon = new Polygon({ rings: [rings] });
        zoneColor.a = 0.3; 

        if (is3D) {
            // 3D Rendering
            const polygonGraphic = new Graphic({
                geometry: polygon,
                symbol: {
                    type: "polygon-3d", 
                    symbolLayers: [{
                        type: "extrude",
                        size: zone.height || 50, 
                        material: { color: zoneColor },
                        edges: { type: "solid", color: [255, 255, 255, 0.3] }
                    }]
                } as any, 
                attributes: { id: zone.id, type: "zone", name: zone.name },
                popupTemplate: { title: "Zone: {name}", content: "ID: {id}" }
            });
            zoneLayerRef.current?.add(polygonGraphic);
        } else {
            // 2D Rendering
            const polygonGraphic = new Graphic({
                geometry: polygon,
                symbol: {
                    type: "simple-fill",
                    color: zoneColor,
                    outline: { color: "white", width: 1 }
                },
                attributes: { id: zone.id, type: "zone", name: zone.name }
            });
            zoneLayerRef.current?.add(polygonGraphic);
        }
      }

      zone.poles.forEach((pole, index) => {
        // Collect Heatmap Data (2D)
        if (!is3D) {
            heatmapFeatures.push({
                geometry: new Point({ latitude: pole.location[0], longitude: pole.location[1] }),
                attributes: {
                    ObjectID: index + Math.random(),
                    temperature: pole.temperature || 30
                }
            });
        }

        // Render Poles (3D Only)
        if (is3D) {
            const point = new Point({ 
                latitude: pole.location[0], 
                longitude: pole.location[1], 
                z: (pole.location[2] || 0) + 0.5 
            });
            
            const poleColor = pole.status === 'ONLINE' ? "#10b981" : "#ef4444"; 
            const poleSymbol = new PointSymbol3D({
              symbolLayers: [new ObjectSymbol3DLayer({
                resource: { primitive: "cylinder" },
                width: 8, height: 20, 
                material: { color: poleColor },
                anchor: "bottom"
              })]
            });

            const poleGraphic = new Graphic({ 
                geometry: point, 
                symbol: poleSymbol,
                attributes: { 
                    id: pole.id, type: "pole",
                    temp: pole.temperature, status: pole.status
                },
                popupTemplate: { title: "Pole: {id}", content: "Temp: {temp}°C" }
            });
            zoneLayerRef.current?.add(poleGraphic);
        }
      });
    });

    // Apply Heatmap (2D Only)
    if (!is3D && heatmapLayerRef.current && heatmapFeatures.length > 0) {
        heatmapLayerRef.current.applyEdits({
            addFeatures: heatmapFeatures
        }).catch(e => console.error("Heatmap update failed", e));
    }

  }, [zones, is3D]);

  return (
    <div className="relative h-full w-full">
        <div className="h-full w-full" ref={mapDiv} />

        {/* Toggle Switch */}
        <div className="absolute top-4 right-4 z-50 bg-gray-900/90 border border-gray-700 p-1 rounded-lg shadow-xl backdrop-blur-sm flex items-center space-x-1">
            <button
                onClick={() => setIs3D(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all text-sm font-medium ${
                    !is3D ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
            >
                <MapIcon className="w-4 h-4" />
                <span>Heatmap (2D)</span>
            </button>
            <button
                onClick={() => setIs3D(true)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all text-sm font-medium ${
                    is3D ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
            >
                <Monitor className="w-4 h-4" />
                <span>3D Ops</span>
            </button>
        </div>
    </div>
  );
}