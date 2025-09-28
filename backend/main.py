# backend/main.py
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from websocket_manager import manager
from fastapi.middleware.cors import CORSMiddleware
from agent import agent_app

# Import the models we just created
from models import DashboardState, Zone, LightPole, SimulationRequest, OverrideRequest

app = FastAPI(
    title="Smart City Dashboard API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data representing the initial state of the city zones
MOCK_DASHBOARD_STATE = DashboardState(
    zones=[
        Zone(
            id="airport_zone", name="CSM International Airport", color="#f97316",
            poles=[
                LightPole(id="AIR-01", location=(19.0896, 72.8656), brightness=80, status="ONLINE", priority="Medium", manual_override=False, group="CSM International Airport"),
                LightPole(id="AIR-02", location=(19.0912, 72.8648), brightness=80, status="ONLINE", priority="Medium", manual_override=False, group="CSM International Airport"),
                LightPole(id="AIR-03", location=(19.0881, 72.8665), brightness=0, status="OFFLINE", priority="Medium", manual_override=False, group="CSM International Airport"),
            ]
        ),
        Zone(
            id="hospital_zone", name="KEM Hospital", color="#ef4444",
            poles=[
                LightPole(id="HOS-01", location=(19.0150, 72.8400), brightness=90, status="ONLINE", priority="High", manual_override=False, group="KEM Hospital"),
                LightPole(id="HOS-02", location=(19.0165, 72.8395), brightness=90, status="ONLINE", priority="High", manual_override=False, group="KEM Hospital"),
            ]
        ),
        Zone(
            id="residential_zone", name="Dadar Residential Area", color="#3b82f6",
             poles=[
                LightPole(id="RES-01", location=(19.0220, 72.8440), brightness=60, status="ONLINE", priority="Low", manual_override=False, group="Dadar Residential Area"),
                LightPole(id="RES-02", location=(19.0235, 72.8430), brightness=65, status="ONLINE", priority="Low", manual_override=False, group="Dadar Residential Area"),
            ]
        )
    ]
)

@app.get("/")
def read_root():
    return {"status": "API is running"}

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}

# New endpoint to provide initial data to the frontend
@app.get("/api/v1/dashboard/initial-state", response_model=DashboardState)
async def get_initial_state():
    return MOCK_DASHBOARD_STATE

@app.post("/api/v1/simulation/weather")
async def simulate_weather(request: SimulationRequest):
    # 1. Invoke the LangGraph agent with the scenario
    inputs = {"scenario": request.scenario}
    result = agent_app.invoke(inputs)
    recommendation = result.get('recommendation', {})
    new_brightness = recommendation.get('brightness')

    # 2. Update the system's state based on the agent's recommendation
    if new_brightness is not None:
        print(f"Agent recommended brightness: {new_brightness}%. Updating state.")
        for zone in MOCK_DASHBOARD_STATE.zones:
            for pole in zone.poles:
                if pole.status == "ONLINE":
                    pole.brightness = new_brightness
    
    # 3. Broadcast the updated state to all connected frontend clients
    updated_state_dict = MOCK_DASHBOARD_STATE.dict()
    await manager.broadcast(json.dumps(updated_state_dict))

    return {"message": "Simulation successful", "new_brightness": new_brightness}

@app.post("/api/v1/poles/{pole_id}/override")
async def set_manual_override(pole_id: str, request: OverrideRequest):
    # Find the pole and update its state in our mock data
    for zone in MOCK_DASHBOARD_STATE.zones:
        for pole in zone.poles:
            if pole.id == pole_id:
                pole.manual_override = request.manual_override
                pole.brightness = request.brightness
                print(f"Overriding pole {pole_id} to brightness {pole.brightness}")
                break
    
    # Broadcast the change to all clients
    updated_state_dict = MOCK_DASHBOARD_STATE.dict()
    await manager.broadcast(json.dumps(updated_state_dict))
    
    return {"success": True, "pole_id": pole_id}

@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # A simple loop to keep the connection alive
        while True:
            # In a real app, you might receive messages from the client
            # For this POC, we are only broadcasting from the server, so we just wait.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")