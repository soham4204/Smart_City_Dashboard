# backend/traffic/main.py
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
import patch_wmi

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from traffic_agent import traffic_app

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

@app.post("/api/v1/traffic/calculate-smart-route")
async def calculate_smart_route(request: RouteRequest):
    if len(request.origin) != 2 or len(request.destination) != 2:
        raise HTTPException(status_code=400, detail="Origin and destination must be [lon, lat] pairs.")
    
    # Run the Traffic Agent
    inputs = {
        "origin": request.origin,
        "destination": request.destination,
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
        "geojson": result.get("final_route_geojson", {})
    }
