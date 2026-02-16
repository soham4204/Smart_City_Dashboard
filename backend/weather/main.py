# backend/weather/main.py
import json
import random
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, SQLModel  # Added SQLModel to imports

# Local imports
from websocket_manager import manager
from agent import agent_app
from models import Zone, LightPole, SimulationRequest, OverrideRequest, ZoneCreate
from database import create_db_and_tables, get_session, seed_data_if_empty

# --- App Setup ---
app = FastAPI(title="Smart City Dashboard API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Startup Event ---
@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed_data_if_empty()

# --- Helpers ---
def log_event(message: str):
    """Appends an event to the events.log file."""
    timestamp = datetime.now().strftime("%I:%M:%S %p")
    with open("events.log", "a") as f:
        f.write(f"{timestamp} | {message}\n")

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"status": "API is running (Database Connected)"}

@app.get("/api/v1/dashboard/initial-state")
async def get_initial_state(session: Session = Depends(get_session)):
    zones = session.exec(select(Zone)).all()
    
    # Base temperature for Mumbai today
    base_temp = 32.0 

    response_zones = []
    for z in zones:
        z_dict = z.model_dump()
        # Inject Virtual Sensor Data
        z_dict['poles'] = []
        for p in z.poles:
            pole_data = p.model_dump()
            pole_data["location"] = p.location
            # SPATIAL LOGIC: Calculate specific temp for this pole's location
            pole_data["temperature"] = calculate_heat_island_temp(base_temp, z.name)
            z_dict['poles'].append(pole_data)
            
        response_zones.append(z_dict)
        
    return {"zones": response_zones}

@app.get("/api/v1/zones/{zone_id}/config")
async def get_zone_config(zone_id: str, session: Session = Depends(get_session)):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {"heat_threshold": zone.heat_threshold, "congestion_threshold": zone.congestion_threshold}

@app.post("/api/v1/zones/{zone_id}/config")
async def set_zone_config(zone_id: str, config: dict, session: Session = Depends(get_session)):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    if "heat_threshold" in config:
        zone.heat_threshold = config["heat_threshold"]
    if "congestion_threshold" in config:
        zone.congestion_threshold = config["congestion_threshold"]
    
    session.add(zone)
    session.commit()
    session.refresh(zone)
    log_event(f"Config Update | Zone: {zone.name} updated config.")
    return {"success": True, "new_config": config}

# --- NEW: Infrastructure Management (Add Light Pole) ---

class PoleCreate(SQLModel):
    id: str
    zone_id: str
    latitude: float
    longitude: float
    altitude: float = 0.0
    priority: str = "Medium"

@app.post("/api/v1/poles")
async def create_light_pole(pole_data: PoleCreate, session: Session = Depends(get_session)):
    # 1. Check if zone exists
    zone = session.get(Zone, pole_data.zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    # 2. Check if pole ID already exists
    existing_pole = session.get(LightPole, pole_data.id)
    if existing_pole:
        raise HTTPException(status_code=400, detail="Pole ID already exists")

    # 3. Create and Save
    new_pole = LightPole(
        id=pole_data.id,
        zone_id=pole_data.zone_id,
        latitude=pole_data.latitude,
        longitude=pole_data.longitude,
        altitude=pole_data.altitude,
        priority=pole_data.priority,
        brightness=0,       # Default off
        status="ONLINE",    # Default online
        group=zone.name     # Legacy frontend compatibility
    )
    
    session.add(new_pole)
    session.commit()
    
    log_event(f"Infrastructure Added | New Pole {new_pole.id} added to {zone.name}")
    
    # 4. Broadcast update so Map updates immediately
    zones = session.exec(select(Zone)).all()
    payload_zones = []
    for z in zones:
        z_dict = z.model_dump()
        z_dict['poles'] = [{**p.model_dump(), "location": p.location} for p in z.poles]
        payload_zones.append(z_dict)

    await manager.broadcast(json.dumps({"zones": payload_zones}))
    
    return {"success": True, "pole": new_pole}

# --- Simulation & Control Endpoints ---

@app.post("/api/v1/simulation/weather")
async def simulate_weather(request: SimulationRequest, session: Session = Depends(get_session)):
    # 1. Fetch State from DB
    zones = session.exec(select(Zone)).all()
    target_zone = zones[0] # Default to first zone for simulation context
    
    log_event(f"Simulation Triggered | Scenario: {request.scenario}")
    
    # 2. Run Agent
    inputs = {
        "scenario": request.scenario,
        "location": "Mumbai",
        "zone_id": target_zone.id,
        "config": {"heat_threshold": target_zone.heat_threshold},
    }
    result = agent_app.invoke(inputs)

    # 3. Apply Agent Decisions to DB
    control_action = result.get('control_action', {})
    new_brightness = control_action.get('brightness')
    
    if new_brightness is not None:
        # Update ALL online poles in DB
        poles = session.exec(select(LightPole).where(LightPole.status == "ONLINE", LightPole.manual_override == False)).all()
        for pole in poles:
            pole.brightness = new_brightness
            session.add(pole)
        session.commit()
        log_event(f"Agent Decision | Set {len(poles)} poles to {new_brightness}% brightness.")

    # 4. Broadcast Update
    # Re-fetch fresh state
    fresh_zones = session.exec(select(Zone)).all()
    payload_zones = []
    for z in fresh_zones:
        z_dict = z.model_dump()
        z_dict['poles'] = [{**p.model_dump(), "location": p.location} for p in z.poles]
        payload_zones.append(z_dict)

    payload = {
        "zones": payload_zones,
        "agentResult": result,
    }
    await manager.broadcast(json.dumps(payload, default=str))
    
    return {"message": "Simulation successful", "judge_verdict": result.get('final_verdict')}

@app.post("/api/v1/poles/{pole_id}/override")
async def set_manual_override(pole_id: str, request: OverrideRequest, session: Session = Depends(get_session)):
    pole = session.get(LightPole, pole_id)
    if not pole:
        return {"success": False, "message": "Pole not found"}
    
    pole.manual_override = request.manual_override
    pole.brightness = request.brightness
    session.add(pole)
    session.commit()
    
    log_event(f"Manual Override | Pole: {pole_id} set to {request.brightness}%")
    
    # Broadcast update
    zones = session.exec(select(Zone)).all()
    payload_zones = []
    for z in zones:
        z_dict = z.model_dump()
        z_dict['poles'] = [{**p.model_dump(), "location": p.location} for p in z.poles]
        payload_zones.append(z_dict)

    await manager.broadcast(json.dumps({"zones": payload_zones}))
    return {"success": True, "pole_id": pole_id}

# backend/weather/main.py

@app.delete("/api/v1/poles/{pole_id}")
async def delete_light_pole(pole_id: str, session: Session = Depends(get_session)):
    pole = session.get(LightPole, pole_id)
    if not pole:
        raise HTTPException(status_code=404, detail="Pole not found")
    
    zone_name = pole.zone.name if pole.zone else "Unknown Zone"
    
    session.delete(pole)
    session.commit()
    
    log_event(f"Infrastructure Removed | Pole {pole_id} deleted from {zone_name}")
    
    # Broadcast update so Map removes the marker immediately
    zones = session.exec(select(Zone)).all()
    payload_zones = []
    for z in zones:
        z_dict = z.model_dump()
        z_dict['poles'] = [{**p.model_dump(), "location": p.location} for p in z.poles]
        payload_zones.append(z_dict)

    await manager.broadcast(json.dumps({"zones": payload_zones}))
    
    return {"success": True, "message": f"Pole {pole_id} deleted"}

@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket, session: Session = Depends(get_session)):
    await manager.connect(websocket)
    
    # Send initial state with Temp
    zones = session.exec(select(Zone)).all()
    base_temp = 32.0 

    payload_zones = []
    for z in zones:
        z_dict = z.model_dump()
        z_dict['poles'] = []
        for p in z.poles:
            pole_data = p.model_dump()
            pole_data["location"] = p.location
            pole_data["temperature"] = calculate_heat_island_temp(base_temp, z.name)
            z_dict['poles'].append(pole_data)
        payload_zones.append(z_dict)

    await websocket.send_text(json.dumps({"zones": payload_zones}))
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

def calculate_heat_island_temp(base_temp: float, zone_name: str) -> float:
    # Airport and Commercial zones trap more heat (Concrete effect)
    if "Airport" in zone_name or "Commercial" in zone_name:
        return base_temp + random.uniform(2.0, 4.0)
    # Hospitals/Critical often have regulated environments or green cover
    elif "Hospital" in zone_name:
        return base_temp + random.uniform(0.0, 1.0)
    # Residential areas are generally cooler
    else:
        return base_temp - random.uniform(0.5, 1.5)