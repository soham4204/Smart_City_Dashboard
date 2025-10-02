# backend/tools/pipeline_tools.py
# This is a simplified representation of all your tool functions.

def collect_data(location: str, zone_id: str) -> dict:
    print(f"--- TOOL: Collecting data for {location}, {zone_id} ---")
    # In reality, this calls get_live_weather, get_cctv, etc.
    return {"raw_weather": {"temp": 35}, "raw_cctv": {"congestion": 0.8}}

def process_data(raw_data: dict) -> dict:
    print("--- TOOL: Processing raw data ---")
    return {"processed_data": raw_data} # Placeholder

def fuse_sensors(processed_data: dict) -> dict:
    print("--- TOOL: Fusing sensor data ---")
    return {"fused_data": {"situation": "High temperature, high congestion"}}

def detect_anomalies(fused_data: dict) -> dict:
    print("--- TOOL: Detecting anomalies ---")
    return {"anomalies": ["Extreme heat", "Severe traffic"]}

def make_decision(anomalies: dict, config: dict) -> dict:
    print(f"--- TOOL: Making decision with config: {config} ---")
    # Use config values passed from the UI
    if "Extreme heat" in anomalies.get("anomalies", []) and config.get("heat_threshold", 30) < 35:
        return {"decision": "Reduce pole brightness to 70% to save energy during heatwave."}
    return {"decision": "Maintain normal operations."}