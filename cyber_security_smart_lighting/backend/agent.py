# backend/agent.py
import os
import json
from typing import TypedDict
from langchain_groq import ChatGroq # <--- CHANGE: Import ChatGroq
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

load_dotenv()

# Define the state for our graph (this remains the same)
class AgentState(TypedDict):
    scenario: str
    recommendation: dict

# --- CHANGE: Initialize the LLM using Groq and the Llama 3 model ---
# We are using Llama 3's 8B parameter model, which is fast and powerful.
API_KEY = "your_api_key"

# Initialize the ChatGroq client with the API key
agent_app = ChatGroq(
    api_key=API_KEY,
    temperature=0,
    model_name="llama-3.1-8b-instant"
) 

# -----------------------------------------------------------------

# The agent's node function remains exactly the same.
# The prompt is compatible with Llama 3.
def analyze_scenario(state: AgentState):
    """Analyzes the weather scenario and provides a recommendation."""
    scenario = state['scenario']
    print(f"---ANALYZING SCENARIO WITH GROQ/LLAMA3: {scenario}---")

    prompt = f"""
    You are an AI for the Mumbai Smart City Dashboard.
    Your task is to recommend changes to the city's smart light pole brightness based on a weather scenario.
    The brightness scale is 0 (off) to 100 (max brightness).
    
    Current weather scenario: "{scenario}"

    Based on this, recommend a brightness level for all poles.
    For a 'clear_sky' or normal scenario, the brightness should be 60.
    For 'heavy_rainfall' or 'dense_fog', visibility is low, so recommend a high brightness like 90.
    For a 'cyclone_alert', safety is paramount, recommend maximum brightness of 100.

    Provide your output as a simple JSON object with a single key "brightness".
    Example: {{"brightness": 90}}
    """
    
    response = llm.invoke(prompt)
    try:
        # Clean up the response which might be in a markdown block
        cleaned_response = response.content.strip().replace('```json', '').replace('```', '')
        recommendation = json.loads(cleaned_response)
        return {"recommendation": recommendation}
    except json.JSONDecodeError:
        print("Error: Failed to decode LLM response into JSON.")
        return {"recommendation": {"brightness": 60}} # Default fallback

# The graph definition and compilation remain exactly the same.
workflow = StateGraph(AgentState)
workflow.add_node("analyze", analyze_scenario)
workflow.set_entry_point("analyze")
workflow.add_edge("analyze", END)

# Compile the graph into a runnable app
agent_app = workflow.compile()