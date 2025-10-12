# Blackout Management System - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend/blackout
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file in the `backend/blackout` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get your Groq API key from: https://console.groq.com/

### 3. Start the Server

```bash
python main.py
```

The server will start on `http://localhost:8002`

### 4. Start the Frontend

In a separate terminal:

```bash
cd frontend
npm install  # if not already done
npm run dev
```

Access the blackout dashboard at: `http://localhost:3000/blackout`

## Testing the System

### Test Scenario 1: Minor Equipment Failure

```bash
curl -X POST http://localhost:8002/api/v1/blackout/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "cause": "equipment_failure",
    "severity": "MINOR",
    "affected_zones": ["zone_residential_borivali"],
    "capacity_lost_percent": 20,
    "weather_condition": null
  }'
```

**Expected Result:**
- 1 residential zone loses some power
- Critical zones unaffected
- Recovery time: ~2 hours
- Grid health: 80-90%

### Test Scenario 2: Weather-Induced Major Blackout

```bash
curl -X POST http://localhost:8002/api/v1/blackout/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "cause": "weather_damage",
    "severity": "MAJOR",
    "affected_zones": ["zone_residential_andheri", "zone_bkc_commercial", "zone_education"],
    "capacity_lost_percent": 70,
    "weather_condition": "storm"
  }'
```

**Expected Result:**
- 3 zones affected (residential, commercial, education)
- Critical zones (hospital, defence) maintain 100% power
- Commercial zones switch to backup
- Residential zones experience brownouts
- Recovery time: ~18 hours (12h × 1.5 weather multiplier)
- Grid health: 30-40%

### Test Scenario 3: Catastrophic Cyber Attack

```bash
curl -X POST http://localhost:8002/api/v1/blackout/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "cause": "cyber_attack",
    "severity": "CATASTROPHIC",
    "affected_zones": ["zone_airport", "zone_port", "zone_bkc_commercial", "zone_residential_andheri", "zone_residential_borivali"],
    "capacity_lost_percent": 90,
    "weather_condition": null
  }'
```

**Expected Result:**
- 5 zones affected (most of the city)
- Only critical zones (hospital, defence) maintain full power
- Airport switches to backup power
- Commercial and residential zones lose power
- Cascade risk: 70-90%
- Recovery time: ~24+ hours
- Grid health: < 15%

## API Endpoints Reference

### Get Current State
```bash
curl http://localhost:8002/api/v1/blackout/initial-state
```

### Get Zone Details
```bash
curl http://localhost:8002/api/v1/blackout/zones/zone_hospital/details
```

### Manual Power Allocation
```bash
curl -X POST http://localhost:8002/api/v1/blackout/incidents/{incident_id}/manual-allocate \
  -H "Content-Type: application/json" \
  -d '{
    "zone_residential_andheri": 30,
    "zone_bkc_commercial": 50,
    "zone_education": 40
  }'
```

### Resolve Incident
```bash
curl -X POST http://localhost:8002/api/v1/blackout/incidents/{incident_id}/resolve
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 Blackout Management System               │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Frontend (React + TypeScript)                           │
│  ├─ BlackoutPage                                         │
│  ├─ BlackoutMap (Leaflet)                                │
│  ├─ BlackoutSimulator                                    │
│  ├─ IncidentPanel                                        │
│  └─ ZonePowerPanel                                       │
│                                                           │
│  ↕ WebSocket (Real-time updates)                         │
│                                                           │
│  Backend (FastAPI + Python)                              │
│  ├─ API Endpoints                                        │
│  ├─ WebSocket Manager                                    │
│  └─ SOAR Pipeline                                        │
│      ├─ Grid Telemetry Agent (GTA)                       │
│      ├─ Grid Analysis Agent (GAA)                        │
│      ├─ Weather Integration Agent (WIA)                  │
│      ├─ Power Allocation Agent (PAA)                     │
│      └─ Execution & Validation Agent (EVA)               │
│                                                           │
│  AI/LLM Layer (Groq - Llama 3.1)                        │
│  └─ Enhanced decision making and recommendations         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Power Zones

| Zone | Priority | Backup | Population | Key Facilities |
|------|----------|--------|------------|----------------|
| Defence Zone | CRITICAL | 72h | 250,000 | Military installations |
| Hospital Zone | CRITICAL | 96h | 400,000 | Major hospitals, ICUs |
| Airport Zone | HIGH | 48h | 150,000 | Airport, ATC |
| Port Zone | HIGH | 24h | 50,000 | Port operations |
| BKC Commercial | MEDIUM | 12h | 100,000 | Financial district |
| Education Zone | MEDIUM | 8h | 80,000 | Universities, schools |
| Andheri Residential | LOW | 0h | 800,000 | Residential areas |
| Borivali Residential | LOW | 0h | 600,000 | Residential areas |

## AI Agent Workflow

1. **Grid Telemetry Agent (GTA)**
   - Collects grid data (voltage, frequency, load)
   - Normalizes telemetry from multiple sources
   - Calculates grid stability score

2. **Grid Analysis Agent (GAA)**
   - Detects anomalies in grid operations
   - Calculates cascade failure risk
   - Uses LLM for risk assessment

3. **Weather Integration Agent (WIA)**
   - Assesses weather impact on blackout
   - Adjusts recovery timeline
   - Provides weather-specific recommendations

4. **Power Allocation Agent (PAA)**
   - Generates optimal power distribution
   - Prioritizes critical infrastructure
   - Manages backup power deployment
   - Uses LLM for strategy validation

5. **Execution & Validation Agent (EVA)**
   - Executes allocation plans
   - Validates effectiveness
   - Monitors recovery progress

## Troubleshooting

### Server won't start
- Check if port 8002 is already in use
- Verify GROQ_API_KEY is set correctly
- Ensure all dependencies are installed

### WebSocket connection fails
- Check if backend server is running
- Verify CORS settings allow localhost:3000
- Check browser console for errors

### Frontend shows "Loading..."
- Verify backend is running on port 8002
- Check API endpoint URLs in frontend code
- Look for CORS or network errors

### SOAR pipeline errors
- Verify Groq API key is valid
- Check Groq API rate limits
- Review backend logs for specific errors

## Integration with Other Systems

### Weather System Integration
The blackout system can be triggered by weather events:
- Storm → Weather Damage blackout
- Heatwave → Overload blackout
- Flooding → Equipment Failure blackout

### Cybersecurity Integration
Cyber attacks can trigger blackouts:
- SCADA compromise → Cyber Attack blackout
- Coordinated with CyberSOAR system

## Performance Metrics

The system tracks:
- **Response Time**: SOAR pipeline processing time
- **Grid Health Score**: Overall grid stability (0-100)
- **Cascade Risk**: Probability of cascading failure (0-1)
- **Recovery Progress**: Percentage of power restored
- **Population Impact**: Number of people affected

## Future Enhancements

1. **Predictive Analytics**: ML models to forecast blackouts
2. **Renewable Integration**: Solar/wind backup management
3. **Load Shedding Optimization**: Smart load balancing
4. **Historical Analytics**: Pattern recognition from past incidents
5. **Multi-City Support**: Scale to other smart cities

## Credits

Developed for Mumbai Smart City Dashboard
- Weather System (Port 8000)
- Cybersecurity System (Port 8001)
- Blackout Management (Port 8002)



