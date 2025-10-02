# backend/cyber_models.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# ==================== ENUMS ====================

class SecurityStateEnum(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"

class SeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AttackTypeEnum(str, Enum):
    RANSOMWARE = "ransomware"
    BRUTE_FORCE = "brute_force"
    DDOS = "ddos"
    DATA_EXFILTRATION = "data_exfiltration"
    APT = "apt"
    PHISHING = "phishing"
    MALWARE = "malware"
    INSIDER_THREAT = "insider_threat"

class ComplianceStatusEnum(str, Enum):
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    PARTIAL = "PARTIAL"

class IncidentStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    MITIGATED = "MITIGATED"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"

# ==================== CYBER MODELS ====================

class CyberEvent(BaseModel):
    """Individual security event"""
    event_id: str
    zone_id: str
    event_type: str
    severity: SeverityEnum
    description: str
    timestamp: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    port: Optional[int] = None
    mitre_ttp: Optional[str] = None

class CyberIncident(BaseModel):
    """Security incident (collection of related events)"""
    incident_id: str
    zone_id: str
    attack_type: str
    severity: SeverityEnum
    status: IncidentStatusEnum
    detected_at: str
    mitigated_at: Optional[str] = None
    time_to_detection: Optional[float] = None  # in minutes
    time_to_mitigation: Optional[float] = None  # in minutes
    affected_assets: List[str] = []
    response_playbook: Optional[str] = None
    mitre_ttps: List[str] = []

class CyberZone(BaseModel):
    """Cybersecurity zone information"""
    id: str
    name: str
    zone_type: str  # airport_zone, hospital_zone, defence_zone, etc.
    security_state: SecurityStateEnum
    critical_assets: List[str]
    active_incidents: int
    last_incident_time: Optional[str] = None
    compliance_status: ComplianceStatusEnum
    threat_level: str  # LOW, MEDIUM, HIGH, CRITICAL

class ThreatIntelligence(BaseModel):
    """Threat intelligence data"""
    zone_id: str
    mitre_ttps: List[str]
    threat_actors: List[str]
    risk_level: str
    mission_impact: Dict[str, Any]
    recommended_actions: List[str]
    confidence_score: float  # 0.0 to 1.0

class ResponsePlaybook(BaseModel):
    """Automated response playbook"""
    playbook_id: str
    name: str
    zone_type: str
    risk_level: str
    steps: List[Dict[str, Any]]
    automation_level: str  # FULL, SEMI, MANUAL
    estimated_time: int  # in minutes
    generated_at: str

class ExecutionResult(BaseModel):
    """Result of executing a response action"""
    action: str
    status: str  # SUCCESS, FAILED, PENDING
    timestamp: str
    details: Optional[str] = None
    retry_count: int = 0

class ValidationResult(BaseModel):
    """Validation of mitigation effectiveness"""
    validation_passed: bool
    checks: List[Dict[str, Any]]
    new_security_state: SecurityStateEnum
    validated_at: str
    confidence_score: float

class CyberMetrics(BaseModel):
    """Security metrics for a zone"""
    zone_id: str
    total_events_24h: int
    critical_events_24h: int
    avg_time_to_detection: float  # minutes
    avg_time_to_mitigation: float  # minutes
    compliance_score: int  # 0-100
    security_posture_score: int  # 0-100
    false_positive_rate: float  # percentage

class CyberDashboardState(BaseModel):
    """Overall cybersecurity dashboard state"""
    zones: List[CyberZone]
    active_incidents: List[CyberIncident]
    recent_events: List[CyberEvent]
    global_threat_level: str = "LOW"
    last_update: str = datetime.now().isoformat()

# ==================== REQUEST/RESPONSE MODELS ====================

class CyberSimulationRequest(BaseModel):
    """Request to simulate a cyber attack"""
    zone_id: str
    attack_type: AttackTypeEnum
    severity: SeverityEnum = SeverityEnum.MEDIUM
    duration: Optional[int] = 5  # minutes
    custom_telemetry: Optional[List[Dict[str, Any]]] = None

class CyberSimulationResponse(BaseModel):
    """Response from cyber attack simulation"""
    success: bool
    incident_id: str
    initial_state: SecurityStateEnum
    final_state: SecurityStateEnum
    time_to_detection: float
    time_to_mitigation: float
    anomalies_detected: int
    mitre_ttps: List[str]
    response_playbook: str
    validation_passed: bool

class ZoneDetailsRequest(BaseModel):
    """Request for zone details"""
    zone_id: str
    include_events: bool = True
    include_incidents: bool = True
    include_metrics: bool = True
    time_range: Optional[str] = "24h"  # 1h, 24h, 7d, 30d

class ZoneDetailsResponse(BaseModel):
    """Response with zone details"""
    zone: CyberZone
    recent_events: Optional[List[CyberEvent]] = []
    active_incidents: Optional[List[CyberIncident]] = []
    metrics: Optional[CyberMetrics] = None
    recommendations: List[str] = []

class ThreatAnalysisRequest(BaseModel):
    """Request for threat analysis"""
    zone_ids: List[str]
    time_range: str = "24h"
    include_predictions: bool = True

class ThreatAnalysisResponse(BaseModel):
    """Response with threat analysis"""
    overall_risk: str
    zones_at_risk: List[str]
    active_threat_actors: List[str]
    predicted_attacks: List[Dict[str, Any]]
    recommended_actions: List[str]
    threat_trend: str  # INCREASING, STABLE, DECREASING

class SOARStatusRequest(BaseModel):
    """Request for SOAR pipeline status"""
    include_agent_status: bool = True
    include_performance_metrics: bool = True

class SOARStatusResponse(BaseModel):
    """Response with SOAR pipeline status"""
    pipeline_status: str  # OPERATIONAL, DEGRADED, OFFLINE
    agents_status: Dict[str, str]
    total_events_processed: int
    avg_processing_time: float
    success_rate: float
    last_execution: str

class ComplianceReportRequest(BaseModel):
    """Request for compliance report"""
    zone_ids: Optional[List[str]] = None
    compliance_framework: str = "ISO27001"  # ISO27001, NIST, GDPR, HIPAA
    include_violations: bool = True

class ComplianceReportResponse(BaseModel):
    """Response with compliance report"""
    overall_compliance: float  # percentage
    zones_compliance: Dict[str, float]
    violations: List[Dict[str, Any]]
    recommendations: List[str]
    next_audit_date: Optional[str] = None

class ForensicsRequest(BaseModel):
    """Request for forensic analysis"""
    incident_id: str
    include_timeline: bool = True
    include_artifacts: bool = True
    include_iocs: bool = True  # Indicators of Compromise

class ForensicsResponse(BaseModel):
    """Response with forensic analysis"""
    incident_id: str
    timeline: List[Dict[str, Any]]
    artifacts: List[Dict[str, Any]]
    iocs: List[Dict[str, Any]]
    root_cause: str
    attack_vector: str
    lessons_learned: List[str]

# ==================== TELEMETRY MODELS ====================

class TelemetryData(BaseModel):
    """Raw telemetry data"""
    timestamp: str
    source_ip: str
    destination_ip: str
    event_type: str
    severity: str
    description: str
    port: Optional[int] = None
    protocol: Optional[str] = None
    bytes_transferred: Optional[int] = None
    user_agent: Optional[str] = None
    raw_log: Optional[str] = None

class NormalizedTelemetry(BaseModel):
    """Normalized telemetry after processing"""
    timestamp: str
    source_ip: str
    destination_ip: str
    event_type: str
    severity: SeverityEnum
    description: str  # PII/PHI redacted
    metadata: Dict[str, Any] = {}
    correlation_id: Optional[str] = None

class AnomalyDetection(BaseModel):
    """Detected anomaly"""
    anomaly_id: str
    type: str
    severity: SeverityEnum
    confidence: float  # 0.0 to 1.0
    source_ip: Optional[str] = None
    affected_assets: List[str] = []
    description: str
    recommended_action: str
    timestamp: str

# ==================== CONFIGURATION MODELS ====================

class AgentConfiguration(BaseModel):
    """Configuration for SOAR agents"""
    agent_name: str
    enabled: bool = True
    threshold_settings: Dict[str, Any] = {}
    ml_model_version: Optional[str] = None
    update_frequency: int = 60  # seconds

class ZoneConfiguration(BaseModel):
    """Configuration for security zones"""
    zone_id: str
    zone_type: str
    priority: str  # HIGH, MEDIUM, LOW
    custom_rules: List[Dict[str, Any]] = []
    alert_threshold: Dict[str, int] = {}
    compliance_requirements: List[str] = []
    authorized_ips: List[str] = []
    blocked_ips: List[str] = []

class AlertConfiguration(BaseModel):
    """Configuration for alerts"""
    alert_id: str
    name: str
    enabled: bool = True
    severity_threshold: SeverityEnum = SeverityEnum.MEDIUM
    notification_channels: List[str] = ["dashboard", "email"]
    escalation_policy: Dict[str, Any] = {}
    cooldown_period: int = 300  # seconds

# ==================== REPORTING MODELS ====================

class SecurityReport(BaseModel):
    """Security report"""
    report_id: str
    report_type: str  # DAILY, WEEKLY, MONTHLY, INCIDENT
    generated_at: str
    time_period: str
    zones: List[str]
    summary: Dict[str, Any]
    incidents: List[CyberIncident]
    metrics: Dict[str, Any]
    recommendations: List[str]
    executive_summary: str

class DashboardNotification(BaseModel):
    """Real-time dashboard notification"""
    notification_id: str
    type: str  # ALERT, INFO, WARNING, SUCCESS
    zone_id: Optional[str] = None
    title: str
    message: str
    severity: Optional[SeverityEnum] = None
    timestamp: str
    action_required: bool = False
    action_buttons: List[Dict[str, str]] = []

# ==================== WEBSOCKET MODELS ====================

class WebSocketMessage(BaseModel):
    """WebSocket message structure"""
    type: str  # cyber_alert, cyber_update, weather_update, initial_state
    data: Dict[str, Any]
    timestamp: str = datetime.now().isoformat()

class CyberAlertMessage(BaseModel):
    """Cyber alert WebSocket message"""
    zone_id: str
    security_state: SecurityStateEnum
    incident_id: str
    message: str
    severity: SeverityEnum
    requires_action: bool = False

class CyberUpdateMessage(BaseModel):
    """Cyber update WebSocket message"""
    zone_id: str
    security_state: SecurityStateEnum
    incident_id: str
    threat_neutralized: bool
    time_to_mitigation: float
    message: str

# ==================== BATCH OPERATION MODELS ====================

class BatchSimulationRequest(BaseModel):
    """Request to simulate multiple attacks"""
    simulations: List[CyberSimulationRequest]
    parallel: bool = False
    delay_between: int = 0  # seconds

class BatchSimulationResponse(BaseModel):
    """Response from batch simulation"""
    total_simulations: int
    successful: int
    failed: int
    results: List[CyberSimulationResponse]
    overall_time: float  # seconds

# ==================== SYSTEM MODELS ====================

class SystemHealth(BaseModel):
    """System health status"""
    component: str
    status: str  # HEALTHY, DEGRADED, UNHEALTHY
    uptime: float  # hours
    last_check: str
    metrics: Dict[str, float]
    issues: List[str] = []

class SystemStatus(BaseModel):
    """Overall system status"""
    weather_system: SystemHealth
    cyber_system: SystemHealth
    database: SystemHealth
    api: SystemHealth
    websocket: SystemHealth
    overall_status: str
    alerts: List[str] = []