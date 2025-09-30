# backend/main.py
import json
from datetime import datetime # Import the datetime module
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Local imports
from websocket_manager import manager
from agent import agent_app
from models import DashboardState, Zone, LightPole, SimulationRequest, OverrideRequest

# --- App Setup ---
app = FastAPI(
    title="Smart City Dashboard API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    # Restrict to your frontend's URL for better security
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Data & Configs ---
ZONE_CONFIGS = {
    "CSM International Airport": {"heat_threshold": 38, "congestion_threshold": 0.8},
    "KEM Hospital": {"heat_threshold": 40, "congestion_threshold": 0.7},
    "Dadar Residential Area": {"heat_threshold": 36, "congestion_threshold": 0.85},
}

MOCK_DASHBOARD_STATE = DashboardState(
    zones=[
        Zone(
            id="airport_zone", name="CSM International Airport", color="#f97316",
            poles=[
                LightPole(id="AIR-01", location=(19.0896, 72.8656), brightness=80, status="ONLINE", priority="Medium", manual_override=False, group="CSM International Airport"),
                LightPole(id="AIR-02", location=(19.0912, 72.8648), brightness=80, status="ONLINE", priority="Medium", manual_override=False, group="CSM International Airport"),
                LightPole(id="AIR-03", location=(19.0881, 72.8665), brightness=0, status="OFFLINE", priority="Medium", manual_override=False, group="CSM International Airport"),
                LightPole(id="AIR-04", location=(19.0925, 72.8670), brightness=80, status="ONLINE", priority="Medium", manual_override=False, group="CSM International Airport"),
                LightPole(id="AIR-05", location=(19.0870, 72.8630), brightness=80, status="ONLINE", priority="Medium", manual_override=False, group="CSM International Airport"),
            ]
        ),
        Zone(
            id="hospital_zone", name="KEM Hospital", color="#ef4444",
            poles=[
                LightPole(id="HOS-01", location=(19.0150, 72.8400), brightness=90, status="ONLINE", priority="High", manual_override=False, group="KEM Hospital"),
                LightPole(id="HOS-02", location=(19.0165, 72.8395), brightness=90, status="ONLINE", priority="High", manual_override=False, group="KEM Hospital"),
                LightPole(id="HOS-03", location=(19.0140, 72.8410), brightness=90, status="ONLINE", priority="High", manual_override=False, group="KEM Hospital"),
                LightPole(id="HOS-04", location=(19.0158, 72.8415), brightness=0, status="MAINTENANCE", priority="High", manual_override=False, group="KEM Hospital"),
            ]
        ),
        Zone(
            id="residential_zone", name="Dadar Residential Area", color="#3b82f6",
             poles=[
                LightPole(id="RES-01", location=(19.0220, 72.8440), brightness=60, status="ONLINE", priority="Low", manual_override=False, group="Dadar Residential Area"),
                LightPole(id="RES-02", location=(19.0235, 72.8430), brightness=65, status="ONLINE", priority="Low", manual_override=False, group="Dadar Residential Area"),
                LightPole(id="RES-03", location=(19.0210, 72.8450), brightness=60, status="ONLINE", priority="Low", manual_override=False, group="Dadar Residential Area"),
                LightPole(id="RES-04", location=(19.0245, 72.8420), brightness=65, status="ONLINE", priority="Low", manual_override=False, group="Dadar Residential Area"),
                LightPole(id="RES-05", location=(19.0228, 72.8460), brightness=60, status="ONLINE", priority="Low", manual_override=False, group="Dadar Residential Area"),
            ]
        )
    ]
)

# --- ADDED: Helper for Logging ---
def log_event(message: str):
    """Appends an event to the events.log file."""
    timestamp = datetime.now().strftime("%I:%M:%S %p")
    # Use 'a' to append to the file, which creates it if it doesn't exist
    with open("events.log", "a") as f:
        f.write(f"{timestamp} | {message}\n")

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"status": "API is running"}

@app.get("/api/v1/dashboard/initial-state", response_model=DashboardState)
async def get_initial_state():
    return MOCK_DASHBOARD_STATE

# --- NEW: Endpoint to GET a zone's configuration ---
@app.get("/api/v1/zones/{zone_name}/config")
async def get_zone_config(zone_name: str):
    return ZONE_CONFIGS.get(zone_name, {})

# --- NEW: Endpoint to UPDATE a zone's configuration ---
@app.post("/api/v1/zones/{zone_name}/config")
async def set_zone_config(zone_name: str, config: dict):
    if zone_name in ZONE_CONFIGS:
        ZONE_CONFIGS[zone_name].update(config)
        log_event(f"Config Update | Zone: {zone_name} updated to {config}")
        return {"success": True, "zone_name": zone_name, "new_config": ZONE_CONFIGS[zone_name]}
    return {"success": False, "message": "Zone not found"}


@app.post("/api/v1/simulation/weather")
async def simulate_weather(request: SimulationRequest):
    # For now, we'll simulate for the first zone as an example
    sim_zone_name = MOCK_DASHBOARD_STATE.zones[0].name
    location = "Mumbai"
    
    # FETCH the dynamic config for the zone being simulated
    config = ZONE_CONFIGS.get(sim_zone_name, {})
    
    log_event(f"Simulation Triggered | Zone: {sim_zone_name}, Scenario: {request.scenario}")
    
    inputs = {
        "scenario": request.scenario,
        "location": location,
        "zone_id": MOCK_DASHBOARD_STATE.zones[0].id,
        "config": config,  # Pass the dynamic config to the agent
    }

    # Invoke the agent
    result = agent_app.invoke(inputs)

    control_action = result.get('control_action', {})
    new_brightness = control_action.get('brightness')
    verdict = result.get('final_verdict', 'No verdict.')

    log_event(f"Agent Decision | Brightness set to {new_brightness}%.")
    log_event(f"LLM Judge Verdict | {verdict}")

    # Apply new brightness if valid
    if new_brightness is not None:
        for zone in MOCK_DASHBOARD_STATE.zones:
            for pole in zone.poles:
                if pole.status == "ONLINE" and not pole.manual_override:
                    pole.brightness = new_brightness

    # ✅ Build enriched payload for WebSocket broadcast
    payload = {
        "zones": MOCK_DASHBOARD_STATE.model_dump()["zones"],
        "agentResult": {
            "anomalies": result.get("anomalies"),
            "decision": result.get("decision"),
            "final_verdict": verdict,
        },
    }

    # Send to all active websocket clients
    await manager.broadcast(json.dumps(payload))
    
    return {
        "message": "Simulation successful", 
        "new_brightness": new_brightness,
        "judge_verdict": verdict,
    }

@app.post("/api/v1/poles/{pole_id}/override")
async def set_manual_override(pole_id: str, request: OverrideRequest):
    # ADDED: Logging for manual overrides
    log_event(f"Manual Override | Pole: {pole_id} set to {request.brightness}%")

    for zone in MOCK_DASHBOARD_STATE.zones:
        for pole in zone.poles:
            if pole.id == pole_id:
                pole.manual_override = request.manual_override
                pole.brightness = request.brightness
                
                # UPDATED: .dict() is deprecated, use .model_dump()
                updated_state_dict = MOCK_DASHBOARD_STATE.model_dump()
                await manager.broadcast(json.dumps(updated_state_dict))
                return {"success": True, "pole_id": pole_id}
    
    return {"success": False, "message": "Pole not found"}

# @app.websocket("/ws/updates")
# async def websocket_endpoint(websocket: WebSocket):
#     await manager.connect(websocket)
#     try:
#         while True:
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)
#         print("Client disconnected")