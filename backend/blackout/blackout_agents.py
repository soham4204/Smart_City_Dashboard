# backend/blackout/blackout_agents.py
import os
import json
import random
from typing import TypedDict, Dict, List, Any, Optional
from datetime import datetime, timedelta
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
import hashlib
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize LLM for blackout management agents
groq_api_key = os.getenv("GROQ_API_KEY")
blackout_llm = ChatGroq(
    api_key=groq_api_key,
    temperature=0.2,
    model_name="llama-3.1-8b-instant"
)

# ===================== STATE DEFINITION =====================

class BlackoutManagementState(TypedDict):
    """State management for the Blackout Response pipeline"""
    incident_id: str
    cause: str
    severity: str
    affected_zones: List[str]
    capacity_lost_mw: float
    weather_condition: Optional[str]
    
    # Agent outputs
    grid_telemetry: Dict[str, Any]
    grid_analysis: Dict[str, Any]
    weather_impact: Dict[str, Any]
    power_allocation_plan: Dict[str, Any]
    execution_status: Dict[str, Any]
    validation_results: Dict[str, Any]
    
    # Metrics
    time_to_response: Optional[float]
    recovery_progress: float

# ===================== AGENT 1: GRID TELEMETRY AGENT (GTA) =====================

class GridTelemetryAgent:
    """Captures and normalizes grid telemetry data"""
    
    def __init__(self):
        self.data_sources = ["SCADA", "Smart_Meters", "Substations", "Transmission_Lines"]
    
    def collect_grid_data(self, zone_ids: List[str]) -> List[Dict]:
        """Simulate collecting real-time grid data"""
        telemetry = []
        
        for zone_id in zone_ids:
            telemetry.append({
                "zone_id": zone_id,
                "timestamp": datetime.now().isoformat(),
                "voltage_kv": round(random.uniform(10, 15), 2),
                "frequency_hz": round(random.uniform(49.8, 50.2), 2),
                "load_mw": round(random.uniform(5, 50), 2),
                "transformer_temp_celsius": round(random.uniform(60, 95), 1),
                "relay_status": random.choice(["NORMAL", "TRIPPED", "ALERT"]),
                "line_losses_percent": round(random.uniform(2, 8), 2),
                "power_factor": round(random.uniform(0.85, 0.98), 3),
                "source": random.choice(self.data_sources)
            })
        
        return telemetry
    
    def normalize_telemetry(self, raw_data: List[Dict]) -> List[Dict]:
        """Standardize telemetry format"""
        normalized = []
        
        for event in raw_data:
            normalized.append({
                "zone_id": event["zone_id"],
                "timestamp": event["timestamp"],
                "metrics": {
                    "voltage_kv": event["voltage_kv"],
                    "frequency_hz": event["frequency_hz"],
                    "load_mw": event["load_mw"],
                    "transformer_temp": event["transformer_temp_celsius"],
                    "relay_status": event["relay_status"],
                    "line_losses": event["line_losses_percent"],
                    "power_factor": event["power_factor"]
                },
                "health_indicators": {
                    "voltage_ok": 11 <= event["voltage_kv"] <= 14,
                    "frequency_ok": 49.9 <= event["frequency_hz"] <= 50.1,
                    "temp_ok": event["transformer_temp_celsius"] < 85
                },
                "data_source": event["source"]
            })
        
        return normalized
    
    def process(self, state: BlackoutManagementState) -> Dict:
        """Main processing function for Grid Telemetry Agent"""
        print(f"[GTA] Collecting grid telemetry for {len(state['affected_zones'])} zones")
        
        raw_data = self.collect_grid_data(state['affected_zones'])
        normalized_data = self.normalize_telemetry(raw_data)
        
        # Calculate aggregate metrics
        total_load = sum(d["metrics"]["load_mw"] for d in normalized_data)
        avg_voltage = sum(d["metrics"]["voltage_kv"] for d in normalized_data) / len(normalized_data)
        healthy_count = sum(1 for d in normalized_data if all(d["health_indicators"].values()))
        
        grid_telemetry = {
            "raw_events": raw_data,
            "normalized_events": normalized_data,
            "aggregate_metrics": {
                "total_load_mw": round(total_load, 2),
                "average_voltage_kv": round(avg_voltage, 2),
                "healthy_zones": healthy_count,
                "total_zones": len(normalized_data),
                "grid_stability_score": round((healthy_count / len(normalized_data)) * 100, 1)
            },
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"[GTA] Grid stability score: {grid_telemetry['aggregate_metrics']['grid_stability_score']}%")
        
        return {"grid_telemetry": grid_telemetry}

# ===================== AGENT 2: GRID ANALYSIS AGENT (GAA) =====================

class GridAnalysisAgent:
    """Analyzes grid conditions and identifies critical failures"""
    
    def __init__(self):
        self.thresholds = {
            "voltage_low": 11.0,
            "voltage_high": 14.0,
            "frequency_low": 49.9,
            "frequency_high": 50.1,
            "transformer_temp_critical": 85,
            "load_factor_critical": 0.9
        }
    
    def detect_grid_anomalies(self, telemetry: Dict) -> List[Dict]:
        """Detect anomalies in grid operations"""
        anomalies = []
        
        for event in telemetry.get("normalized_events", []):
            zone_id = event["zone_id"]
            metrics = event["metrics"]
            
            # Voltage anomalies
            if metrics["voltage_kv"] < self.thresholds["voltage_low"]:
                anomalies.append({
                    "zone_id": zone_id,
                    "type": "VOLTAGE_LOW",
                    "severity": "HIGH",
                    "value": metrics["voltage_kv"],
                    "threshold": self.thresholds["voltage_low"],
                    "impact": "Equipment damage risk, brownout conditions"
                })
            
            # Frequency anomalies
            if not (self.thresholds["frequency_low"] <= metrics["frequency_hz"] <= self.thresholds["frequency_high"]):
                anomalies.append({
                    "zone_id": zone_id,
                    "type": "FREQUENCY_DEVIATION",
                    "severity": "CRITICAL",
                    "value": metrics["frequency_hz"],
                    "impact": "Grid instability, potential cascade failure"
                })
            
            # Temperature anomalies
            if metrics["transformer_temp"] > self.thresholds["transformer_temp_critical"]:
                anomalies.append({
                    "zone_id": zone_id,
                    "type": "TRANSFORMER_OVERHEAT",
                    "severity": "HIGH",
                    "value": metrics["transformer_temp"],
                    "impact": "Transformer failure imminent, automatic shutdown required"
                })
            
            # Relay trips
            if metrics["relay_status"] == "TRIPPED":
                anomalies.append({
                    "zone_id": zone_id,
                    "type": "RELAY_TRIP",
                    "severity": "CRITICAL",
                    "impact": "Zone disconnected from grid, immediate restoration needed"
                })
        
        return anomalies
    
    def calculate_cascade_risk(self, anomalies: List[Dict], capacity_lost: float) -> float:
        """Calculate risk of cascading failure"""
        risk_score = 0.0
        
        # Base risk from capacity loss
        risk_score += min(capacity_lost / 100, 0.4)
        
        # Additional risk from critical anomalies
        critical_count = sum(1 for a in anomalies if a["severity"] == "CRITICAL")
        risk_score += min(critical_count * 0.15, 0.3)
        
        # Frequency deviation is especially dangerous
        freq_anomalies = [a for a in anomalies if a["type"] == "FREQUENCY_DEVIATION"]
        if freq_anomalies:
            risk_score += 0.3
        
        return min(risk_score, 1.0)
    
    def process(self, state: BlackoutManagementState) -> Dict:
        """Main processing function for Grid Analysis Agent"""
        print(f"[GAA] Analyzing grid conditions for incident: {state['incident_id']}")
        
        telemetry = state.get("grid_telemetry", {})
        anomalies = self.detect_grid_anomalies(telemetry)
        cascade_risk = self.calculate_cascade_risk(anomalies, state["capacity_lost_mw"])
        
        # Use LLM for sophisticated analysis
        prompt = f"""
        As a grid operations expert, analyze this blackout incident:
        
        Cause: {state['cause']}
        Severity: {state['severity']}
        Capacity Lost: {state['capacity_lost_mw']} MW
        Affected Zones: {len(state['affected_zones'])}
        Grid Stability: {telemetry.get('aggregate_metrics', {}).get('grid_stability_score', 0)}%
        Anomalies Detected: {len(anomalies)}
        Cascade Risk: {cascade_risk:.2%}
        
        Provide a brief assessment (2-3 sentences) of:
        1. Immediate risks
        2. Recovery complexity
        3. Priority actions needed
        """
        
        llm_assessment = blackout_llm.invoke(prompt)
        
        grid_analysis = {
            "anomalies": anomalies,
            "anomaly_count": len(anomalies),
            "cascade_risk": round(cascade_risk, 3),
            "grid_stability": telemetry.get('aggregate_metrics', {}).get('grid_stability_score', 0),
            "critical_zones": [a["zone_id"] for a in anomalies if a["severity"] == "CRITICAL"],
            "llm_assessment": llm_assessment.content,
            "recommended_priority": "IMMEDIATE" if cascade_risk > 0.7 else "HIGH" if cascade_risk > 0.4 else "NORMAL"
        }
        
        print(f"[GAA] Detected {len(anomalies)} anomalies, cascade risk: {cascade_risk:.2%}")
        
        return {"grid_analysis": grid_analysis}

# ===================== AGENT 3: WEATHER INTEGRATION AGENT (WIA) =====================

class WeatherIntegrationAgent:
    """Integrates weather data to assess impact on blackout and recovery"""
    
    def __init__(self):
        self.weather_impacts = {
            "storm": {"severity_multiplier": 1.5, "recovery_delay_hours": 4, "cascade_risk": 0.3},
            "heatwave": {"severity_multiplier": 1.3, "recovery_delay_hours": 2, "cascade_risk": 0.2},
            "flooding": {"severity_multiplier": 1.4, "recovery_delay_hours": 8, "cascade_risk": 0.4},
            "cyclone": {"severity_multiplier": 2.0, "recovery_delay_hours": 12, "cascade_risk": 0.6},
            "clear": {"severity_multiplier": 1.0, "recovery_delay_hours": 0, "cascade_risk": 0.0},
            "rain": {"severity_multiplier": 1.1, "recovery_delay_hours": 1, "cascade_risk": 0.1}
        }
    
    def assess_weather_impact(self, weather_condition: Optional[str], cause: str) -> Dict:
        """Assess how weather affects the blackout"""
        if not weather_condition:
            weather_condition = "clear"
        
        weather_condition = weather_condition.lower()
        impact_data = self.weather_impacts.get(weather_condition, self.weather_impacts["clear"])
        
        # Determine if weather caused the blackout
        weather_caused = cause.lower() in ["weather_damage", "lightning", "storm", "flooding"]
        
        # Calculate combined impact
        combined_severity = impact_data["severity_multiplier"]
        if weather_caused:
            combined_severity *= 1.3
        
        return {
            "weather_condition": weather_condition,
            "weather_caused_blackout": weather_caused,
            "severity_multiplier": impact_data["severity_multiplier"],
            "recovery_delay_hours": impact_data["recovery_delay_hours"],
            "additional_cascade_risk": impact_data["cascade_risk"],
            "combined_severity_factor": round(combined_severity, 2),
            "outdoor_work_safe": weather_condition in ["clear", "rain"],
            "equipment_exposure_risk": weather_condition in ["storm", "cyclone", "flooding"]
        }
    
    def get_weather_recommendations(self, weather_impact: Dict) -> List[str]:
        """Generate weather-specific recommendations"""
        recommendations = []
        
        if not weather_impact["outdoor_work_safe"]:
            recommendations.append("Deploy indoor repair crews only until weather clears")
            recommendations.append("Postpone non-critical outdoor maintenance")
        
        if weather_impact["equipment_exposure_risk"]:
            recommendations.append("Protect exposed equipment with weatherproof covers")
            recommendations.append("Deploy emergency drainage systems near critical infrastructure")
        
        if weather_impact["weather_caused_blackout"]:
            recommendations.append("Inspect all weather-exposed infrastructure for damage")
            recommendations.append("Activate weather emergency protocols")
        
        if weather_impact["recovery_delay_hours"] > 4:
            recommendations.append(f"Extend recovery timeline by {weather_impact['recovery_delay_hours']} hours")
            recommendations.append("Arrange temporary shelter for affected populations")
        
        return recommendations
    
    def process(self, state: BlackoutManagementState) -> Dict:
        """Main processing function for Weather Integration Agent"""
        print(f"[WIA] Assessing weather impact for incident: {state['incident_id']}")
        
        weather_impact = self.assess_weather_impact(
            state.get("weather_condition"),
            state["cause"]
        )
        
        recommendations = self.get_weather_recommendations(weather_impact)
        
        # Use LLM to enhance weather analysis
        prompt = f"""
        As a meteorological disaster analyst, assess this scenario:
        
        Blackout Cause: {state['cause']}
        Current Weather: {weather_impact['weather_condition']}
        Weather-Caused: {weather_impact['weather_caused_blackout']}
        Recovery Delay: {weather_impact['recovery_delay_hours']} hours
        Outdoor Work Safe: {weather_impact['outdoor_work_safe']}
        
        Provide 2 critical weather-related considerations for power restoration teams.
        """
        
        llm_weather_advice = blackout_llm.invoke(prompt)
        
        weather_analysis = {
            "impact_assessment": weather_impact,
            "recommendations": recommendations,
            "llm_weather_advice": llm_weather_advice.content,
            "severity_adjustment": weather_impact["combined_severity_factor"],
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"[WIA] Weather: {weather_impact['weather_condition']}, "
              f"Severity multiplier: {weather_impact['severity_multiplier']}")
        
        return {"weather_impact": weather_analysis}

# ===================== AGENT 4: POWER ALLOCATION AGENT (PAA) =====================

class PowerAllocationAgent:
    """Determines optimal power allocation to zones based on priority"""
    
    def __init__(self):
        self.priority_weights = {
            "CRITICAL": 1.0,   # Always get full power
            "HIGH": 0.7,       # Get 70% of requested power
            "MEDIUM": 0.4,     # Get 40% of requested power
            "LOW": 0.2         # Get 20% of requested power
        }
    
    def calculate_zone_allocations(
        self, 
        zones: List[Dict], 
        available_capacity_mw: float,
        grid_analysis: Dict
    ) -> Dict[str, float]:
        """Calculate power allocation for each zone"""
        
        # Step 1: Identify critical zones that must have full power
        critical_zones = [z for z in zones if z["priority"] == "CRITICAL"]
        critical_demand = sum(z["current_load_mw"] for z in critical_zones)
        
        # Step 2: Check if we have enough for critical zones
        if critical_demand > available_capacity_mw:
            print(f"[PAA] WARNING: Insufficient capacity for all critical zones!")
            # Distribute proportionally even among critical
            allocations = {
                z["id"]: (z["current_load_mw"] / critical_demand) * available_capacity_mw
                for z in critical_zones
            }
            # Others get 0
            for z in zones:
                if z["id"] not in allocations:
                    allocations[z["id"]] = 0.0
            return allocations
        
        # Step 3: Allocate to critical zones first
        allocations = {z["id"]: z["current_load_mw"] for z in critical_zones}
        remaining_capacity = available_capacity_mw - critical_demand
        
        # Step 4: Allocate to other zones based on priority weights
        other_zones = [z for z in zones if z["priority"] != "CRITICAL"]
        total_weighted_demand = sum(
            z["current_load_mw"] * self.priority_weights[z["priority"]]
            for z in other_zones
        )
        
        if total_weighted_demand > 0:
            for zone in other_zones:
                priority_weight = self.priority_weights[zone["priority"]]
                weighted_demand = zone["current_load_mw"] * priority_weight
                allocation = (weighted_demand / total_weighted_demand) * remaining_capacity
                allocations[zone["id"]] = round(allocation, 2)
        else:
            for zone in other_zones:
                allocations[zone["id"]] = 0.0
        
        return allocations
    
    def generate_backup_strategy(self, zones: List[Dict], allocations: Dict[str, float]) -> Dict:
        """Generate backup power usage strategy"""
        backup_plan = {
            "zones_on_backup": [],
            "total_backup_capacity_mw": 0.0,
            "estimated_backup_duration_hours": 0.0
        }
        
        for zone in zones:
            allocation = allocations.get(zone["id"], 0)
            demand = zone["current_load_mw"]
            
            # If allocation is less than demand and backup is available
            if allocation < demand and zone["backup_available"]:
                deficit = demand - allocation
                if deficit <= zone["backup_capacity_mw"]:
                    backup_plan["zones_on_backup"].append({
                        "zone_id": zone["id"],
                        "backup_load_mw": round(deficit, 2),
                        "duration_hours": zone["backup_duration_hours"]
                    })
                    backup_plan["total_backup_capacity_mw"] += deficit
        
        if backup_plan["zones_on_backup"]:
            avg_duration = sum(z["duration_hours"] for z in backup_plan["zones_on_backup"]) / len(backup_plan["zones_on_backup"])
            backup_plan["estimated_backup_duration_hours"] = round(avg_duration, 1)
        
        return backup_plan
    
    def process(self, state: BlackoutManagementState) -> Dict:
        """Main processing function for Power Allocation Agent"""
        print(f"[PAA] Generating power allocation plan for incident: {state['incident_id']}")
        
        # This will be populated from the actual zone data
        # For now, we'll create a placeholder structure
        grid_analysis = state.get("grid_analysis", {})
        weather_impact = state.get("weather_impact", {})
        
        # Use LLM for allocation strategy
        prompt = f"""
        As a power grid allocation strategist, recommend the allocation approach:
        
        Incident Severity: {state['severity']}
        Capacity Lost: {state['capacity_lost_mw']} MW
        Affected Zones: {len(state['affected_zones'])}
        Cascade Risk: {grid_analysis.get('cascade_risk', 0):.2%}
        Weather Impact: {weather_impact.get('impact_assessment', {}).get('weather_condition', 'unknown')}
        
        Should we prioritize:
        1. Maintain critical infrastructure at 100%
        2. Distribute power more evenly
        3. Focus on population centers
        
        Respond with the number (1, 2, or 3) and a one-sentence justification.
        """
        
        llm_strategy = blackout_llm.invoke(prompt)
        
        power_allocation_plan = {
            "plan_id": hashlib.md5(f"{state['incident_id']}_allocation".encode()).hexdigest()[:12],
            "strategy": llm_strategy.content,
            "timestamp": datetime.now().isoformat(),
            "cascade_risk_considered": grid_analysis.get('cascade_risk', 0),
            "weather_adjusted": weather_impact.get('impact_assessment', {}).get('combined_severity_factor', 1.0)
        }
        
        print(f"[PAA] Allocation plan generated: {power_allocation_plan['plan_id']}")
        
        return {"power_allocation_plan": power_allocation_plan}

# ===================== AGENT 5: EXECUTION & VALIDATION AGENT (EVA) =====================

class ExecutionValidationAgent:
    """Executes power allocation and validates effectiveness"""
    
    def __init__(self):
        self.action_delay_seconds = {
            "switch_backup": 5,
            "reroute_power": 10,
            "isolate_zone": 3,
            "restore_zone": 15
        }
    
    def execute_allocation(self, allocation_plan: Dict, zones: List[Dict]) -> List[Dict]:
        """Execute the power allocation plan"""
        executed_actions = []
        
        executed_actions.append({
            "action": "allocation_plan_deployed",
            "plan_id": allocation_plan.get("plan_id"),
            "timestamp": datetime.now().isoformat(),
            "status": "SUCCESS"
        })
        
        return executed_actions
    
    def validate_allocation(self, executed_actions: List[Dict], grid_telemetry: Dict) -> Dict:
        """Validate that allocation is working as intended"""
        
        stability_score = grid_telemetry.get("aggregate_metrics", {}).get("grid_stability_score", 0)
        
        validation = {
            "overall_status": "SUCCESS" if stability_score > 60 else "PARTIAL" if stability_score > 30 else "FAILED",
            "actions_executed": len(executed_actions),
            "actions_successful": len([a for a in executed_actions if a["status"] == "SUCCESS"]),
            "grid_stability_post_allocation": stability_score,
            "improvement_detected": stability_score > 50,
            "timestamp": datetime.now().isoformat()
        }
        
        return validation
    
    def process(self, state: BlackoutManagementState) -> Dict:
        """Main processing function for Execution & Validation Agent"""
        print(f"[EVA] Executing allocation plan for incident: {state['incident_id']}")
        
        allocation_plan = state.get("power_allocation_plan", {})
        grid_telemetry = state.get("grid_telemetry", {})
        
        # Execute actions
        executed_actions = self.execute_allocation(allocation_plan, [])
        
        # Validate execution
        validation = self.validate_allocation(executed_actions, grid_telemetry)
        
        # Use LLM for validation assessment
        prompt = f"""
        As a grid operations validator, assess this power allocation execution:
        
        Actions Executed: {validation['actions_executed']}
        Success Rate: {validation['actions_successful']}/{validation['actions_executed']}
        Grid Stability: {validation['grid_stability_post_allocation']}%
        Overall Status: {validation['overall_status']}
        
        Provide a brief (1-2 sentences) next steps recommendation.
        """
        
        llm_validation = blackout_llm.invoke(prompt)
        
        execution_status = {
            "executed_actions": executed_actions,
            "validation_results": validation,
            "llm_assessment": llm_validation.content,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"[EVA] Execution status: {validation['overall_status']}, "
              f"Stability: {validation['grid_stability_post_allocation']}%")
        
        return {
            "execution_status": execution_status,
            "validation_results": validation
        }

# ===================== BLACKOUT SOAR PIPELINE =====================

class BlackoutSOARPipeline:
    """Complete SOAR pipeline for blackout management"""
    
    def __init__(self):
        self.gta = GridTelemetryAgent()
        self.gaa = GridAnalysisAgent()
        self.wia = WeatherIntegrationAgent()
        self.paa = PowerAllocationAgent()
        self.eva = ExecutionValidationAgent()
        
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        
        workflow = StateGraph(BlackoutManagementState)
        
        # Add nodes
        workflow.add_node("telemetry", lambda state: self.gta.process(state))
        workflow.add_node("analysis", lambda state: self.gaa.process(state))
        workflow.add_node("weather", lambda state: self.wia.process(state))
        workflow.add_node("allocation", lambda state: self.paa.process(state))
        workflow.add_node("execution", lambda state: self.eva.process(state))
        
        # Define edges
        workflow.set_entry_point("telemetry")
        workflow.add_edge("telemetry", "analysis")
        workflow.add_edge("analysis", "weather")
        workflow.add_edge("weather", "allocation")
        workflow.add_edge("allocation", "execution")
        workflow.add_edge("execution", END)
        
        return workflow.compile()
    
    def process_blackout_incident(
        self,
        incident_id: str,
        cause: str,
        severity: str,
        affected_zones: List[str],
        capacity_lost_mw: float,
        weather_condition: Optional[str] = None
    ) -> Dict:
        """Process a blackout incident through the SOAR pipeline"""
        
        print(f"\n{'='*60}")
        print(f"BLACKOUT SOAR PIPELINE INITIATED")
        print(f"Incident ID: {incident_id}")
        print(f"Cause: {cause} | Severity: {severity}")
        print(f"{'='*60}\n")
        
        start_time = datetime.now()
        
        initial_state: BlackoutManagementState = {
            "incident_id": incident_id,
            "cause": cause,
            "severity": severity,
            "affected_zones": affected_zones,
            "capacity_lost_mw": capacity_lost_mw,
            "weather_condition": weather_condition,
            "grid_telemetry": {},
            "grid_analysis": {},
            "weather_impact": {},
            "power_allocation_plan": {},
            "execution_status": {},
            "validation_results": {},
            "time_to_response": None,
            "recovery_progress": 0.0
        }
        
        # Run through the pipeline
        result = self.graph.invoke(initial_state)
        
        end_time = datetime.now()
        response_time = (end_time - start_time).total_seconds()
        result["time_to_response"] = round(response_time, 2)
        
        print(f"\n{'='*60}")
        print(f"BLACKOUT SOAR PIPELINE COMPLETED")
        print(f"Response Time: {response_time:.2f}s")
        print(f"{'='*60}\n")
        
        return result

# Initialize global pipeline
blackout_soar_pipeline = BlackoutSOARPipeline()

