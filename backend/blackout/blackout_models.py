# backend/blackout/blackout_models.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class BlackoutSeverity(str, Enum):
    MINOR = "MINOR"           # < 30% grid capacity lost
    MODERATE = "MODERATE"     # 30-60% grid capacity lost
    MAJOR = "MAJOR"           # 60-85% grid capacity lost
    CATASTROPHIC = "CATASTROPHIC"  # > 85% grid capacity lost

class PowerState(str, Enum):
    FULL_POWER = "FULL_POWER"
    REDUCED_POWER = "REDUCED_POWER"
    BACKUP_POWER = "BACKUP_POWER"
    NO_POWER = "NO_POWER"

class ZonePriority(str, Enum):
    CRITICAL = "CRITICAL"      # Hospitals, Defence - Never cut power
    HIGH = "HIGH"              # Airport, Emergency Services
    MEDIUM = "MEDIUM"          # Commercial, Education
    LOW = "LOW"                # Residential, Parks

class PowerZone(BaseModel):
    id: str
    name: str
    zone_type: str
    priority: ZonePriority
    power_state: PowerState
    current_load_mw: float
    capacity_mw: float
    backup_available: bool
    backup_capacity_mw: float
    backup_duration_hours: float
    affected_population: int
    critical_facilities: List[str]
    power_allocation_percent: float  # Percentage of normal allocation
    lat: float
    lon: float

class BlackoutIncident(BaseModel):
    incident_id: str
    severity: BlackoutSeverity
    affected_zones: List[str]
    cause: str
    total_capacity_lost_mw: float
    estimated_recovery_hours: float
    status: str  # ACTIVE, RECOVERING, RESOLVED
    initiated_at: str
    resolved_at: Optional[str] = None
    weather_related: bool
    cascade_risk: float  # 0-1 probability of cascading failure

class PowerAllocationPlan(BaseModel):
    plan_id: str
    incident_id: str
    total_available_mw: float
    allocations: Dict[str, float]  # zone_id -> MW allocated
    affected_zones: List[str]
    prioritization_strategy: str
    estimated_recovery_time: float
    agent_reasoning: str

class BlackoutDashboardState(BaseModel):
    zones: List[PowerZone]
    active_incidents: List[BlackoutIncident]
    total_grid_capacity_mw: float
    current_grid_load_mw: float
    available_backup_mw: float
    grid_health_score: float  # 0-100

class BlackoutSimulationRequest(BaseModel):
    cause: str  # grid_failure, overload, weather_damage, cyber_attack, equipment_failure
    severity: BlackoutSeverity
    affected_zones: List[str]
    capacity_lost_percent: float
    weather_condition: Optional[str] = None

