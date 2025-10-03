# backend/blackout/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import json
from datetime import datetime
import hashlib
import asyncio

from blackout_models import (
    PowerZone, BlackoutIncident, BlackoutDashboardState,
    BlackoutSimulationRequest, PowerAllocationPlan,
    BlackoutSeverity, PowerState, ZonePriority
)
from blackout_agents import blackout_soar_pipeline

app = FastAPI(title="Mumbai Smart City - Blackout Management System")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================== WEBSOCKET MANAGER =====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] New connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"[WebSocket] Connection closed. Total: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"[WebSocket] Error sending message: {e}")
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# ===================== MOCK DATA =====================

# Define Mumbai power zones with realistic data
MOCK_POWER_ZONES = [
    PowerZone(
        id="zone_defence",
        name="Defence Zone",
        zone_type="Defence",
        priority=ZonePriority.CRITICAL,
        power_state=PowerState.FULL_POWER,
        current_load_mw=45.0,
        capacity_mw=50.0,
        backup_available=True,
        backup_capacity_mw=50.0,
        backup_duration_hours=72.0,
        affected_population=250000,
        critical_facilities=["Naval Base", "Air Force Station", "Military Hospital", "Command Center"],
        power_allocation_percent=100.0,
        lat=18.9220,
        lon=72.8347
    ),
    PowerZone(
        id="zone_airport",
        name="Airport Zone",
        zone_type="Airport",
        priority=ZonePriority.HIGH,
        power_state=PowerState.FULL_POWER,
        current_load_mw=80.0,
        capacity_mw=100.0,
        backup_available=True,
        backup_capacity_mw=80.0,
        backup_duration_hours=48.0,
        affected_population=150000,
        critical_facilities=["Chhatrapati Shivaji Airport", "Air Traffic Control", "Cargo Terminal"],
        power_allocation_percent=100.0,
        lat=19.0896,
        lon=72.8656
    ),
    PowerZone(
        id="zone_hospital",
        name="Hospital Zone (Bandra)",
        zone_type="Hospital",
        priority=ZonePriority.CRITICAL,
        power_state=PowerState.FULL_POWER,
        current_load_mw=35.0,
        capacity_mw=40.0,
        backup_available=True,
        backup_capacity_mw=40.0,
        backup_duration_hours=96.0,
        affected_population=400000,
        critical_facilities=["Lilavati Hospital", "Bhabha Hospital", "Holy Family Hospital", "ICU Units"],
        power_allocation_percent=100.0,
        lat=19.0596,
        lon=72.8295
    ),
    PowerZone(
        id="zone_bkc_commercial",
        name="BKC Commercial Zone",
        zone_type="Commercial",
        priority=ZonePriority.MEDIUM,
        power_state=PowerState.FULL_POWER,
        current_load_mw=120.0,
        capacity_mw=150.0,
        backup_available=True,
        backup_capacity_mw=60.0,
        backup_duration_hours=12.0,
        affected_population=100000,
        critical_facilities=["NSE", "BSE", "Banks", "Corporate Offices", "Data Centers"],
        power_allocation_percent=100.0,
        lat=19.0625,
        lon=72.8681
    ),
    PowerZone(
        id="zone_education",
        name="Education Zone (Powai)",
        zone_type="Education",
        priority=ZonePriority.MEDIUM,
        power_state=PowerState.FULL_POWER,
        current_load_mw=25.0,
        capacity_mw=30.0,
        backup_available=True,
        backup_capacity_mw=15.0,
        backup_duration_hours=8.0,
        affected_population=80000,
        critical_facilities=["IIT Bombay", "Multiple Schools", "Research Labs", "Libraries"],
        power_allocation_percent=100.0,
        lat=19.1334,
        lon=72.9133
    ),
    PowerZone(
        id="zone_residential_andheri",
        name="Residential Zone (Andheri)",
        zone_type="Residential",
        priority=ZonePriority.LOW,
        power_state=PowerState.FULL_POWER,
        current_load_mw=90.0,
        capacity_mw=100.0,
        backup_available=False,
        backup_capacity_mw=0.0,
        backup_duration_hours=0.0,
        affected_population=800000,
        critical_facilities=["Residential Complexes", "Local Markets", "Community Centers"],
        power_allocation_percent=100.0,
        lat=19.1136,
        lon=72.8697
    ),
    PowerZone(
        id="zone_residential_borivali",
        name="Residential Zone (Borivali)",
        zone_type="Residential",
        priority=ZonePriority.LOW,
        power_state=PowerState.FULL_POWER,
        current_load_mw=70.0,
        capacity_mw=80.0,
        backup_available=False,
        backup_capacity_mw=0.0,
        backup_duration_hours=0.0,
        affected_population=600000,
        critical_facilities=["Residential Areas", "Shopping Centers", "Parks"],
        power_allocation_percent=100.0,
        lat=19.2403,
        lon=72.8540
    ),
    PowerZone(
        id="zone_port",
        name="Port Zone",
        zone_type="Port",
        priority=ZonePriority.HIGH,
        power_state=PowerState.FULL_POWER,
        current_load_mw=55.0,
        capacity_mw=60.0,
        backup_available=True,
        backup_capacity_mw=40.0,
        backup_duration_hours=24.0,
        affected_population=50000,
        critical_facilities=["Mumbai Port Trust", "Container Terminal", "Warehouses", "Customs"],
        power_allocation_percent=100.0,
        lat=18.9388,
        lon=72.8354
    )
]

MOCK_BLACKOUT_STATE = BlackoutDashboardState(
    zones=MOCK_POWER_ZONES,
    active_incidents=[],
    total_grid_capacity_mw=sum(z.capacity_mw for z in MOCK_POWER_ZONES),
    current_grid_load_mw=sum(z.current_load_mw for z in MOCK_POWER_ZONES),
    available_backup_mw=sum(z.backup_capacity_mw for z in MOCK_POWER_ZONES),
    grid_health_score=100.0
)

# ===================== API ENDPOINTS =====================

@app.get("/")
async def root():
    return {
        "service": "Mumbai Smart City - Blackout Management System",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/api/v1/blackout/initial-state")
async def get_initial_blackout_state():
    """Get initial blackout management dashboard state"""
    return MOCK_BLACKOUT_STATE

@app.get("/api/v1/blackout/zones/{zone_id}/details")
async def get_zone_details(zone_id: str):
    """Get detailed information about a specific power zone"""
    zone = next((z for z in MOCK_BLACKOUT_STATE.zones if z.id == zone_id), None)
    if not zone:
        return {"error": "Zone not found"}
    
    return {
        "zone": zone,
        "real_time_metrics": {
            "load_factor": round(zone.current_load_mw / zone.capacity_mw, 2),
            "backup_ready": zone.backup_available,
            "population_at_risk": zone.affected_population if zone.power_state != PowerState.FULL_POWER else 0,
            "critical_systems_count": len(zone.critical_facilities)
        }
    }

@app.post("/api/v1/blackout/simulate")
async def simulate_blackout(request: BlackoutSimulationRequest):
    """Simulate a blackout and process through SOAR pipeline"""
    print(f"\n[BLACKOUT SIM] Initiating blackout simulation")
    print(f"[BLACKOUT SIM] Cause: {request.cause}, Severity: {request.severity}")
    
    # Create incident ID
    incident_id = hashlib.md5(
        f"blackout_{datetime.now().isoformat()}".encode()
    ).hexdigest()[:12]
    
    # Calculate capacity lost
    total_capacity = MOCK_BLACKOUT_STATE.total_grid_capacity_mw
    capacity_lost = total_capacity * (request.capacity_lost_percent / 100)
    
    # Update affected zones
    affected_zone_objs = [z for z in MOCK_BLACKOUT_STATE.zones if z.id in request.affected_zones]
    
    for zone in affected_zone_objs:
        # Determine new power state based on severity
        if request.severity == BlackoutSeverity.CATASTROPHIC:
            zone.power_state = PowerState.NO_POWER if zone.priority in [ZonePriority.LOW, ZonePriority.MEDIUM] else PowerState.BACKUP_POWER
            zone.power_allocation_percent = 0 if zone.power_state == PowerState.NO_POWER else 50
        elif request.severity == BlackoutSeverity.MAJOR:
            zone.power_state = PowerState.BACKUP_POWER if zone.backup_available else PowerState.NO_POWER
            zone.power_allocation_percent = 40 if zone.backup_available else 0
        elif request.severity == BlackoutSeverity.MODERATE:
            zone.power_state = PowerState.REDUCED_POWER
            zone.power_allocation_percent = 60
        else:  # MINOR
            zone.power_state = PowerState.REDUCED_POWER
            zone.power_allocation_percent = 80
    
    # Create incident record
    incident = BlackoutIncident(
        incident_id=incident_id,
        severity=request.severity,
        affected_zones=request.affected_zones,
        cause=request.cause,
        total_capacity_lost_mw=capacity_lost,
        estimated_recovery_hours=_calculate_recovery_time(request.severity, request.weather_condition),
        status="ACTIVE",
        initiated_at=datetime.now().isoformat(),
        weather_related=request.weather_condition is not None,
        cascade_risk=_calculate_cascade_risk(request.severity, len(request.affected_zones))
    )
    
    MOCK_BLACKOUT_STATE.active_incidents.append(incident)
    
    # Update grid health
    MOCK_BLACKOUT_STATE.grid_health_score = max(0, 100 - (request.capacity_lost_percent * 1.2))
    MOCK_BLACKOUT_STATE.current_grid_load_mw = sum(
        z.current_load_mw * (z.power_allocation_percent / 100) 
        for z in MOCK_BLACKOUT_STATE.zones
    )
    
    # Broadcast immediate update
    await manager.broadcast(json.dumps({
        "type": "blackout_alert",
        "data": {
            "incident_id": incident_id,
            "severity": request.severity,
            "affected_zones": request.affected_zones,
            "message": f"Blackout initiated: {request.cause}"
        }
    }))
    
    # Process through SOAR pipeline
    print(f"[BLACKOUT SIM] Processing through SOAR pipeline...")
    soar_result = blackout_soar_pipeline.process_blackout_incident(
        incident_id=incident_id,
        cause=request.cause,
        severity=request.severity,
        affected_zones=request.affected_zones,
        capacity_lost_mw=capacity_lost,
        weather_condition=request.weather_condition
    )
    
    # Broadcast SOAR results
    await manager.broadcast(json.dumps({
        "type": "blackout_update",
        "data": {
            "incident_id": incident_id,
            "zones": [z.model_dump() for z in MOCK_BLACKOUT_STATE.zones],
            "incident": incident.model_dump(),
            "soar_analysis": {
                "grid_analysis": soar_result.get("grid_analysis", {}),
                "weather_impact": soar_result.get("weather_impact", {}),
                "allocation_plan": soar_result.get("power_allocation_plan", {}),
                "execution_status": soar_result.get("execution_status", {})
            }
        }
    }))
    
    # Start recovery process in background
    asyncio.create_task(simulate_recovery(incident_id, incident.estimated_recovery_hours))
    
    return {
        "success": True,
        "incident_id": incident_id,
        "incident": incident,
        "soar_result": soar_result,
        "affected_zones_count": len(request.affected_zones),
        "capacity_lost_mw": capacity_lost
    }

@app.post("/api/v1/blackout/incidents/{incident_id}/manual-allocate")
async def manual_power_allocation(incident_id: str, allocations: Dict[str, float]):
    """Manually override power allocation for zones"""
    incident = next((i for i in MOCK_BLACKOUT_STATE.active_incidents if i.incident_id == incident_id), None)
    if not incident:
        return {"error": "Incident not found"}
    
    # Apply manual allocations
    for zone_id, allocation_percent in allocations.items():
        zone = next((z for z in MOCK_BLACKOUT_STATE.zones if z.id == zone_id), None)
        if zone and zone_id in incident.affected_zones:
            zone.power_allocation_percent = min(100, max(0, allocation_percent))
            
            # Update power state based on allocation
            if allocation_percent >= 90:
                zone.power_state = PowerState.FULL_POWER
            elif allocation_percent >= 50:
                zone.power_state = PowerState.REDUCED_POWER
            elif allocation_percent > 0:
                zone.power_state = PowerState.BACKUP_POWER
            else:
                zone.power_state = PowerState.NO_POWER
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "manual_allocation",
        "data": {
            "incident_id": incident_id,
            "zones": [z.model_dump() for z in MOCK_BLACKOUT_STATE.zones if z.id in incident.affected_zones]
        }
    }))
    
    return {"success": True, "message": "Manual allocation applied"}

@app.post("/api/v1/blackout/incidents/{incident_id}/resolve")
async def resolve_incident(incident_id: str):
    """Manually resolve a blackout incident"""
    incident = next((i for i in MOCK_BLACKOUT_STATE.active_incidents if i.incident_id == incident_id), None)
    if not incident:
        return {"error": "Incident not found"}
    
    # Restore all zones
    for zone in MOCK_BLACKOUT_STATE.zones:
        if zone.id in incident.affected_zones:
            zone.power_state = PowerState.FULL_POWER
            zone.power_allocation_percent = 100.0
    
    # Mark incident as resolved
    incident.status = "RESOLVED"
    incident.resolved_at = datetime.now().isoformat()
    
    # Update grid health
    MOCK_BLACKOUT_STATE.grid_health_score = 100.0
    MOCK_BLACKOUT_STATE.current_grid_load_mw = sum(z.current_load_mw for z in MOCK_BLACKOUT_STATE.zones)
    
    # Remove from active incidents
    MOCK_BLACKOUT_STATE.active_incidents = [
        i for i in MOCK_BLACKOUT_STATE.active_incidents if i.incident_id != incident_id
    ]
    
    # Broadcast resolution
    await manager.broadcast(json.dumps({
        "type": "blackout_resolved",
        "data": {
            "incident_id": incident_id,
            "zones": [z.model_dump() for z in MOCK_BLACKOUT_STATE.zones]
        }
    }))
    
    return {"success": True, "message": "Incident resolved", "incident": incident}

# ===================== WEBSOCKET ENDPOINT =====================

@app.websocket("/ws/blackout")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            # Echo back or handle client commands if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ===================== HELPER FUNCTIONS =====================

def _calculate_recovery_time(severity: BlackoutSeverity, weather: Optional[str]) -> float:
    """Calculate estimated recovery time"""
    base_times = {
        BlackoutSeverity.MINOR: 2.0,
        BlackoutSeverity.MODERATE: 6.0,
        BlackoutSeverity.MAJOR: 12.0,
        BlackoutSeverity.CATASTROPHIC: 24.0
    }
    
    recovery_time = base_times.get(severity, 6.0)
    
    # Adjust for weather
    if weather:
        weather = weather.lower()
        if weather in ["storm", "cyclone"]:
            recovery_time *= 1.5
        elif weather in ["flooding"]:
            recovery_time *= 2.0
        elif weather in ["rain"]:
            recovery_time *= 1.2
    
    return round(recovery_time, 1)

def _calculate_cascade_risk(severity: BlackoutSeverity, affected_zones_count: int) -> float:
    """Calculate cascade failure risk"""
    severity_risk = {
        BlackoutSeverity.MINOR: 0.1,
        BlackoutSeverity.MODERATE: 0.3,
        BlackoutSeverity.MAJOR: 0.6,
        BlackoutSeverity.CATASTROPHIC: 0.9
    }
    
    base_risk = severity_risk.get(severity, 0.3)
    zone_factor = min(affected_zones_count / 10, 0.3)
    
    return round(min(base_risk + zone_factor, 1.0), 2)

async def simulate_recovery(incident_id: str, recovery_hours: float):
    """Simulate gradual recovery process"""
    await asyncio.sleep(5)  # Initial delay
    
    incident = next((i for i in MOCK_BLACKOUT_STATE.active_incidents if i.incident_id == incident_id), None)
    if not incident:
        return
    
    incident.status = "RECOVERING"
    
    # Gradually restore power over recovery period
    steps = 5
    for step in range(1, steps + 1):
        await asyncio.sleep(recovery_hours * 3600 / steps)  # Distribute recovery time
        
        recovery_percent = (step / steps) * 100
        
        for zone in MOCK_BLACKOUT_STATE.zones:
            if zone.id in incident.affected_zones:
                zone.power_allocation_percent = min(100, recovery_percent)
                
                if recovery_percent >= 90:
                    zone.power_state = PowerState.FULL_POWER
                elif recovery_percent >= 50:
                    zone.power_state = PowerState.REDUCED_POWER
                else:
                    zone.power_state = PowerState.BACKUP_POWER
        
        # Broadcast recovery progress
        await manager.broadcast(json.dumps({
            "type": "recovery_progress",
            "data": {
                "incident_id": incident_id,
                "recovery_percent": round(recovery_percent, 1),
                "zones": [z.model_dump() for z in MOCK_BLACKOUT_STATE.zones if z.id in incident.affected_zones]
            }
        }))
    
    # Mark as resolved
    await resolve_incident(incident_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

