# backend/traffic/main.py
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
import patch_wmi

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'weather')))
from database import SessionLocal
from models import WeatherAnomaly
from sqlmodel import Session, delete, select
from traffic_agent import traffic_app, TrafficState

app = FastAPI(title="Smart City Traffic Routing API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RouteRequest(BaseModel):
    origin: List[float] # [lon, lat]
    destination: List[float] # [lon, lat]

class WeatherSimulationRequest(BaseModel):
    region: str # Colaba, BKC, Dadar, Andheri, Borivali
    condition: str # Cyclone, Heavy Rain, Dense Fog, Clear Sky

MUMBAI_REGIONS = {
    "Colaba": [72.8258, 18.9067, 72.8338, 18.9187],
    "Dadar": [72.8357, 19.0133, 72.8487, 19.0253],
    "BKC": [72.8596, 19.0608, 72.8716, 19.0708],
    "Andheri": [72.8404, 19.1137, 72.8524, 19.1257],
    "Borivali": [72.8524, 19.2237, 72.8644, 19.2357],
}

@app.post("/api/v1/traffic/calculate-smart-route")
async def calculate_smart_route(request: RouteRequest):
    if len(request.origin) != 2 or len(request.destination) != 2:
        raise HTTPException(status_code=400, detail="Origin and destination must be [lon, lat] pairs.")
    
    # Run the Traffic Agent
    inputs = {
        "origin": request.origin,
        "destination": request.destination,
        "duration_min": 0,
        "distance_km": 0.0,
    }
    
    try:
        result = traffic_app.invoke(inputs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Execution Failed: {str(e)}")

    if result.get("impact_state") == "Error":
        raise HTTPException(status_code=502, detail=result.get("route_summary", "ArcGIS API generated an error"))

    return {
        "impact_state": result.get("impact_state", "Clear"),
        "route_summary": result.get("route_summary", "No summary available."),
        "geojson": result.get("final_route_geojson", {}),
        "duration_min": result.get("duration_min", 0),
        "distance_km": result.get("distance_km", 0)
    }

@app.post("/api/v1/traffic/simulate-weather")
async def simulate_weather(request: WeatherSimulationRequest):
    if request.region not in MUMBAI_REGIONS:
        raise HTTPException(status_code=400, detail="Invalid region selected.")
    
    bbox = MUMBAI_REGIONS[request.region]
    
    with SessionLocal() as session:
        # Check if already exists for this zone
        existing = session.exec(select(WeatherAnomaly).where(WeatherAnomaly.zone_id == request.region)).first()
        if existing:
            existing.condition = request.condition
            session.add(existing)
        else:
            new_anomaly = WeatherAnomaly(
                zone_id=request.region,
                condition=request.condition,
                bbox_min_lon=bbox[0],
                bbox_min_lat=bbox[1],
                bbox_max_lon=bbox[2],
                bbox_max_lat=bbox[3]
            )
            session.add(new_anomaly)
        session.commit()
    
    return {"status": "success", "message": f"Simulated {request.condition} in {request.region}"}

@app.delete("/api/v1/traffic/clear-weather")
async def clear_weather():
    with SessionLocal() as session:
        session.exec(delete(WeatherAnomaly))
        session.commit()
    return {"status": "success", "message": "All simulated weather cleared."}

@app.get("/api/v1/traffic/weather-anomalies")
async def get_weather_anomalies():
    with SessionLocal() as session:
        anomalies = session.exec(select(WeatherAnomaly)).all()
        return anomalies
