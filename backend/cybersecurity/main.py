# backend/main.py
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from websocket_manager import manager
from fastapi.middleware.cors import CORSMiddleware
from agent import agent_app  # Weather agent - keeping existing
from cyber_agents import create_soar_app, SecurityState  # New cyber agents

# Import the models we just created
from models import DashboardState, Zone, LightPole, SimulationRequest, OverrideRequest
from cyber_models import (
    CyberZone, CyberDashboardState, CyberEvent, 
    CyberSimulationRequest, CyberIncident
)

app = FastAPI(
    title="Smart City Dashboard API",
    version="2.0",
    description="Mumbai Smart City Dashboard with Weather and Cybersecurity SOAR"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SOAR pipeline
soar_pipeline = create_soar_app()

# ==================== EXISTING WEATHER DATA ====================

# Mock data representing the initial state of the city zones (WEATHER)
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

# ==================== NEW CYBERSECURITY DATA ====================

# Mock data for cybersecurity zones
MOCK_CYBER_STATE = CyberDashboardState(
    zones=[
        CyberZone(
            id="airport_zone",
            name="CSM International Airport",
            zone_type="airport_zone",
            security_state=SecurityState.GREEN.value,
            critical_assets=["runway_lighting_system", "air_traffic_control", "baggage_handling"],
            active_incidents=0,
            last_incident_time=None,
            compliance_status="COMPLIANT",
            threat_level="LOW"
        ),
        CyberZone(
            id="hospital_zone",
            name="KEM Hospital",
            zone_type="hospital_zone",
            security_state=SecurityState.GREEN.value,
            critical_assets=["patient_records", "life_support_systems", "pharmacy_systems"],
            active_incidents=0,
            last_incident_time=None,
            compliance_status="COMPLIANT",
            threat_level="LOW"
        ),
        CyberZone(
            id="defence_zone",
            name="Defence Installation",
            zone_type="defence_zone",
            security_state=SecurityState.GREEN.value,
            critical_assets=["classified_systems", "command_control", "surveillance"],
            active_incidents=0,
            last_incident_time=None,
            compliance_status="COMPLIANT",
            threat_level="LOW"
        ),
        CyberZone(
            id="education_zone",
            name="Mumbai University",
            zone_type="education_zone",
            security_state=SecurityState.GREEN.value,
            critical_assets=["student_records", "research_data", "learning_platforms"],
            active_incidents=0,
            last_incident_time=None,
            compliance_status="COMPLIANT",
            threat_level="LOW"
        ),
        CyberZone(
            id="commercial_zone",
            name="Bandra Kurla Complex",
            zone_type="commercial_zone",
            security_state=SecurityState.GREEN.value,
            critical_assets=["banking_systems", "trading_platforms", "payment_gateways"],
            active_incidents=0,
            last_incident_time=None,
            compliance_status="COMPLIANT",
            threat_level="LOW"
        )
    ],
    active_incidents=[],
    recent_events=[]
)

# ==================== BASE ENDPOINTS ====================

@app.get("/")
def read_root():
    return {
        "status": "API is running",
        "version": "2.0",
        "features": ["weather_simulation", "cybersecurity_soar"]
    }

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "weather": "operational", "cyber": "operational"}

# ==================== WEATHER ENDPOINTS (EXISTING) ====================

@app.get("/api/v1/dashboard/initial-state", response_model=DashboardState)
async def get_initial_state():
    """Get initial weather dashboard state"""
    return MOCK_DASHBOARD_STATE

@app.post("/api/v1/simulation/weather")
async def simulate_weather(request: SimulationRequest):
    """Simulate weather scenario and adjust light poles"""
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
    await manager.broadcast(json.dumps({
        "type": "weather_update",
        "data": updated_state_dict
    }))

    return {"message": "Simulation successful", "new_brightness": new_brightness}

@app.post("/api/v1/poles/{pole_id}/override")
async def set_manual_override(pole_id: str, request: OverrideRequest):
    """Manual override for light pole brightness"""
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
    await manager.broadcast(json.dumps({
        "type": "weather_update",
        "data": updated_state_dict
    }))
    
    return {"success": True, "pole_id": pole_id}

# ==================== CYBERSECURITY ENDPOINTS (NEW) ====================

@app.get("/api/v1/cyber/initial-state", response_model=CyberDashboardState)
async def get_cyber_initial_state():
    """Get initial cybersecurity dashboard state"""
    return MOCK_CYBER_STATE

@app.get("/api/v1/cyber/zones/{zone_id}/details")
async def get_zone_details(zone_id: str):
    """Get detailed information about a specific zone"""
    zone = next((z for z in MOCK_CYBER_STATE.zones if z.id == zone_id), None)
    if not zone:
        return {"error": "Zone not found"}
    
    # Get recent events for this zone
    zone_events = [e for e in MOCK_CYBER_STATE.recent_events if e.zone_id == zone_id]
    
    # Get active incidents for this zone
    zone_incidents = [i for i in MOCK_CYBER_STATE.active_incidents if i.zone_id == zone_id]
    
    return {
        "zone": zone.dict(),
        "recent_events": [e.dict() for e in zone_events[-10:]],  # Last 10 events
        "active_incidents": [i.dict() for i in zone_incidents],
        "metrics": {
            "total_events_24h": len([e for e in zone_events if e.severity in ["HIGH", "CRITICAL"]]),
            "avg_response_time": 2.5,  # Simulated metric in minutes
            "compliance_score": 95 if zone.compliance_status == "COMPLIANT" else 70
        }
    }

@app.post("/api/v1/cyber/simulate")
async def simulate_cyber_attack(request: CyberSimulationRequest):
    """Simulate a cyber attack and process through SOAR pipeline"""
    from datetime import datetime
    import hashlib
    
    print(f"\n[CYBER SIM] Initiating attack simulation for zone: {request.zone_id}")
    print(f"[CYBER SIM] Attack type: {request.attack_type}")
    
    # Find the zone
    zone = next((z for z in MOCK_CYBER_STATE.zones if z.id == request.zone_id), None)
    if not zone:
        return {"error": "Zone not found"}
    
    # Set zone to RED state immediately
    zone.security_state = SecurityState.RED.value
    zone.threat_level = request.severity
    zone.active_incidents += 1
    
    # Create incident record
    incident_id = hashlib.md5(f"{request.zone_id}_{datetime.now().isoformat()}".encode()).hexdigest()[:12]
    incident = CyberIncident(
        incident_id=incident_id,
        zone_id=request.zone_id,
        attack_type=request.attack_type,
        severity=request.severity,
        status="ACTIVE",
        detected_at=datetime.now().isoformat(),
        mitigated_at=None
    )
    MOCK_CYBER_STATE.active_incidents.append(incident)
    
    # Broadcast RED state immediately
    await manager.broadcast(json.dumps({
        "type": "cyber_alert",
        "data": {
            "zone_id": request.zone_id,
            "security_state": SecurityState.RED.value,
            "incident_id": incident_id,
            "message": f"Active threat detected in {zone.name}"
        }
    }))
    
    # Generate attack telemetry based on attack type
    attack_telemetry = generate_attack_telemetry(request.attack_type, request.severity)
    
    # Process through SOAR pipeline
    result = soar_pipeline.process_security_event(
        zone_id=request.zone_id,
        zone_type=zone.zone_type,
        raw_telemetry=attack_telemetry
    )
    
    # Update zone based on SOAR results
    zone.security_state = result.get('security_state', SecurityState.YELLOW.value)
    if result.get('validation_results', {}).get('validation_passed', False):
        zone.threat_level = "LOW"
        zone.active_incidents = max(0, zone.active_incidents - 1)
        incident.status = "MITIGATED"
        incident.mitigated_at = datetime.now().isoformat()
        # Remove from active incidents
        MOCK_CYBER_STATE.active_incidents = [
            i for i in MOCK_CYBER_STATE.active_incidents if i.incident_id != incident_id
        ]
    
    zone.last_incident_time = datetime.now().isoformat()
    
    # Add to recent events
    for anomaly in result.get('anomalies', [])[:5]:  # Add first 5 anomalies as events
        event = CyberEvent(
            event_id=hashlib.md5(f"{anomaly}_{datetime.now().isoformat()}".encode()).hexdigest()[:8],
            zone_id=request.zone_id,
            event_type=anomaly.get('type', 'unknown'),
            severity=anomaly.get('severity', 'MEDIUM'),
            description=f"Anomaly detected: {anomaly.get('type', 'unknown')}",
            timestamp=datetime.now().isoformat(),
            source_ip=anomaly.get('source_ip', 'unknown')
        )
        MOCK_CYBER_STATE.recent_events.append(event)
    
    # Broadcast final state
    await manager.broadcast(json.dumps({
        "type": "cyber_update",
        "data": {
            "zone_id": request.zone_id,
            "security_state": zone.security_state,
            "incident_id": incident_id,
            "threat_neutralized": result.get('validation_results', {}).get('validation_passed', False),
            "time_to_mitigation": result.get('time_to_mitigation', 0),
            "message": f"Threat {'neutralized' if zone.security_state == SecurityState.GREEN.value else 'partially mitigated'} in {zone.name}"
        }
    }))
    
    return {
        "success": True,
        "incident_id": incident_id,
        "initial_state": SecurityState.RED.value,
        "final_state": zone.security_state,
        "time_to_detection": result.get('time_to_detection', 0),
        "time_to_mitigation": result.get('time_to_mitigation', 0),
        "anomalies_detected": len(result.get('anomalies', [])),
        "mitre_ttps": result.get('threat_intelligence', {}).get('mitre_ttps', []),
        "response_playbook": result.get('response_playbook', {}).get('name', 'Unknown'),
        "validation_passed": result.get('validation_results', {}).get('validation_passed', False)
    }

@app.get("/api/v1/cyber/incidents")
async def get_incidents(active_only: bool = False):
    """Get list of security incidents"""
    if active_only:
        return {"incidents": [i.dict() for i in MOCK_CYBER_STATE.active_incidents]}
    
    # Return all incidents (would normally query from database)
    return {
        "active_incidents": [i.dict() for i in MOCK_CYBER_STATE.active_incidents],
        "total_incidents_today": len(MOCK_CYBER_STATE.recent_events),
        "zones_at_risk": [z.id for z in MOCK_CYBER_STATE.zones if z.security_state != SecurityState.GREEN.value]
    }

@app.get("/api/v1/cyber/events/stream")
async def get_event_stream(zone_id: str = None, limit: int = 50):
    """Get recent security events (optionally filtered by zone)"""
    events = MOCK_CYBER_STATE.recent_events
    
    if zone_id:
        events = [e for e in events if e.zone_id == zone_id]
    
    # Return most recent events
    return {
        "events": [e.dict() for e in events[-limit:]],
        "total_count": len(events)
    }

# ==================== WEBSOCKET ENDPOINT (SHARED) ====================

@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates (both weather and cyber)"""
    await manager.connect(websocket)
    try:
        # Send initial states upon connection
        await websocket.send_json({
            "type": "initial_state",
            "weather": MOCK_DASHBOARD_STATE.dict(),
            "cyber": MOCK_CYBER_STATE.dict()
        })
        
        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Could handle client messages here if needed
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")

# ==================== HELPER FUNCTIONS ====================

def generate_attack_telemetry(attack_type: str, severity: str) -> list:
    """Generate simulated attack telemetry based on attack type"""
    from datetime import datetime, timedelta
    import random
    
    telemetry = []
    base_ip = f"10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
    
    if attack_type == "ransomware":
        # Simulate ransomware indicators
        for i in range(10):
            telemetry.append({
                'timestamp': (datetime.now() - timedelta(seconds=i*5)).isoformat(),
                'source_ip': base_ip,
                'destination_ip': f"192.168.1.{random.randint(1, 254)}",
                'event_type': random.choice(['file_encryption', 'anomalous_traffic', 'suspicious_process']),
                'severity': severity,
                'description': 'Potential ransomware activity detected - files being encrypted',
                'port': random.choice([445, 3389, 135])
            })
    
    elif attack_type == "brute_force":
        # Simulate brute force attack
        for i in range(20):
            telemetry.append({
                'timestamp': (datetime.now() - timedelta(seconds=i*2)).isoformat(),
                'source_ip': base_ip,
                'destination_ip': '192.168.1.10',
                'event_type': 'failed_login',
                'severity': 'HIGH' if i > 10 else 'MEDIUM',
                'description': f'Failed login attempt {i+1} from {base_ip}',
                'port': random.choice([22, 3389, 21])
            })
    
    elif attack_type == "ddos":
        # Simulate DDoS attack
        for i in range(50):
            telemetry.append({
                'timestamp': (datetime.now() - timedelta(milliseconds=i*100)).isoformat(),
                'source_ip': f"10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}",
                'destination_ip': '192.168.1.1',
                'event_type': 'anomalous_traffic',
                'severity': severity,
                'description': 'High volume traffic detected - possible DDoS',
                'port': 80
            })
    
    elif attack_type == "data_exfiltration":
        # Simulate data exfiltration
        for i in range(15):
            telemetry.append({
                'timestamp': (datetime.now() - timedelta(seconds=i*10)).isoformat(),
                'source_ip': '192.168.1.50',
                'destination_ip': base_ip,
                'event_type': random.choice(['large_data_transfer', 'anomalous_traffic', 'unauthorized_access']),
                'severity': severity,
                'description': 'Unusual data transfer to external IP detected',
                'port': random.choice([443, 8080, 1337])
            })
    
    elif attack_type == "apt":
        # Simulate Advanced Persistent Threat
        for i in range(8):
            telemetry.append({
                'timestamp': (datetime.now() - timedelta(minutes=i*5)).isoformat(),
                'source_ip': base_ip,
                'destination_ip': f"192.168.{random.randint(1, 10)}.{random.randint(1, 254)}",
                'event_type': random.choice(['port_scan', 'lateral_movement', 'privilege_escalation']),
                'severity': 'CRITICAL',
                'description': 'APT activity detected - sophisticated attack pattern',
                'port': random.randint(1024, 65535)
            })
    
    else:
        # Generic attack telemetry
        for i in range(10):
            telemetry.append({
                'timestamp': (datetime.now() - timedelta(seconds=i*3)).isoformat(),
                'source_ip': base_ip,
                'destination_ip': f"192.168.1.{random.randint(1, 254)}",
                'event_type': random.choice(['suspicious_activity', 'anomalous_traffic', 'policy_violation']),
                'severity': severity,
                'description': f'Security event detected: {attack_type}',
                'port': random.randint(1, 65535)
            })
    
    return telemetry

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)