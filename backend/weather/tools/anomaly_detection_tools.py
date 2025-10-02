# tools/anomaly_detection_tools.py - Complete anomaly detection implementation

import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AnomalyThresholds:
    """Centralized anomaly detection thresholds"""
    # Environmental thresholds
    CRITICAL_AQI = 150
    WARNING_AQI = 100
    CRITICAL_NOISE_DB = 85
    WARNING_NOISE_DB = 75
    
    # Traffic thresholds  
    CRITICAL_CONGESTION = 0.9
    WARNING_CONGESTION = 0.7
    HIGH_PEDESTRIAN_COUNT = 45
    HIGH_VEHICLE_COUNT = 90
    
    # Weather thresholds
    EXTREME_TEMP_LOW = 0
    EXTREME_TEMP_HIGH = 40
    HIGH_WIND_KPH = 30
    
    # Light thresholds
    LOW_LIGHT_LUX = 20
    CRITICAL_LOW_LIGHT = 5

def detect_environmental_anomalies(env_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """Detect environmental sensor anomalies"""
    anomalies = []
    
    aqi = env_data.get('air_quality_index', 0)
    noise = env_data.get('noise_level_db', 0)
    light = env_data.get('ambient_light_lux', 100)
    
    # Air Quality Issues
    if aqi >= AnomalyThresholds.CRITICAL_AQI:
        anomalies.append({
            "type": "ENVIRONMENTAL_CRITICAL",
            "description": f"Critical air quality detected: AQI {aqi} (≥{AnomalyThresholds.CRITICAL_AQI})",
            "severity": "CRITICAL"
        })
    elif aqi >= AnomalyThresholds.WARNING_AQI:
        anomalies.append({
            "type": "ENVIRONMENTAL_WARNING", 
            "description": f"Poor air quality: AQI {aqi} (≥{AnomalyThresholds.WARNING_AQI})",
            "severity": "MEDIUM"
        })
    
    # Noise Level Issues
    if noise >= AnomalyThresholds.CRITICAL_NOISE_DB:
        anomalies.append({
            "type": "NOISE_CRITICAL",
            "description": f"Excessive noise levels: {noise}dB (≥{AnomalyThresholds.CRITICAL_NOISE_DB}dB)",
            "severity": "HIGH"
        })
    elif noise >= AnomalyThresholds.WARNING_NOISE_DB:
        anomalies.append({
            "type": "NOISE_WARNING",
            "description": f"Elevated noise levels: {noise}dB (≥{AnomalyThresholds.WARNING_NOISE_DB}dB)",
            "severity": "MEDIUM"
        })
    
    # Lighting Issues
    if light <= AnomalyThresholds.CRITICAL_LOW_LIGHT:
        anomalies.append({
            "type": "LIGHTING_CRITICAL",
            "description": f"Extremely low ambient light: {light} lux (≤{AnomalyThresholds.CRITICAL_LOW_LIGHT})",
            "severity": "HIGH"
        })
    elif light <= AnomalyThresholds.LOW_LIGHT_LUX:
        anomalies.append({
            "type": "LIGHTING_WARNING", 
            "description": f"Low ambient light conditions: {light} lux (≤{AnomalyThresholds.LOW_LIGHT_LUX})",
            "severity": "LOW"
        })
    
    return anomalies

def detect_traffic_anomalies(traffic_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """Detect traffic-related anomalies"""
    anomalies = []
    
    congestion = traffic_data.get('congestion_level', 0)
    pedestrians = traffic_data.get('pedestrian_count', 0)
    vehicles = traffic_data.get('vehicle_count', 0)
    incident = traffic_data.get('incident_detected', False)
    
    # Incident Detection
    if incident:
        incident_details = traffic_data.get('incident_details', 'No details available')
        anomalies.append({
            "type": "TRAFFIC_INCIDENT",
            "description": f"Traffic incident detected: {incident_details}",
            "severity": "CRITICAL"
        })
    
    # Congestion Analysis
    if congestion >= AnomalyThresholds.CRITICAL_CONGESTION:
        anomalies.append({
            "type": "TRAFFIC_CONGESTION_CRITICAL",
            "description": f"Severe traffic congestion: {congestion:.1%} capacity (≥{AnomalyThresholds.CRITICAL_CONGESTION:.1%})",
            "severity": "HIGH"
        })
    elif congestion >= AnomalyThresholds.WARNING_CONGESTION:
        anomalies.append({
            "type": "TRAFFIC_CONGESTION_WARNING",
            "description": f"Heavy traffic conditions: {congestion:.1%} capacity (≥{AnomalyThresholds.WARNING_CONGESTION:.1%})", 
            "severity": "MEDIUM"
        })
    
    # Unusual Crowd Activity
    if pedestrians >= AnomalyThresholds.HIGH_PEDESTRIAN_COUNT:
        anomalies.append({
            "type": "PEDESTRIAN_SURGE",
            "description": f"High pedestrian activity detected: {pedestrians} people (≥{AnomalyThresholds.HIGH_PEDESTRIAN_COUNT})",
            "severity": "MEDIUM"
        })
    
    if vehicles >= AnomalyThresholds.HIGH_VEHICLE_COUNT:
        anomalies.append({
            "type": "VEHICLE_SURGE",
            "description": f"High vehicle density: {vehicles} vehicles (≥{AnomalyThresholds.HIGH_VEHICLE_COUNT})",
            "severity": "MEDIUM"
        })
    
    return anomalies

def detect_weather_anomalies(weather_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """Detect weather-related anomalies"""
    anomalies = []
    
    temp = weather_data.get('temperature_celsius', 20)
    wind = weather_data.get('wind_kph', 0)
    condition = weather_data.get('condition', '').lower()
    humidity = weather_data.get('humidity_percent', 50)
    
    # Temperature Extremes
    if temp <= AnomalyThresholds.EXTREME_TEMP_LOW:
        anomalies.append({
            "type": "WEATHER_EXTREME_COLD",
            "description": f"Extreme cold conditions: {temp}°C (≤{AnomalyThresholds.EXTREME_TEMP_LOW}°C)",
            "severity": "HIGH"
        })
    elif temp >= AnomalyThresholds.EXTREME_TEMP_HIGH:
        anomalies.append({
            "type": "WEATHER_EXTREME_HEAT",
            "description": f"Extreme heat conditions: {temp}°C (≥{AnomalyThresholds.EXTREME_TEMP_HIGH}°C)",
            "severity": "HIGH"
        })
    
    # High Wind Conditions
    if wind >= AnomalyThresholds.HIGH_WIND_KPH:
        anomalies.append({
            "type": "WEATHER_HIGH_WIND",
            "description": f"High wind conditions: {wind} km/h (≥{AnomalyThresholds.HIGH_WIND_KPH} km/h)",
            "severity": "MEDIUM"
        })
    
    # Severe Weather Conditions
    severe_conditions = ['storm', 'heavy rain', 'snow', 'blizzard', 'thunderstorm', 'hail', 'tornado', 'cyclone']
    if any(severe in condition for severe in severe_conditions):
        anomalies.append({
            "type": "WEATHER_SEVERE", 
            "description": f"Severe weather conditions detected: {condition}",
            "severity": "HIGH"
        })
    
    # Extreme Humidity
    if humidity >= 90:
        anomalies.append({
            "type": "WEATHER_HIGH_HUMIDITY",
            "description": f"Extremely high humidity: {humidity}% (≥90%)",
            "severity": "LOW"
        })
    elif humidity <= 10:
        anomalies.append({
            "type": "WEATHER_LOW_HUMIDITY", 
            "description": f"Extremely low humidity: {humidity}% (≤10%)",
            "severity": "LOW"
        })
    
    return anomalies

def detect_cross_modal_anomalies(fused_state: Dict[str, Any]) -> List[Dict[str, str]]:
    """Detect anomalies across multiple sensor modalities"""
    anomalies = []
    
    env_conditions = fused_state.get("environmental_context", {})
    traffic_conditions = fused_state.get("traffic_context", {})
    weather_conditions = fused_state.get("weather_context", {})
    
    # Cross-modal inconsistency detection
    weather_aqi = weather_conditions.get("air_quality_index", 50)
    iot_aqi = env_conditions.get("air_quality_index", 50)
    
    # Large AQI discrepancy between weather and IoT sensors
    if abs(weather_aqi - iot_aqi) > 50:
        anomalies.append({
            "type": "SENSOR_INCONSISTENCY",
            "description": f"Large AQI discrepancy: Weather API reports {weather_aqi}, IoT sensors report {iot_aqi}",
            "severity": "MEDIUM"
        })
    
    # Traffic-noise inconsistency
    congestion = traffic_conditions.get("congestion_level", 0)
    noise = env_conditions.get("noise_level_db", 50)
    
    # High congestion but low noise (sensor malfunction?)
    if congestion > 0.8 and noise < 45:
        anomalies.append({
            "type": "TRAFFIC_NOISE_INCONSISTENCY",
            "description": f"High traffic congestion ({congestion:.1%}) but low noise levels ({noise}dB) - possible sensor malfunction",
            "severity": "MEDIUM"
        })
    
    # Low congestion but very high noise (unusual event?)
    if congestion < 0.3 and noise > 80:
        anomalies.append({
            "type": "NOISE_SOURCE_ANOMALY",
            "description": f"Low traffic ({congestion:.1%}) but high noise ({noise}dB) - possible non-traffic noise source",
            "severity": "MEDIUM"
        })
    
    # Environmental-weather correlation issues
    temp = weather_conditions.get("temperature_celsius", 20)
    light = env_conditions.get("ambient_light_lux", 200)
    
    # Very low light during normal daylight hours with good weather
    current_hour = datetime.now().hour
    if 8 <= current_hour <= 18 and light < 50 and temp > 15 and "clear" in weather_conditions.get("condition", ""):
        anomalies.append({
            "type": "LIGHTING_WEATHER_INCONSISTENCY",
            "description": f"Unusually low light ({light} lux) during daylight hours with clear weather",
            "severity": "LOW"
        })
    
    return anomalies

def determine_system_status(anomalies: List[Dict[str, str]]) -> str:
    """Determine overall system status based on detected anomalies"""
    if not anomalies:
        return "NOMINAL"
    
    severity_levels = [anomaly.get('severity', 'LOW') for anomaly in anomalies]
    
    if 'CRITICAL' in severity_levels:
        return "CRITICAL"
    elif 'HIGH' in severity_levels:
        return "CRITICAL"  
    elif 'MEDIUM' in severity_levels:
        return "WARNING"
    else:
        return "WARNING"

def determine_alert_level(system_status: str, anomaly_count: int) -> str:
    """Determine alert level based on system status and anomaly count"""
    if system_status == "CRITICAL":
        return "RED"
    elif system_status == "WARNING":
        return "YELLOW" if anomaly_count >= 2 else "YELLOW"
    else:
        return "GREEN"

def determine_monitoring_priority(system_status: str, critical_anomalies: int) -> str:
    """Determine monitoring priority level"""
    if system_status == "CRITICAL" or critical_anomalies > 0:
        return "immediate"
    elif system_status == "WARNING":
        return "elevated"
    else:
        return "routine"

def generate_recommended_actions(anomalies: List[Dict[str, str]], system_status: str) -> List[str]:
    """Generate specific recommended actions based on detected anomalies"""
    actions = []
    
    # Group anomalies by type for targeted recommendations
    anomaly_types = [anomaly.get("type", "") for anomaly in anomalies]
    
    # Environmental actions
    if any("ENVIRONMENTAL" in atype or "NOISE" in atype for atype in anomaly_types):
        actions.append("Activate enhanced environmental monitoring protocols")
        if any("CRITICAL" in atype for atype in anomaly_types):
            actions.append("Consider issuing public health advisory for air quality")
    
    # Traffic actions
    if any("TRAFFIC" in atype or "CONGESTION" in atype for atype in anomaly_types):
        actions.append("Implement traffic flow optimization measures")
        if "TRAFFIC_INCIDENT" in anomaly_types:
            actions.append("Dispatch emergency response teams to incident location")
    
    # Weather actions
    if any("WEATHER" in atype for atype in anomaly_types):
        actions.append("Activate severe weather response protocols")
        if any("EXTREME" in atype for atype in anomaly_types):
            actions.append("Issue weather safety warnings to public")
    
    # Sensor inconsistency actions
    if any("INCONSISTENCY" in atype or "SENSOR" in atype for atype in anomaly_types):
        actions.append("Perform sensor calibration and maintenance checks")
        actions.append("Cross-validate readings with backup monitoring systems")
    
    # Crowd management actions
    if any("PEDESTRIAN" in atype or "VEHICLE" in atype for atype in anomaly_types):
        actions.append("Deploy additional crowd management resources")
        actions.append("Monitor for potential public safety concerns")
    
    # Default actions for critical status
    if system_status == "CRITICAL":
        if "Notify emergency management authorities" not in actions:
            actions.append("Notify emergency management authorities")
        if "Increase monitoring frequency to real-time" not in actions:
            actions.append("Increase monitoring frequency to real-time")
    
    # Default actions for warning status
    elif system_status == "WARNING":
        if "Continue enhanced monitoring" not in actions:
            actions.append("Continue enhanced monitoring")
        if "Prepare contingency response measures" not in actions:
            actions.append("Prepare contingency response measures")
    
    return actions if actions else ["Continue routine monitoring procedures"]

def generate_assessment_summary(system_status: str, anomalies: List[Dict[str, str]]) -> str:
    """Generate a comprehensive assessment summary"""
    if system_status == "NOMINAL":
        return "All monitoring systems operating within normal parameters. No anomalies detected."
    
    anomaly_count = len(anomalies)
    critical_count = sum(1 for a in anomalies if a.get('severity') in ['CRITICAL', 'HIGH'])
    medium_count = sum(1 for a in anomalies if a.get('severity') == 'MEDIUM')
    low_count = sum(1 for a in anomalies if a.get('severity') == 'LOW')
    
    if system_status == "CRITICAL":
        return f"Critical situation detected: {critical_count} high-priority anomalies among {anomaly_count} total issues require immediate attention and emergency response activation."
    else:
        severity_breakdown = f"{critical_count} high, {medium_count} medium, {low_count} low severity"
        return f"Warning status: {anomaly_count} anomalies detected ({severity_breakdown}) requiring enhanced monitoring and potential operational adjustments."

def perform_comprehensive_anomaly_detection(state: dict) -> Dict[str, Any]:
    """
    Main anomaly detection tool that performs comprehensive analysis of fused sensor data.
    This is the primary tool that should be called by the anomaly detection agent.
    """
    logger.info("Starting comprehensive anomaly detection analysis")
    
    try:
        # CORRECTED: Directly access the fused state from where it's stored
        fused_state = state.get("fused_environmental_state", {})
        
        # Handle JSON string case
        if isinstance(fused_state, str):
            try:
                fused_state = json.loads(fused_state)
            except json.JSONDecodeError:
                logger.warning("Failed to parse fused_environmental_state as JSON")
                fused_state = {}
        
        if not fused_state:
            logger.warning("Fused environmental state is empty. Checking alternative locations...")
            # Fallback: try reading from sensor_fusion_report if needed
            fusion_result = state.get("sensor_fusion_report", {})
            if isinstance(fusion_result, str):
                try:
                    fusion_result = json.loads(fusion_result)
                except json.JSONDecodeError:
                    fusion_result = {}
            
            # Try to extract from nested structure
            environmental_fusion_step = fusion_result.get("fusion_steps", {}).get("environmental_fusion", {})
            if environmental_fusion_step.get("status") == "success":
                fused_state = environmental_fusion_step
        
        # Initialize anomaly collection
        all_anomalies = []
        
        # Detect environmental anomalies
        env_context = fused_state.get("environmental_context", {})
        if env_context:
            env_anomalies = detect_environmental_anomalies(env_context)
            all_anomalies.extend(env_anomalies)
            logger.info(f"Detected {len(env_anomalies)} environmental anomalies")
        
        # Detect traffic anomalies
        traffic_context = fused_state.get("traffic_context", {})
        if traffic_context:
            traffic_anomalies = detect_traffic_anomalies(traffic_context)
            all_anomalies.extend(traffic_anomalies)
            logger.info(f"Detected {len(traffic_anomalies)} traffic anomalies")
        
        # Detect weather anomalies
        weather_context = fused_state.get("weather_context", {})
        if weather_context:
            weather_anomalies = detect_weather_anomalies(weather_context)
            all_anomalies.extend(weather_anomalies)
            logger.info(f"Detected {len(weather_anomalies)} weather anomalies")
        
        # Detect cross-modal anomalies
        if fused_state:
            cross_modal_anomalies = detect_cross_modal_anomalies(fused_state)
            all_anomalies.extend(cross_modal_anomalies)
            logger.info(f"Detected {len(cross_modal_anomalies)} cross-modal anomalies")

        # Determine system status and alert levels
        system_status = determine_system_status(all_anomalies)
        alert_level = determine_alert_level(system_status, len(all_anomalies))
        monitoring_priority = determine_monitoring_priority(system_status, 
            sum(1 for a in all_anomalies if a.get('severity') in ['CRITICAL', 'HIGH']))
        
        # Generate comprehensive assessment
        assessment_summary = generate_assessment_summary(system_status, all_anomalies)
        recommended_actions = generate_recommended_actions(all_anomalies, system_status)
        
        # Create complete anomaly assessment
        anomaly_assessment = {
            "assessment_timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "system_status": system_status,
            "anomalies_detected": all_anomalies,
            "summary": assessment_summary,
            "recommended_actions": recommended_actions,
            "alert_level": alert_level,
            "monitoring_priority": monitoring_priority,
            "detection_metadata": {
                "total_anomalies": len(all_anomalies),
                "severity_breakdown": {
                    "critical": sum(1 for a in all_anomalies if a.get('severity') == 'CRITICAL'),
                    "high": sum(1 for a in all_anomalies if a.get('severity') == 'HIGH'),
                    "medium": sum(1 for a in all_anomalies if a.get('severity') == 'MEDIUM'),
                    "low": sum(1 for a in all_anomalies if a.get('severity') == 'LOW')
                },
                "detection_categories": {
                    "environmental": len([a for a in all_anomalies if "ENVIRONMENTAL" in a.get("type", "") or "NOISE" in a.get("type", "")]),
                    "traffic": len([a for a in all_anomalies if "TRAFFIC" in a.get("type", "") or "PEDESTRIAN" in a.get("type", "") or "VEHICLE" in a.get("type", "")]),
                    "weather": len([a for a in all_anomalies if "WEATHER" in a.get("type", "")]),
                    "cross_modal": len([a for a in all_anomalies if "INCONSISTENCY" in a.get("type", "")])
                },
                "thresholds_applied": {
                    "aqi_critical": AnomalyThresholds.CRITICAL_AQI,
                    "noise_critical": AnomalyThresholds.CRITICAL_NOISE_DB,
                    "congestion_critical": AnomalyThresholds.CRITICAL_CONGESTION,
                    "temp_extreme_low": AnomalyThresholds.EXTREME_TEMP_LOW,
                    "temp_extreme_high": AnomalyThresholds.EXTREME_TEMP_HIGH
                }
            }
        }
        
        # Save anomaly assessment to state
        state["anomaly_assessment"] = anomaly_assessment
        
        logger.info(f"Anomaly detection completed: {system_status} status with {len(all_anomalies)} anomalies")
        
        return {
            "status": "success",
            "message": f"Anomaly detection completed: {system_status} status",
            "system_status": system_status,
            "anomalies_detected": len(all_anomalies),
            "alert_level": alert_level,
            "monitoring_priority": monitoring_priority,
            "critical_anomalies": anomaly_assessment["detection_metadata"]["severity_breakdown"]["critical"] + 
                                 anomaly_assessment["detection_metadata"]["severity_breakdown"]["high"]
        }
        
    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Anomaly detection failed: {str(e)}",
            "system_status": "ERROR",
            "anomalies_detected": 0,
            "alert_level": "GRAY",
            "monitoring_priority": "immediate",
            "critical_anomalies": 0
        }
        state["anomaly_detection_error"] = error_result
        logger.error(f"Anomaly detection failed: {e}")
        return error_result

# Helper function for calculating environmental health score (used in sensor fusion)
def calculate_environmental_health_score(fused_state: Dict[str, Any]) -> float:
    """Calculate composite environmental health score"""
    env = fused_state.get("environmental_context", {})
    weather = fused_state.get("weather_context", {})
    
    aqi = env.get("air_quality_index", 50)
    noise = env.get("noise_level_db", 50)
    temp = weather.get("temperature_celsius", 20)
    
    # Score components (0-1 scale, higher is better)
    aqi_score = max(0, 1 - (aqi / 150))  # 150+ AQI is very unhealthy
    noise_score = max(0, 1 - ((noise - 30) / 70))  # 30-100dB range
    temp_score = max(0, 1 - (abs(temp - 22) / 25))  # Optimal around 22°C
    
    return (aqi_score + noise_score + temp_score) / 3

def calculate_traffic_efficiency_score(fused_state: Dict[str, Any]) -> float:
    """Calculate traffic efficiency score"""
    traffic = fused_state.get("traffic_context", {})
    
    congestion = traffic.get("congestion_level", 0)
    incident = traffic.get("incident_detected", False)
    
    # Base efficiency from congestion (inverted)
    efficiency = 1 - congestion
    
    # Penalty for incidents
    if incident:
        efficiency *= 0.5
    
    return max(0, efficiency)

def calculate_overall_zone_status(fused_state: Dict[str, Any]) -> float:
    """Calculate overall zone operational status"""
    env_health = calculate_environmental_health_score(fused_state)
    traffic_efficiency = calculate_traffic_efficiency_score(fused_state)
    
    # Weighted average (environmental health weighted more heavily)
    return (env_health * 0.6) + (traffic_efficiency * 0.4)