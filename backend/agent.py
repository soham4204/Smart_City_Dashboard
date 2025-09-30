# backend/agent.py
import os
import json
from typing import TypedDict, Annotated, List
from langchain_core.messages import BaseMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

from tools.weather_tools import collect_data, process_data, fuse_sensors, detect_anomalies, make_decision

# --- ADD THIS DEBUGGING BLOCK ---
load_dotenv()
api_key_from_env = os.environ.get("GROQ_API_KEY")
print("--------------------------------------------------")
print(f"DEBUG: Attempting to load GROQ_API_KEY...")
if api_key_from_env:
    print(f"SUCCESS: Found GROQ_API_KEY starting with '{api_key_from_env[:4]}'.")
else:
    print("ERROR: GROQ_API_KEY was NOT FOUND in the environment.")
print("--------------------------------------------------")
# --- END DEBUGGING BLOCK ---
# --- 1. Define the State for the Graph ---
# This dictionary will be passed between all our nodes.
class AgentState(TypedDict):
    scenario: str
    location: str
    zone_id: str
    config: dict  # Configuration from the UI
    raw_data: dict
    processed_data: dict
    fused_data: dict
    anomalies: dict
    decision: dict
    control_action: str
    final_verdict: str

# --- 2. Initialize LLMs ---
# Main agent LLM
llm = ChatGroq(model_name="llama-3.1-8b-instant", temperature=0)
# Independent LLM to act as the "Judge"
judge_llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.1)


# --- 3. Define the Nodes (Workflow Steps) ---

def data_collection_node(state: AgentState):
    print("---NODE: Collecting Data---")
    raw_data = collect_data(state['location'], state['zone_id'])
    return {"raw_data": raw_data}

def data_processing_node(state: AgentState):
    print("---NODE: Processing Data---")
    processed_data = process_data(state['raw_data'])
    return {"processed_data": processed_data}

def sensor_fusion_node(state: AgentState):
    print("---NODE: Fusing Sensor Data---")
    fused_data = fuse_sensors(state['processed_data'])
    return {"fused_data": fused_data}

def anomaly_detection_node(state: AgentState):
    print("---NODE: Detecting Anomalies---")
    anomalies = detect_anomalies(state['fused_data'])
    return {"anomalies": anomalies}

def decision_engine_node(state: AgentState):
    print("---NODE: Making Decision---")
    decision = make_decision(state['anomalies'], state['config'])
    return {"decision": decision}

def control_executor_node(state: AgentState):
    print("---NODE: Executing Control Action---")
    decision_text = state['decision'].get('decision', '').lower()
    # Simple logic to parse the decision into an action
    if "reduce" in decision_text and "70%" in decision_text:
        action = {"brightness": 70}
    else:
        action = {"brightness": 85} # Default action
    return {"control_action": action}

def system_monitor_node(state: AgentState):
    """This node acts as our LLM Judge to evaluate the decision."""
    print("---NODE: System Monitor (LLM Judge)---")
    
    situation = state['fused_data'].get('situation')
    decision = state['decision'].get('decision')
    
    prompt = f"""
    You are an expert safety and efficiency evaluator for a smart city project.
    Your task is to judge a decision made by an AI agent.

    SITUATION:
    "{situation}"

    AGENT'S DECISION:
    "{decision}"

    Based on the situation, is this a reasonable, safe, and effective decision?
    Respond with only one word: 'APPROVE' or 'REJECT', followed by a brief justification.
    Example: APPROVE: The decision correctly addresses the high temperature by reducing energy load.
    Example: REJECT: The decision ignores the severe traffic anomaly, which is a higher priority.
    """
    
    verdict = judge_llm.invoke(prompt).content
    print(f"---JUDGE'S VERDICT: {verdict}---")
    return {"final_verdict": verdict}


# --- 4. Assemble the Graph ---

workflow = StateGraph(AgentState)

# Add the nodes
workflow.add_node("data_collection", data_collection_node)
workflow.add_node("data_processing", data_processing_node)
workflow.add_node("sensor_fusion", sensor_fusion_node)
workflow.add_node("anomaly_detection", anomaly_detection_node)
workflow.add_node("decision_engine", decision_engine_node)
workflow.add_node("control_executor", control_executor_node)
workflow.add_node("system_monitor", system_monitor_node)

# Add the edges to define the flow
workflow.set_entry_point("data_collection")
workflow.add_edge("data_collection", "data_processing")
workflow.add_edge("data_processing", "sensor_fusion")
workflow.add_edge("sensor_fusion", "anomaly_detection")
workflow.add_edge("anomaly_detection", "decision_engine")
workflow.add_edge("decision_engine", "control_executor")
workflow.add_edge("control_executor", "system_monitor")
workflow.add_edge("system_monitor", END)

# Compile the graph
agent_app = workflow.compile()