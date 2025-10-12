# Mumbai Smart City Dashboard - Blackout Management System

## Overview

This is a comprehensive **AI-driven Blackout Management and Power Allocation System** designed to protect Mumbai's critical infrastructure during power grid failures. The system uses a **SOAR-style (Security Orchestration, Automation, and Response)** framework adapted for power grid management, operating alongside weather simulation and cybersecurity systems.

## Architecture

### The 5 AI Agents

1. **Grid Telemetry Agent (GTA)**
   - Collects real-time grid telemetry (SCADA, Smart Meters, Substations)
   - Monitors voltage, frequency, load, transformer temperature
   - Normalizes data from diverse sources
   - Calculates grid stability score

2. **Grid Analysis Agent (GAA)**
   - Detects grid anomalies (voltage deviation, frequency instability)
   - Identifies equipment failures and relay trips
   - Calculates cascade failure risk
   - Uses LLM for sophisticated risk assessment
   - Prioritizes recovery actions

3. **Weather Integration Agent (WIA)**
   - Integrates real-time weather data with blackout scenarios
   - Assesses weather impact on recovery timeline
   - Determines outdoor work safety
   - Provides weather-specific recommendations
   - Adjusts severity multipliers for weather-caused blackouts

4. **Power Allocation Agent (PAA)**
   - Generates optimal power distribution plans
   - Prioritizes zones based on criticality:
     * **CRITICAL**: Hospitals, Defence (100% power always)
     * **HIGH**: Airport, Ports (70% minimum)
     * **MEDIUM**: Commercial, Education (40% allocation)
     * **LOW**: Residential (20% allocation during crisis)
   - Manages backup power deployment
   - Uses LLM for allocation strategy validation

5. **Execution & Validation Agent (EVA)**
   - Executes power allocation plans
   - Validates effectiveness of allocations
   - Monitors grid stability post-allocation
   - Provides continuous feedback loop
   - Triggers recovery procedures

## Power Zones

### Zone Types and Priorities

| Zone Type | Priority | Backup Power | Population | Key Facilities |
|-----------|----------|--------------|------------|----------------|
| Defence Zone | CRITICAL | 72 hours | 250,000 | Naval Base, Air Force Station, Military Hospital |
| Hospital Zone | CRITICAL | 96 hours | 400,000 | Major Hospitals, ICU Units, Emergency Services |
| Airport Zone | HIGH | 48 hours | 150,000 | Airport, ATC, Cargo Terminal |
| Port Zone | HIGH | 24 hours | 50,000 | Mumbai Port, Container Terminal, Customs |
| BKC Commercial | MEDIUM | 12 hours | 100,000 | NSE, BSE, Banks, Data Centers |
| Education Zone | MEDIUM | 8 hours | 80,000 | IIT Bombay, Schools, Research Labs |
| Residential (Andheri) | LOW | 0 hours | 800,000 | Residential Complexes, Markets |
| Residential (Borivali) | LOW | 0 hours | 600,000 | Residential Areas, Shopping Centers |

## Blackout Scenarios

### Causes

1. **Grid Failure** - Equipment malfunction, transformer failure
2. **Overload** - Excessive demand, summer peak load
3. **Weather Damage** - Storm, cyclone, lightning strikes
4. **Cyber Attack** - Coordinated attack on SCADA systems
5. **Equipment Failure** - Transmission line break, substation fault

### Severity Levels

1. **MINOR** (< 30% capacity lost)
   - Affects 1-2 zones
   - Recovery: ~2 hours
   - Minimal service disruption

2. **MODERATE** (30-60% capacity lost)
   - Affects 3-4 zones
   - Recovery: ~6 hours
   - Reduced power to non-critical zones

3. **MAJOR** (60-85% capacity lost)
   - Affects 5-6 zones
   - Recovery: ~12 hours
   - Only critical zones maintain power

4. **CATASTROPHIC** (> 85% capacity lost)
   - City-wide impact
   - Recovery: ~24+ hours
   - Emergency backup power only

## API Endpoints

### Blackout Management Endpoints

#### Get Initial State
```
GET /api/v1/blackout/initial-state
```
Returns current state of all power zones, grid capacity, and active incidents.

#### Get Zone Details
```
GET /api/v1/blackout/zones/{zone_id}/details
```
Returns detailed information about a specific power zone.

#### Simulate Blackout
```
POST /api/v1/blackout/simulate
Body:
{
  "cause": "grid_failure",  // Options: grid_failure, overload, weather_damage, cyber_attack, equipment_failure
  "severity": "MAJOR",      // Options: MINOR, MODERATE, MAJOR, CATASTROPHIC
  "affected_zones": ["zone_residential_andheri", "zone_bkc_commercial"],
  "capacity_lost_percent": 65.0,
  "weather_condition": "storm"  // Optional: storm, cyclone, flooding, heatwave, rain, clear
}
```

#### Manual Power Allocation
```
POST /api/v1/blackout/incidents/{incident_id}/manual-allocate
Body:
{
  "zone_defence": 100,
  "zone_hospital": 100,
  "zone_residential_andheri": 30
}
```

#### Resolve Incident
```
POST /api/v1/blackout/incidents/{incident_id}/resolve
```

### WebSocket Connection
```
WS /ws/blackout
```

## Integration with Weather System

The blackout system integrates with the weather simulation:

1. **Weather-Triggered Blackouts**: Storm, cyclone, and flooding conditions can trigger automatic blackouts
2. **Recovery Impact**: Weather conditions affect recovery timeline and outdoor work safety
3. **Severity Multipliers**: Bad weather increases blackout severity (1.1x to 2.0x)
4. **Cascade Risk**: Weather-damaged equipment increases risk of cascading failures

## Features

### Real-Time Monitoring
- Live grid telemetry from all zones
- Voltage, frequency, load monitoring
- Transformer health tracking
- Automatic anomaly detection

### Intelligent Power Allocation
- Priority-based allocation algorithm
- Backup power management
- Load balancing across grid
- Population impact minimization

### Recovery Management
- Automated recovery simulation
- Gradual power restoration
- Real-time progress tracking
- Estimated recovery time calculation

### Weather Integration
- Weather impact assessment
- Outdoor work safety evaluation
- Recovery timeline adjustment
- Weather-specific recommendations

### LLM-Enhanced Decision Making
- Risk assessment validation
- Allocation strategy optimization
- Natural language insights
- Recovery recommendations

## Setup

1. Install dependencies:
```bash
cd backend/blackout
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
export GROQ_API_KEY="your_groq_api_key"
```

3. Run the server:
```bash
python main.py
# Or with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

## Frontend Integration

The frontend should:

1. **Display Power Map**: Show all zones with color-coded power states
   - Green: FULL_POWER
   - Yellow: REDUCED_POWER
   - Orange: BACKUP_POWER
   - Red: NO_POWER

2. **Zone Cards**: Display for each zone:
   - Current power allocation %
   - Population affected
   - Critical facilities
   - Backup power status
   - Priority level

3. **Incident Panel**: Show active blackouts with:
   - Cause and severity
   - Affected zones
   - Recovery timeline
   - SOAR agent analysis

4. **Simulation Controls**: Allow operators to:
   - Trigger blackout scenarios
   - Manually adjust power allocation
   - Force resolve incidents
   - View agent reasoning

5. **Real-Time Updates**: Via WebSocket
   - Power state changes
   - Recovery progress
   - Agent decisions
   - Alert notifications

## Example Scenarios

### Scenario 1: Weather-Induced Catastrophic Blackout
```json
{
  "cause": "weather_damage",
  "severity": "CATASTROPHIC",
  "affected_zones": ["zone_residential_andheri", "zone_residential_borivali", "zone_education", "zone_bkc_commercial"],
  "capacity_lost_percent": 90,
  "weather_condition": "cyclone"
}
```

**Expected Response:**
- Critical zones (Hospital, Defence) maintain 100% power via backup
- Airport gets 70% power (minimum for operations)
- Commercial zones reduced to 20%
- Residential zones lose power completely
- Recovery time: 36+ hours (24h base × 1.5 weather multiplier)

### Scenario 2: Cyber Attack on Grid
```json
{
  "cause": "cyber_attack",
  "severity": "MAJOR",
  "affected_zones": ["zone_airport", "zone_bkc_commercial", "zone_port"],
  "capacity_lost_percent": 70,
  "weather_condition": null
}
```

**Expected Response:**
- Critical infrastructure prioritized
- Commercial zones on backup power
- Port operations reduced
- Airport maintains minimum power for ATC
- Cascade risk calculated at ~60%

## Monitoring and Metrics

The system tracks:

1. **Grid Health Score** (0-100): Overall grid stability
2. **Time to Response**: How fast SOAR pipeline processes incident
3. **Recovery Progress**: Percentage of power restored
4. **Cascade Risk**: Probability of cascading failure (0-1)
5. **Population Impact**: Number of people affected
6. **Backup Duration**: Remaining backup power hours

## Future Enhancements

1. **Machine Learning**: Predictive blackout forecasting
2. **Renewable Integration**: Solar/wind backup management
3. **Grid Optimization**: AI-driven load balancing
4. **Historical Analytics**: Pattern recognition from past incidents
5. **Multi-City Support**: Scale to other smart cities
6. **Battery Storage**: Electric vehicle grid integration

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Blackout SOAR Pipeline                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │     GTA      │───▶│     GAA      │───▶│     WIA      │      │
│  │  Telemetry   │    │   Analysis   │    │   Weather    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                   │               │
│                                                   ▼               │
│                          ┌──────────────┐    ┌──────────────┐   │
│                          │     EVA      │◀───│     PAA      │   │
│                          │  Execution   │    │  Allocation  │   │
│                          └──────────────┘    └──────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   WebSocket Manager    │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Frontend Dashboard   │
                    │   - Power Map          │
                    │   - Zone Status        │
                    │   - Incident Panel     │
                    │   - Manual Controls    │
                    └────────────────────────┘
```

## Credits

Developed for Mumbai Smart City Dashboard as part of the integrated emergency management system, working in coordination with:
- Weather Simulation System (Port 8000)
- Cybersecurity SOAR System (Port 8001)
- Blackout Management System (Port 8002)


