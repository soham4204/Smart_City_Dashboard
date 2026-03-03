import os
import json
import requests
from typing import TypedDict, Dict, Any, List
from dotenv import load_dotenv
from sqlmodel import select
from langgraph.graph import StateGraph, END

# Import the database sessionmaker from weather module
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'weather')))
from database import SessionLocal
from models import Zone, WeatherAnomaly

load_dotenv()

# --- 1. Define State ---
class TrafficState(TypedDict):
    origin: List[float] # [lon, lat]
    destination: List[float] # [lon, lat]
    high_cost_zones: List[Dict[str, Any]] # Zones with Heavy Rain/Storm
    base_route: Dict[str, Any] # Raw ArcGIS route
    impact_state: str # 'Clear' or 'Route Impacted by Weather'
    route_summary: str # Text explanation
    final_route_geojson: Dict[str, Any] # Final output

# --- 2. Define Nodes ---

def weather_db_query_node(state: TrafficState) -> Dict[str, Any]:
    """Queries the database for active 'WeatherAnomaly' records injected by the Weather Simulation."""
    print("---NODE: WeatherDBQuery---")
    high_cost_zones = []
    
    with SessionLocal() as session:
        anomalies = session.exec(select(WeatherAnomaly)).all()
        for anomaly in anomalies:
            high_cost_zones.append({
                "zone_id": anomaly.zone_id,
                "name": f"Zone {anomaly.zone_id}", # Simplify name lookup for speed
                "condition": anomaly.condition,
                "bbox": [anomaly.bbox_min_lon, anomaly.bbox_min_lat, anomaly.bbox_max_lon, anomaly.bbox_max_lat]
            })

    return {"high_cost_zones": high_cost_zones}

def osrm_routing_node(state: TrafficState) -> Dict[str, Any]:
    """Uses OSRM Routing API to find a route."""
    print("---NODE: OSRMRouting---")
    origin = state["origin"]
    dest = state["destination"]
    
    # OSRM expects {lon},{lat}
    url = f"http://router.project-osrm.org/route/v1/driving/{origin[0]},{origin[1]};{dest[0]},{dest[1]}"
    params = {
        "overview": "full",
        "geometries": "geojson"
    }

    try:
        # Use headers to comply with OSRM public API policy
        headers = {"User-Agent": "SmartCityDashboard/1.0"}
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        if data.get("code") != "Ok":
            print("OSRM API Error:", data.get("message", "Unknown error"))
            return {"base_route": {"error": data.get("message", "Unknown error")}}
        else:
            return {"base_route": data}
    except Exception as e:
        print("OSRM Request Failed:", e)
        return {"base_route": {"error": str(e)}}

def is_point_in_bbox(point: List[float], bbox: List[float]) -> bool:
    """Helper: Checks if [lon, lat] is inside [min_lon, min_lat, max_lon, max_lat]."""
    lon, lat = point
    return bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]

def impact_analysis_node(state: TrafficState) -> Dict[str, Any]:
    """Cross-references the route with high-cost (Heavy Rain/Storm) zones."""
    print("---NODE: ImpactAnalysis---")
    base_route = state.get("base_route", {})
    high_cost_zones = state.get("high_cost_zones", [])
    
    impacted = False
    impacted_zone_names = set()
    
    # 1. Extract the path coordinates
    route_coords = []
    if "routes" in base_route and len(base_route["routes"]) > 0:
        geometry = base_route["routes"][0].get("geometry", {})
        if geometry.get("type") == "LineString":
            # OSRM gives a flat array of [lon, lat] points
            route_coords = geometry.get("coordinates", [])
        
    # 2. Extract Duration and Distance
    duration_sec = 0
    distance_m = 0
    if "routes" in base_route and len(base_route["routes"]) > 0:
        duration_sec = base_route["routes"][0].get("duration", 0)
        distance_m = base_route["routes"][0].get("distance", 0)

    duration_min = round(duration_sec / 60)
    
    # 3. Check Weather intersection on each coord
    for coord in route_coords:
        for zone in high_cost_zones:
            if is_point_in_bbox(coord, zone["bbox"]):
                impacted = True
                impacted_zone_names.add(zone["name"])
                impacted = True
                impacted_zone_names.add(zone["name"])
    
    # 4. Formulate Summary
    if impacted:
        impact_state = "Route Impacted by Weather"
        zones_str = ", ".join(impacted_zone_names)
        summary = f"ETA: {duration_min} mins. Route passes through high-risk zones ({zones_str}) experiencing Heavy Rain/Storm. Caution advised."
    elif "error" in base_route:
        impact_state = "Error"
        summary = "Failed to calculate a valid route over network."
    else:
        impact_state = "Clear"
        summary = f"ETA: {duration_min} mins. Route is clear of severe weather hazards."
        
    # 5. Build Segmented GeoJSON with Simulated Traffic Status
    import random
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    if route_coords and len(route_coords) > 1:
        # Instead of 1 long line, generate small chunks representing street segments
        # and assign a live traffic condition to them for the frontend
        for i in range(len(route_coords) - 1):
            segment = [route_coords[i], route_coords[i+1]]
            
            # Simple simulation: most are green, some orange, few red
            traffic_val = random.random()
            if traffic_val < 0.7:
                speed_color = "green"
                status = "Clear"
            elif traffic_val < 0.9:
                speed_color = "orange"
                status = "Moderate"
            else:
                speed_color = "red"
                status = "Heavy"
                
            # If weather impacted, boost chance of red in that bbox
            if impacted:
                for zone in high_cost_zones:
                    if is_point_in_bbox(route_coords[i], zone["bbox"]):
                        if random.random() < 0.6:
                           speed_color = "red"
                           status = "Severe"

            geojson["features"].append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": segment
                },
                "properties": {
                    "status": status,
                    "color": speed_color,
                    "segment_index": i
                }
            })

    return {
        "impact_state": impact_state,
        "route_summary": summary,
        "final_route_geojson": geojson,
        "estimated_duration_min": duration_min
    }

# --- 3. Compile Graph ---
workflow = StateGraph(TrafficState)

workflow.add_node("weather_query", weather_db_query_node)
workflow.add_node("osrm_routing", osrm_routing_node)
workflow.add_node("impact_analysis", impact_analysis_node)

workflow.set_entry_point("weather_query")
workflow.add_edge("weather_query", "osrm_routing")
workflow.add_edge("osrm_routing", "impact_analysis")
workflow.add_edge("impact_analysis", END)

traffic_app = workflow.compile()
