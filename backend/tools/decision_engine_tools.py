# backend/tools/decision_engine_tools.py
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from . import state_keys

# --- RAG Imports ---
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Configure logging for decision engine operations
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DecisionThresholds:
    """Centralized decision-making thresholds"""
    # Risk score thresholds
    CRITICAL_RISK_THRESHOLD = 80
    HIGH_RISK_THRESHOLD = 60
    MODERATE_RISK_THRESHOLD = 40
    
    # Confidence thresholds
    HIGH_CONFIDENCE_THRESHOLD = 85
    MODERATE_CONFIDENCE_THRESHOLD = 70
    
    # Response time thresholds (minutes)
    IMMEDIATE_RESPONSE_TIME = 5
    URGENT_RESPONSE_TIME = 15
    STANDARD_RESPONSE_TIME = 30


# --- Retriever Initialization ---
try:
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vectorstore = PineconeVectorStore.from_existing_index(
        index_name="smart-city-incidents",
        embedding=embeddings
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 2})
    RAG_ENABLED = True
    print("Pinecone retriever initialized successfully for Decision Engine.")
except Exception as e:
    print(f"WARNING: Pinecone retriever initialization failed: {e}. RAG will be disabled.")
    retriever = None
    RAG_ENABLED = False


def calculate_comprehensive_risk_score(anomaly_assessment: Dict[str, Any]) -> float:
    """Calculate comprehensive risk score based on anomaly assessment"""
    if not anomaly_assessment:
        return 0.0
    
    system_status = anomaly_assessment.get("system_status", "NOMINAL")
    anomalies = anomaly_assessment.get("anomalies_detected", [])
    detection_metadata = anomaly_assessment.get("detection_metadata", {})
    
    # Base risk score from system status
    status_risk_mapping = {
        "CRITICAL": 90,
        "WARNING": 60,
        "NOMINAL": 10,
        "ERROR": 100
    }
    base_risk = status_risk_mapping.get(system_status, 50)
    
    # Severity-weighted risk calculation
    severity_breakdown = detection_metadata.get("severity_breakdown", {})
    critical_count = severity_breakdown.get("critical", 0)
    high_count = severity_breakdown.get("high", 0)
    medium_count = severity_breakdown.get("medium", 0)
    low_count = severity_breakdown.get("low", 0)
    
    # Risk multipliers based on anomaly severity
    severity_risk = (critical_count * 25) + (high_count * 15) + (medium_count * 8) + (low_count * 3)
    
    # Category-specific risk factors
    detection_categories = detection_metadata.get("detection_categories", {})
    category_risk = 0
    
    # Environmental risks (higher weight due to public health impact)
    category_risk += detection_categories.get("environmental", 0) * 10
    
    # Traffic risks (medium weight)
    category_risk += detection_categories.get("traffic", 0) * 8
    
    # Weather risks (variable based on severity)
    category_risk += detection_categories.get("weather", 0) * 6
    
    # Cross-modal inconsistencies (lower weight but indicates system issues)
    category_risk += detection_categories.get("cross_modal", 0) * 5
    
    # Combine all risk factors
    total_risk = min(100, base_risk + severity_risk + category_risk)
    
    return round(total_risk, 1)


def determine_alert_level_from_risk(risk_score: float) -> str:
    """Determine alert level based on comprehensive risk score"""
    if risk_score >= DecisionThresholds.CRITICAL_RISK_THRESHOLD:
        return "CRITICAL"
    elif risk_score >= DecisionThresholds.HIGH_RISK_THRESHOLD:
        return "HIGH"
    elif risk_score >= DecisionThresholds.MODERATE_RISK_THRESHOLD:
        return "MODERATE"
    else:
        return "LOW"


def determine_response_timeline(alert_level: str, anomaly_count: int) -> int:
    """Determine response timeline in minutes based on alert level"""
    if alert_level == "CRITICAL":
        return DecisionThresholds.IMMEDIATE_RESPONSE_TIME
    elif alert_level == "HIGH" or anomaly_count >= 3:
        return DecisionThresholds.URGENT_RESPONSE_TIME
    else:
        return DecisionThresholds.STANDARD_RESPONSE_TIME


def generate_operational_recommendations(anomaly_assessment: Dict[str, Any], historical_context: str) -> List[str]:
    """Generate specific operational recommendations based on anomaly assessment and historical context"""
    recommendations = []
    
    system_status = anomaly_assessment.get("system_status", "NOMINAL")
    anomalies = anomaly_assessment.get("anomalies_detected", [])
    detection_categories = anomaly_assessment.get("detection_metadata", {}).get("detection_categories", {})
    
    # Environmental recommendations
    if detection_categories.get("environmental", 0) > 0:
        env_anomalies = [a for a in anomalies if any(keyword in a.get("type", "") 
                        for keyword in ["ENVIRONMENTAL", "NOISE", "LIGHTING"])]
        
        for anomaly in env_anomalies:
            if anomaly.get("severity") in ["CRITICAL", "HIGH"]:
                recommendations.append("Deploy environmental monitoring teams to affected areas")
                recommendations.append("Consider issuing public health advisories")
                break
        
        if any("AIR_QUALITY" in a.get("type", "") for a in env_anomalies):
            recommendations.append("Activate air quality emergency protocols")
        
        if any("NOISE" in a.get("type", "") for a in env_anomalies):
            recommendations.append("Investigate noise sources and implement mitigation measures")
    
    # Traffic recommendations
    if detection_categories.get("traffic", 0) > 0:
        traffic_anomalies = [a for a in anomalies if any(keyword in a.get("type", "") 
                           for keyword in ["TRAFFIC", "CONGESTION", "PEDESTRIAN", "VEHICLE"])]
        
        has_incident = any("INCIDENT" in a.get("type", "") for a in traffic_anomalies)
        has_congestion = any("CONGESTION" in a.get("type", "") for a in traffic_anomalies)
        
        if has_incident:
            recommendations.append("Dispatch emergency response teams immediately")
            recommendations.append("Implement traffic diversion protocols")
            recommendations.append("Coordinate with emergency services")
        
        if has_congestion:
            recommendations.append("Activate dynamic traffic signal optimization")
            recommendations.append("Deploy traffic management personnel to key intersections")
        
        if any(a.get("severity") == "CRITICAL" for a in traffic_anomalies):
            recommendations.append("Consider road closures if public safety is at risk")
    
    # Weather recommendations
    if detection_categories.get("weather", 0) > 0:
        weather_anomalies = [a for a in anomalies if "WEATHER" in a.get("type", "")]
        
        has_severe_weather = any("SEVERE" in a.get("type", "") or "EXTREME" in a.get("type", "") 
                                for a in weather_anomalies)
        
        if has_severe_weather:
            recommendations.append("Activate severe weather emergency protocols")
            recommendations.append("Issue weather-related safety warnings to public")
            recommendations.append("Prepare emergency shelters if necessary")
        else:
            recommendations.append("Monitor weather conditions for potential escalation")
    
    # Cross-modal inconsistency recommendations
    if detection_categories.get("cross_modal", 0) > 0:
        recommendations.append("Perform immediate sensor calibration and validation checks")
        recommendations.append("Cross-reference readings with backup monitoring systems")
        recommendations.append("Schedule maintenance for potentially faulty sensors")
    
    # System-level recommendations based on overall status
    if system_status == "CRITICAL":
        recommendations.extend([
            "Activate emergency operations center",
            "Establish incident command structure",
            "Implement real-time monitoring protocols",
            "Prepare public communication channels"
        ])
    elif system_status == "WARNING":
        recommendations.extend([
            "Escalate monitoring frequency",
            "Place response teams on standby",
            "Prepare contingency response plans"
        ])
    
    # Add historical context-informed recommendations
    if "historical" in historical_context.lower() and "successful" in historical_context.lower():
        recommendations.append("Apply proven strategies from similar historical incidents")
    
    return list(set(recommendations))  # Remove duplicates


def generate_resource_allocation_plan(alert_level: str, anomaly_assessment: Dict[str, Any]) -> Dict[str, Any]:
    """Generate detailed resource allocation plan"""
    detection_categories = anomaly_assessment.get("detection_metadata", {}).get("detection_categories", {})
    total_anomalies = anomaly_assessment.get("detection_metadata", {}).get("total_anomalies", 0)
    
    resource_plan = {
        "priority_level": alert_level,
        "total_incidents": total_anomalies,
        "resource_requirements": {}
    }
    
    # Environmental response resources
    if detection_categories.get("environmental", 0) > 0:
        resource_plan["resource_requirements"]["environmental_team"] = {
            "count": 1 if alert_level in ["LOW", "MODERATE"] else 2,
            "specialization": "Air quality and noise monitoring specialists",
            "equipment": ["Portable AQI monitors", "Sound level meters", "Protective equipment"]
        }
    
    # Traffic management resources
    if detection_categories.get("traffic", 0) > 0:
        traffic_units = 2 if alert_level == "CRITICAL" else 1
        resource_plan["resource_requirements"]["traffic_management"] = {
            "patrol_units": traffic_units,
            "traffic_controllers": traffic_units,
            "equipment": ["Traffic cones", "Portable signals", "Communication devices"]
        }
        
        # Additional emergency services for incidents
        has_incidents = any("INCIDENT" in a.get("type", "") 
                          for a in anomaly_assessment.get("anomalies_detected", []))
        if has_incidents:
            resource_plan["resource_requirements"]["emergency_services"] = {
                "ambulances": 1,
                "fire_trucks": 1 if alert_level == "CRITICAL" else 0,
                "police_units": 2
            }
    
    # Weather response resources
    if detection_categories.get("weather", 0) > 0:
        resource_plan["resource_requirements"]["weather_response"] = {
            "meteorology_team": 1,
            "public_safety_officers": 2 if alert_level == "CRITICAL" else 1,
            "equipment": ["Weather monitoring stations", "Emergency supplies"]
        }
    
    # Technical support for sensor issues
    if detection_categories.get("cross_modal", 0) > 0:
        resource_plan["resource_requirements"]["technical_support"] = {
            "sensor_technicians": 2,
            "it_support": 1,
            "equipment": ["Calibration tools", "Replacement sensors", "Diagnostic equipment"]
        }
    
    # Communication and coordination resources
    if alert_level in ["HIGH", "CRITICAL"]:
        resource_plan["resource_requirements"]["coordination"] = {
            "incident_commander": 1,
            "communications_officer": 1,
            "public_relations_officer": 1 if alert_level == "CRITICAL" else 0
        }
    
    return resource_plan


def _build_decision_analysis_report(
    anomaly_assessment: Dict[str, Any],
    risk_score: float,
    alert_level: str,
    response_timeline: int,
    recommendations: List[str],
    resource_plan: Dict[str, Any],
    historical_context: str
) -> Dict[str, Any]:
    """Assembles the final decision analysis dictionary."""
    anomaly_count = anomaly_assessment.get("detection_metadata", {}).get("total_anomalies", 0)
    cross_modal_issues = anomaly_assessment.get("detection_metadata", {}).get("detection_categories", {}).get("cross_modal", 0)
    
    base_confidence = 85.0
    confidence_adjustment = min(10, anomaly_count * 2) - (cross_modal_issues * 5)
    decision_confidence = max(50, min(100, base_confidence + confidence_adjustment))
    
    data_quality_score = 95.0 - (cross_modal_issues * 10)
    data_quality_grade = "A" if data_quality_score >= 90 else "B"
    
    return {
        "analysis_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "data_quality_assessment": {
            "score": round(data_quality_score, 1),
            "grade": data_quality_grade,
            "sensor_consistency": "Good" if cross_modal_issues == 0 else "Issues Detected"
        },
        "comprehensive_risk_score": risk_score,
        "risk_level": alert_level,
        "operational_recommendations": recommendations,
        "resource_allocation_plan": resource_plan,
        "decision_confidence": round(decision_confidence, 1),
        "execution_timeline_minutes": response_timeline,
        "historical_context_used": historical_context
    }


def perform_comprehensive_decision_analysis(state: dict) -> Dict[str, Any]:
    """
    Performs decision analysis by assessing risk and consulting historical data via RAG.
    """
    logger.info("Starting comprehensive decision analysis")
    try:
        anomaly_assessment = state.get(state_keys.ANOMALY_ASSESSMENT, {})
        if not anomaly_assessment:
            raise ValueError("Anomaly assessment data not found in state.")

        if isinstance(anomaly_assessment, str):
            anomaly_assessment = json.loads(anomaly_assessment)

        current_summary = anomaly_assessment.get("summary", "No summary available")
        
        # --- RAG IMPLEMENTATION ---
        historical_context = "No similar historical incidents found."
        if RAG_ENABLED and retriever:
            try:
                retrieved_docs = retriever.invoke(current_summary)
                if retrieved_docs:
                    context_str = "Found similar historical incidents:\n"
                    for doc in retrieved_docs:
                        meta = doc.metadata
                        context_str += (
                            f"- Summary: '{meta.get('summary', 'N/A')}' -> "
                            f"Action: '{meta.get('action_taken', 'N/A')}' -> "
                            f"Outcome: '{meta.get('outcome', 'N/A')}'\n"
                        )
                    historical_context = context_str
                    logger.info("Successfully retrieved historical context via LangChain retriever.")
            except Exception as e:
                logger.error(f"Error querying with LangChain retriever: {e}")
                historical_context = "Could not retrieve historical data due to an error."
        
        # Risk / alert logic
        risk_score = calculate_comprehensive_risk_score(anomaly_assessment)
        alert_level = determine_alert_level_from_risk(risk_score)
        response_timeline = determine_response_timeline(
            alert_level,
            anomaly_assessment.get("detection_metadata", {}).get("total_anomalies", 0)
        )
        recommendations = generate_operational_recommendations(anomaly_assessment, historical_context)
        resource_plan = generate_resource_allocation_plan(alert_level, anomaly_assessment)

        # Build the final report
        decision_analysis_result = _build_decision_analysis_report(
            anomaly_assessment,
            risk_score,
            alert_level,
            response_timeline,
            recommendations,
            resource_plan,
            historical_context
        )

        state[state_keys.DECISION_ANALYSIS] = decision_analysis_result

        # Persist back to vector DB using LangChain VectorStore
        try:
            if RAG_ENABLED and vectorstore:
                report_id = str(uuid.uuid4())
                new_metadata = {
                    "summary": current_summary,
                    "action_taken": "; ".join(recommendations[:3]),
                    "outcome": "Pending",
                    "risk_score": risk_score,
                    "alert_level": alert_level,
                    "decision_timestamp": decision_analysis_result["analysis_timestamp_utc"],
                }
                vectorstore.add_texts([current_summary], metadatas=[new_metadata], ids=[report_id])
                logger.info(f"Successfully saved decision to vector DB with ID: {report_id}")
        except Exception as e:
            logger.error(f"Failed to save decision to vector DB: {e}")

        logger.info(f"Decision analysis completed: {alert_level} risk level")
        return {"status": "success", "message": f"Decision analysis completed: {alert_level} risk level"}

    except Exception as e:
        logger.error(f"Decision analysis failed: {e}", exc_info=True)
        state["decision_analysis_error"] = {"error": str(e)}
        return {"status": "error", "message": f"Decision analysis failed: {str(e)}"}


def _build_recommendations_report(
    prioritized_actions: List[Dict],
    system_optimizations: List[str],
    resource_plan: Dict,
    follow_up_schedule: str,
    historical_insights: str,
    metadata: Dict
) -> Dict[str, Any]:
    """Assembles the final recommendations dictionary."""
    utilization_level = "Critical" if metadata.get("alert_level") == "CRITICAL" else "High"
    return {
        "recommendation_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "prioritized_action_items": prioritized_actions,
        "system_optimization_recommendations": system_optimizations,
        "resource_utilization_plan": {
            "priority_level": utilization_level,
            "coordination_required": metadata.get("alert_level") in ["HIGH", "CRITICAL"],
            "resource_details": resource_plan,
        },
        "follow_up_schedule": follow_up_schedule,
        "historical_insights": historical_insights,
        "recommendation_metadata": metadata
    }


def generate_decision_recommendations(state: dict) -> Dict[str, Any]:
    """Generates actionable recommendations based on decision analysis."""
    logger.info("Generating decision recommendations")
    try:
        decision_analysis = state.get(state_keys.DECISION_ANALYSIS, {})
        anomaly_assessment = state.get(state_keys.ANOMALY_ASSESSMENT, {})
        
        if not decision_analysis or not anomaly_assessment:
            raise ValueError("Decision analysis or anomaly assessment data not found")
        
        alert_level = decision_analysis.get("risk_level", "UNKNOWN")
        risk_score = decision_analysis.get("comprehensive_risk_score", 0)
        current_summary = anomaly_assessment.get("summary", "No summary available")

        # --- RAG for historical actions ---
        historical_actions_context = "No relevant historical actions found."
        if RAG_ENABLED and retriever:
            try:
                retrieved_docs = retriever.invoke(current_summary)
                if retrieved_docs:
                    successful_actions = []
                    for doc in retrieved_docs:
                        meta = doc.metadata
                        outcome = meta.get('outcome', '').lower()
                        if any(k in outcome for k in ['resolved', 'mitigated', 'successful']):
                            action = meta.get('action_taken', 'N/A')
                            if action != 'N/A':
                                successful_actions.append(action)
                    
                    if successful_actions:
                        historical_actions_context = "Based on historically effective actions: " + "; ".join(list(set(successful_actions))[:3])
                logger.info("Successfully retrieved historical action context")
            except Exception as e:
                logger.error(f"Error querying for recommendations: {e}")
                historical_actions_context = "Could not retrieve historical data due to an error."
        
        prioritized_actions = decision_analysis.get("operational_recommendations", [])
        system_optimizations = ["Increase sensor polling frequency in affected zones for enhanced monitoring"]
        
        if anomaly_assessment.get("detection_metadata", {}).get("detection_categories", {}).get("cross_modal", 0) > 0:
            system_optimizations.append("Schedule immediate sensor recalibration")
        
        resource_plan = decision_analysis.get("resource_allocation_plan", {})
        timeline_minutes = decision_analysis.get("execution_timeline_minutes", 30)
        follow_up_schedule = f"Review incident status in {timeline_minutes} minutes."
        
        metadata = {
            "based_on_risk_score": risk_score,
            "alert_level": alert_level,
            "total_actions": len(prioritized_actions),
            "confidence_level": decision_analysis.get("decision_confidence", 0)
        }
        
        recommendations_result = _build_recommendations_report(
            prioritized_actions,
            system_optimizations,
            resource_plan,
            follow_up_schedule,
            historical_actions_context,
            metadata
        )

        state[state_keys.DECISION_RECOMMENDATIONS] = recommendations_result
        
        logger.info(f"Decision recommendations generated: {len(prioritized_actions)} actions")
        return {"status": "success", "message": f"Generated {len(prioritized_actions)} recommendations"}
        
    except Exception as e:
        logger.error(f"Recommendation generation failed: {e}", exc_info=True)
        return {"status": "error", "message": f"Recommendation generation failed: {str(e)}"}


# Additional utility functions for decision support

def validate_decision_prerequisites(state: dict) -> Dict[str, Any]:
    """Validate that all prerequisites for decision making are met"""
    validation_results = {
        "anomaly_assessment_available": bool(state.get(state_keys.ANOMALY_ASSESSMENT)),
        "fusion_results_available": bool(state.get(state_keys.FUSION_RESULT)),
        "vector_db_accessible": RAG_ENABLED
    }
    
    validation_results["all_prerequisites_met"] = all(validation_results.values())
    return validation_results


def get_decision_summary(state: dict) -> Optional[Dict[str, Any]]:
    """Get a summary of the complete decision analysis process"""
    try:
        anomaly_assessment = state.get(state_keys.ANOMALY_ASSESSMENT, {})
        decision_analysis = state.get(state_keys.DECISION_ANALYSIS, {})
        recommendations = state.get(state_keys.DECISION_RECOMMENDATIONS, {})
        
        if not all([anomaly_assessment, decision_analysis, recommendations]):
            return None
        
        return {
            "process_complete": True,
            "risk_level": decision_analysis.get("risk_level", "UNKNOWN"),
            "confidence": decision_analysis.get("decision_confidence", 0),
            "total_recommendations": len(recommendations.get("prioritized_action_items", [])),
            "response_timeline": decision_analysis.get("execution_timeline_minutes", 0),
            "anomalies_detected": anomaly_assessment.get("detection_metadata", {}).get("total_anomalies", 0)
        }
        
    except Exception as e:
        logger.error(f"Failed to generate decision summary: {e}")
        return None