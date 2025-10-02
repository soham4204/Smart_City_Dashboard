# backend/models.py
from pydantic import BaseModel
from typing import List, Tuple

class LightPole(BaseModel):
    id: str
    location: Tuple[float, float] # latitude, longitude
    brightness: int # 0-100
    status: str # e.g., "ONLINE", "OFFLINE", "MAINTENANCE"
    priority: str  # "High", "Medium", "Low"
    manual_override: bool
    group: str # The zone name

class Zone(BaseModel):
    id: str
    name: str
    color: str
    poles: List[LightPole]

class DashboardState(BaseModel):
    zones: List[Zone]

class SimulationRequest(BaseModel):
    scenario: str

class OverrideRequest(BaseModel):
    manual_override: bool
    brightness: int