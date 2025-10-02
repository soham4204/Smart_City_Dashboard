# Mumbai Smart City Dashboard - Cybersecurity SOAR Integration

## Overview

This update adds a complete **AI-driven Security Orchestration, Automation, and Response (SOAR)** framework to protect Mumbai's critical infrastructure zones. The system operates alongside the existing weather simulation functionality.

## Architecture

### The 5 SOAR Agents

1. **Telemetry Agent (TA)**
   - Captures and normalizes security events
   - Performs PII/PHI redaction for compliance
   - Standardizes data formats across sources

2. **Anomaly Detection Agent (ADA)**
   - Establishes behavioral baselines
   - Detects anomalies using ML and rule-based thresholds
   - Identifies attack patterns in real-time

3. **Threat Intelligence Retrieval Agent (TIRA)**
   - Maps threats to MITRE ATT&CK framework
   - Assesses mission impact
   - Identifies threat actors

4. **Decision Engine Agent (DEA)**
   - Generates adaptive response playbooks
   - Customizes responses per zone type
   - Uses LLM for decision validation

5. **Execution & Validation Agent (EVA)**
   - Executes response actions automatically
   - Validates mitigation effectiveness
   - Manages state transitions (RED → GREEN)

## Security Zones

### Zone Types and Priorities

1. **Defence Zone** - Zero Trust Architecture, highest protection
2. **Airport Zone** - OT/ICS protection, virtual patching
3. **Hospital Zone** - PII/PHI compliance, life support continuity
4. **Education Zone** - Data privacy, research protection
5. **Commercial Zone** - Ransomware defense, financial security

## API Endpoints

### Cybersecurity Endpoints

#### Get Initial Cyber State
```
GET /api/v1/cyber/initial-state
```

#### Get Zone Details
```
GET /api/v1/cyber/zones/{zone_id}/details
```

#### Simulate Cyber Attack
```
POST /api/v1/cyber/simulate
Body:
{
  "zone_id": "airport_zone",
  "attack_type": "ransomware",  // Options: ransomware, brute_force, ddos, data_exfiltration, apt
  "severity": "HIGH"  // Options: LOW, MEDIUM, HIGH, CRITICAL
}
```

#### Get Security Incidents
```
GET /api/v1/cyber/incidents?active_only=true
```

#### Get Event Stream
```
GET /api/v1/cyber/events/stream?zone_id=airport_zone&limit=50
```

### WebSocket for Real-time Updates
```
WS /ws/updates
```

Receives messages:
- `cyber_alert` - When attack detected (RED state)
- `cyber_update` - When mitigation complete (GREEN state)
- `weather_update` - Weather system updates

## State Transitions

### Security States

- **🔴 RED**: Active cyber threat detected
- **🟡 YELLOW**: Partial mitigation or warning
- **🟢 GREEN**: Secure/threat neutralized

### State Flow

1. Normal operation → **GREEN**
2. Attack detected → **RED** (immediate)
3. SOAR pipeline processes threat
4. Mitigation executed
5. Validation confirms success → **GREEN**

## Attack Simulations

### Available Attack Types

1. **Ransomware** - File encryption, C&C communication
2. **Brute Force** - Multiple failed login attempts
3. **DDoS** - High volume traffic attack
4. **Data Exfiltration** - Unauthorized data transfer
5. **APT** - Advanced persistent threat with lateral movement

### Example Attack Simulation

```python
import requests

# Simulate ransomware attack on hospital
response = requests.post("http://localhost:8000/api/v1/cyber/simulate", json={
    "zone_id": "hospital_zone",
    "attack_type": "ransomware",
    "severity": "CRITICAL"
})

print(response.json())
# Output includes:
# - incident_id
# - time_to_detection
# - time_to_mitigation
# - final_state (GREEN if successful)
```

## Frontend Integration Requirements

### Map Visualization

1. **Zone Colors by State**:
   - GREEN: `#10b981` (secure)
   - YELLOW: `#f59e0b` (warning)
   - RED: `#ef4444` (active threat)

2. **On Zone Click - Display**:
   - Real-time event logs
   - Attack visualization/path
   - Agent response status
   - Metrics (time-to-detection, time-to-mitigation)

3. **Real-time Updates**:
   - Connect to WebSocket endpoint
   - Update zone colors on state changes
   - Show notifications for incidents

### Dashboard Components Needed

1. **Security Overview Panel**
   - Global threat level
   - Active incidents count
   - Zones at risk

2. **Zone Detail View**
   - Event log stream
   - Critical assets status
   - Compliance status
   - Recent incidents

3. **Incident Timeline**
   - Attack detection
   - SOAR actions taken
   - Mitigation status
   - Resolution time

4. **Metrics Dashboard**
   - Average detection time
   - Average mitigation time
   - Success rate
   - False positive rate

## Running the System

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The server will run on `http://localhost:8000`

### Testing the SOAR Pipeline

```bash
# Test directly
cd backend
python cyber_agents.py

# Or via API
curl -X POST http://localhost:8000/api/v1/cyber/simulate \
  -H "Content-Type: application/json" \
  -d '{"zone_id": "defence_zone", "attack_type": "apt", "severity": "CRITICAL"}'
```

## Compliance Features

### Healthcare/Education Zones
- Automatic PII/PHI redaction
- HIPAA/FERPA compliance
- Audit logging

### Defence Zone
- Zero Trust enforcement
- Microsegmentation
- Continuous authentication

### Airport Zone
- OT/ICS protection
- Virtual patching
- Non-disruptive mitigation

## Performance Metrics

- **Target Detection Time**: < 2 minutes
- **Target Mitigation Time**: < 5 minutes
- **Automation Level**: 95% for known threats
- **False Positive Rate**: < 5%

## Configuration

### Adjust Agent Thresholds

In `cyber_agents.py`, modify:

```python
self.baseline_thresholds = {
    'failed_login': 5,  # Adjust sensitivity
    'port_scan': 10,
    'anomalous_traffic': 3
}
```

### Zone-Specific Rules

Customize in `DecisionEngineAgent.customize_steps()` method

### LLM Configuration

Update in `cyber_agents.py`:

```python
cyber_llm = ChatGroq(
    api_key=API_KEY,
    temperature=0.1,  # Lower = more consistent
    model_name="llama-3.1-8b-instant"
)
```

## Monitoring & Logging

- All SOAR actions are logged
- Incident reports generated automatically
- Forensic data preserved
- Compliance audit trails maintained

## Security Best Practices

1. Regularly update threat intelligence
2. Review and tune detection thresholds
3. Test incident response playbooks
4. Maintain compliance certifications
5. Conduct red team exercises

## Support & Documentation

- MITRE ATT&CK: https://attack.mitre.org/
- API Documentation: http://localhost:8000/docs
- WebSocket Testing: Use tools like `websocat` or Postman

## Future Enhancements

- [ ] Machine learning model training on historical data
- [ ] Integration with external threat feeds
- [ ] Automated threat hunting
- [ ] Predictive attack modeling
- [ ] Cross-zone correlation analysis
- [ ] Blockchain-based audit logs