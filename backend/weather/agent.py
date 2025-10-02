# backend/agent.py
import os
import json
from typing import TypedDict, Dict, Any
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END

# Import your real tool functions
from tools import collector_tools, preprocessor_tools, sensor_fusion_tools, anomaly_detection_tools, decision_engine_tools, state_keys

load_dotenv()

# --- 1. Define the Comprehensive State ---
class AgentState(TypedDict):
    # Inputs
    scenario: str
    location: str
    zone_id: str
    config: dict

    # Tool outputs that need to be passed between steps
    weather_data: dict
    cctv_data: dict
    iot_data: dict

    # Preprocessing outputs
    pipeline_report: dict
    normalized_data: dict
    filtered_data: dict
    validation_report: dict
    quality_report: dict

    # Sensor Fusion outputs
    sensor_fusion_report: dict
    fused_environmental_state: dict
    situational_awareness: dict

    # Anomaly Detection output
    anomaly_assessment: dict

    # Decision Engine output
    decision_analysis: dict

    # Final actions
    control_action: dict
    final_verdict: str


# --- 2. Initialize Models ---
llm = ChatGroq(model_name="llama-3.1-8b-instant", temperature=0)
judge_llm = ChatGroq(model_name="llama-3.1-8b-instant", temperature=0.1)


# --- 3. Define the Nodes for the Enhanced Pipeline ---

def data_collection_node(state: AgentState) -> Dict[str, Any]:
    print("---NODE: Data Collection---")
    collector_tools.get_live_weather(state['location'], state)
    collector_tools.get_enhanced_synthetic_cctv_data(state['zone_id'], state)
    collector_tools.get_enhanced_synthetic_iot_sensor_data(state['zone_id'], state)

    return {
        "weather_data": state.get("weather_data", {}),
        "cctv_data": state.get("cctv_data", {}),
        "iot_data": state.get("iot_data", {})
    }

def data_processing_node(state: AgentState) -> Dict[str, Any]:
    print("---NODE: Data Preprocessing---")
    report = preprocessor_tools.process_complete_data_pipeline(state)
    # Return all keys that the tool adds to the state
    return {
        "pipeline_report": report,
        "normalized_data": state.get("normalized_data", {}),
        "filtered_data": state.get("filtered_data", {}),
        "validation_report": state.get("validation_report", {}),
        "quality_report": state.get("quality_report", {})
    }

def sensor_fusion_node(state: AgentState) -> Dict[str, Any]:
    print("---NODE: Sensor Fusion---")
    report = sensor_fusion_tools.process_complete_sensor_fusion(state)
    # Return all keys that the tool adds to the state
    return {
        "sensor_fusion_report": report,
        "fused_environmental_state": state.get("fused_environmental_state", {}),
        "situational_awareness": state.get("situational_awareness", {})
    }

def anomaly_detection_node(state: AgentState) -> Dict[str, Any]:
    print("---NODE: Anomaly Detection---")
    anomaly_detection_tools.perform_comprehensive_anomaly_detection(state)
    return {"anomaly_assessment": state.get("anomaly_assessment", {})}

def decision_engine_node(state: AgentState) -> Dict[str, Any]:
    print("---NODE: Making Decision with RAG---")
    decision_engine_tools.perform_comprehensive_decision_analysis(state)
    return {"decision_analysis": state.get("decision_analysis", {})}

def control_executor_node(state: AgentState) -> Dict[str, Any]:
    print("---NODE: Control Executor---")
    decision_analysis = state.get("decision_analysis", {})
    recommendations = decision_analysis.get("operational_recommendations", [])

    brightness = 85 # Default
    for rec in recommendations:
        if "brightness" in rec.lower():
            try:
                percent_index = rec.find('%')
                if percent_index != -1:
                    num_str = rec[:percent_index].split()[-1]
                    brightness = int(num_str)
                    break
            except (ValueError, IndexError):
                continue

    return {"control_action": {"brightness": brightness}}

def system_monitor_node(state: AgentState) -> Dict[str, str]:
    print("---NODE: System Monitor (LLM Judge)---")
    summary = state.get("anomaly_assessment", {}).get("summary", "No summary.")
    decision_analysis = state.get("decision_analysis", {})

    # Defensive check to prevent IndexError
    recommendations = decision_analysis.get("operational_recommendations", [])
    if recommendations:
        decision = recommendations[0]
    else:
        decision = "No specific action recommended; maintaining normal operations."

    prompt = f"""
    You are an expert safety evaluator.
    Current Situation: "{summary}"
    Agent's Recommended Action: "{decision}"
    Is this a reasonable, safe, and effective action?
    Respond with only 'APPROVE' or 'REJECT', followed by a brief justification.
    """
    verdict = judge_llm.invoke(prompt).content
    print(f"---JUDGE'S VERDICT: {verdict}")
    return {"final_verdict": verdict}

# --- 4. Assemble and Compile the Graph ---
workflow = StateGraph(AgentState)

workflow.add_node("data_collection", data_collection_node)
workflow.add_node("data_processing", data_processing_node)
workflow.add_node("sensor_fusion", sensor_fusion_node)
workflow.add_node("anomaly_detection", anomaly_detection_node)
workflow.add_node("decision_engine", decision_engine_node)
workflow.add_node("control_executor", control_executor_node)
workflow.add_node("system_monitor", system_monitor_node)

workflow.set_entry_point("data_collection")
workflow.add_edge("data_collection", "data_processing")
workflow.add_edge("data_processing", "sensor_fusion")
workflow.add_edge("sensor_fusion", "anomaly_detection")
workflow.add_edge("anomaly_detection", "decision_engine")
workflow.add_edge("decision_engine", "control_executor")
workflow.add_edge("control_executor", "system_monitor")
workflow.add_edge("system_monitor", END)

agent_app = workflow.compile()