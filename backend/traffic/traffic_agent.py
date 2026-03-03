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
    duration_min: int
    distance_km: float

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

def arcgis_routing_node(state: TrafficState) -> Dict[str, Any]:
    """Uses ArcGIS Routing API to find a traffic-aware route that also avoids weather zones."""
    print("---NODE: ArcGISRouting---")
    origin = state["origin"]
    dest = state["destination"]
    high_cost_zones = state.get("high_cost_zones", [])
    key = os.getenv('ARCGIS_API_KEY')

    # Construct Polygon Barriers from Weather Anomalies
    barriers = []
    for zone in high_cost_zones:
        bbox = zone.get("bbox", [])
        if len(bbox) == 4:
            # ArcGIS ring: [[min_lon, min_lat], [max_lon, min_lat], [max_lon, max_lat], [min_lon, max_lat], [min_lon, min_lat]]
            ring = [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[1]],
                [bbox[2], bbox[3]],
                [bbox[0], bbox[3]],
                [bbox[0], bbox[1]]
            ]
            barriers.append({"geometry": {"rings": [ring]}})

    stops = f"{origin[0]},{origin[1]};{dest[0]},{dest[1]}"
    url = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World/solve"
    
    params: Dict[str, Any] = {
        "stops": stops,
        "f": "json",
        "token": key,
        "returnRoutes": "true",
        "returnGeometry": "true",
        "outSR": "4326",
        "departureTime": "now",
    }

    if barriers:
        params["polygonBarriers"] = json.dumps({"features": barriers})

    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        # Fallback: If barriers make it impossible to find a route, try once without them
        if "error" in data and barriers:
            print("ArcGIS Routing blocked by barriers. Retrying without them...")
            params.pop("polygonBarriers", None)
            response = requests.get(url, params=params)
            data = response.json()
            data["barriers_applied"] = False
        else:
            data["barriers_applied"] = bool(barriers)
        
        if "error" in data:
            print("ArcGIS API Error:", data["error"].get("message", "Unknown error"))
            return {"base_route": {"error": data["error"].get("message")}}
        
        return {"base_route": data}
    except Exception as e:
        print("ArcGIS Request Failed:", e)
        return {"base_route": {"error": str(e)}}

def is_point_in_bbox(point: List[float], bbox: List[float]) -> bool:
    """Helper: Checks if [lon, lat] is inside [min_lon, min_lat, max_lon, max_lat]."""
    lon, lat = point
    return bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]

def impact_analysis_node(state: TrafficState) -> Dict[str, Any]:
    """Cross-references the route with high-cost (Heavy Rain/Storm) zones."""
    print("---NODE: ImpactAnalysis---")
    # Use direct access to avoid 'object' type issues from get()
    base_route = state["base_route"]
    high_cost_zones = state["high_cost_zones"]
    
    # 1. Evaluate routes from ArcGIS
    # Correctly navigate the ArcGIS response structure
    routes_obj = base_route.get("routes", {})
    if not isinstance(routes_obj, dict): routes_obj = {}
    routes_data = routes_obj.get("features", [])
    if not routes_data:
        return {
            "impact_state": "Error",
            "route_summary": f"No valid routes found: {base_route.get('error', 'Unknown Error')}",
            "final_route_geojson": {"type": "FeatureCollection", "features": []}
        }

    # ArcGIS typically returns one optimal route for 'Driving Time' with traffic
    # We will score it against our local weather anomalies
    route_feature = routes_data[0]
    attributes = route_feature.get("attributes", {})
    if not isinstance(attributes, dict): attributes = {}
    geometry = route_feature.get("geometry", {})
    if not isinstance(geometry, dict): geometry = {}
    
    # ArcGIS paths are in 'paths': [[[lng, lat], [lng, lat], ...]]
    paths = geometry.get("paths", [])
    route_coords: List[List[float]] = paths[0] if paths else []

    impact_count: int = 0
    impacted_zones = set()

    for coord in route_coords:
        for zone in high_cost_zones:
            bbox: List[float] = list(zone.get("bbox", []))
            if is_point_in_bbox(coord, bbox):
                impact_count += 1
                impacted_zones.add(str(zone.get("name", "Unknown")))

    duration_min = round(attributes.get("Total_TravelTime", 0)) # Uses live traffic time
    distance_km = round(attributes.get("Total_Kilometers", 0), 2)
    
    # 3. Formulate Summary
    impacted = impact_count > 0
    barriers_applied = base_route.get("barriers_applied", False)

    if impacted:
        impact_state = "Route Impacted by Weather"
        zones_str = ", ".join(list(impacted_zones))
        summary = f"ETA: {duration_min} mins ({distance_km} km). NOTICE: Origin/Destination are within weather zones ({zones_str})."
    elif barriers_applied:
        impact_state = "Clear"
        summary = f"ETA: {duration_min} mins ({distance_km} km). SMART EVASIVE ROUTING: Successfully bypassed severe weather anomalies. Optimized for live traffic."
    else:
        impact_state = "Clear"
        summary = f"ETA: {duration_min} mins ({distance_km} km). Optimized for current live traffic flow."
        
    # 4. Build Segmented GeoJSON with Simulated Traffic Status
    import random
    features_list: List[Dict[str, Any]] = []
    geojson: Dict[str, Any] = {
        "type": "FeatureCollection",
        "features": features_list
    }
    
    if route_coords and len(route_coords) > 1:
        for i in range(len(route_coords) - 1):
            segment = [route_coords[i], route_coords[i+1]]
            
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
                
            # If weather impacted (this segment is in a bbox), boost chance of red
            for zone in high_cost_zones:
                if is_point_in_bbox(route_coords[i], zone["bbox"]):
                    if random.random() < 0.6:
                        speed_color = "red"
                        status = "Severe"

            features_list.append({
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
        "duration_min": duration_min,
        "distance_km": distance_km
    }

# --- 3. Compile Graph ---
workflow = StateGraph(TrafficState)

workflow.add_node("weather_query", weather_db_query_node)
workflow.add_node("arcgis_routing", arcgis_routing_node)
workflow.add_node("impact_analysis", impact_analysis_node)

workflow.set_entry_point("weather_query")
workflow.add_edge("weather_query", "arcgis_routing")
workflow.add_edge("arcgis_routing", "impact_analysis")
workflow.add_edge("impact_analysis", END)

traffic_app = workflow.compile()
