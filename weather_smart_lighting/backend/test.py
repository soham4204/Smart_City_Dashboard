import json
from agent import agent_app, AgentState

def run_test():
    """
    Runs a standalone test of the full agent pipeline for a given scenario.
    This helps verify the end-to-end workflow without needing the FastAPI server.
    """
    print("--- 🚀 STARTING AGENT PIPELINE TEST 🚀 ---\n")

    # --- 1. Define Test Inputs ---
    # This mimics the data that would come from a frontend simulation request.
    test_inputs: AgentState = {
        "scenario": "heavy_rainfall",
        "location": "Mumbai",
        "zone_id": "airport_zone",
        "config": {
            "heat_threshold": 38,
            "congestion_threshold": 0.8
        },
        # The rest of the state fields are empty initially
        "weather_data": {},
        "cctv_data": {},
        "iot_data": {},
        "pipeline_report": {},
        "normalized_data": {},
        "filtered_data": {},
        "validation_report": {},
        "quality_report": {},
        "sensor_fusion_report": {},
        "fused_environmental_state": {},
        "situational_awareness": {},
        "anomaly_assessment": {},
        "decision_analysis": {},
        "control_action": {},
        "final_verdict": ""
    }

    print(f"▶️  Invoking agent for scenario: '{test_inputs['scenario']}' in zone: '{test_inputs['zone_id']}'\n")

    # --- 2. Invoke the Agent Workflow ---
    # The `agent_app` is the compiled LangGraph workflow.
    final_state = agent_app.invoke(test_inputs)

    print("\n--- ✅ AGENT PIPELINE COMPLETED ✅ ---\n")

    # --- 3. Print the Final State ---
    # Use json.dumps for pretty-printing the final dictionary.
    print("--- Final Agent State ---")
    print(json.dumps(final_state, indent=2, default=str)) # Added default=str for datetime objects
    print("-------------------------\n")


    # --- 4. Verification Checks ---
    print("--- Verification Checks ---")
    try:
        # Check that initial data was collected
        assert "weather_data" in final_state and final_state["weather_data"], "Weather data is missing."
        assert "cctv_data" in final_state and final_state["cctv_data"], "CCTV data is missing."
        assert "iot_data" in final_state and final_state["iot_data"], "IoT data is missing."
        print("✔️  Data Collection outputs are present.")

        # Check that data was processed
        assert "filtered_data" in final_state and final_state["filtered_data"], "Filtered data is missing."
        assert "quality_report" in final_state and final_state["quality_report"], "Quality report is missing."
        print("✔️  Data Preprocessing outputs are present.")

        # Check that data was fused
        assert "sensor_fusion_report" in final_state and final_state["sensor_fusion_report"], "Sensor fusion report is missing."
        assert "fused_environmental_state" in final_state and final_state["fused_environmental_state"], "Fused environmental state is missing."
        print("✔️  Sensor Fusion outputs are present.")

        # Check that anomalies were assessed
        assert "anomaly_assessment" in final_state and final_state["anomaly_assessment"], "Anomaly assessment is missing."
        print("✔️  Anomaly Detection output is present.")

        # Check that a decision was made
        assert "decision_analysis" in final_state and final_state["decision_analysis"], "Decision analysis is missing."
        print("✔️  Decision Engine output is present.")

        # Check for final actions
        assert "control_action" in final_state and "brightness" in final_state["control_action"], "Control action is missing brightness."
        assert "final_verdict" in final_state and final_state["final_verdict"], "Final verdict from judge is missing."
        print("✔️  Final control and verdict outputs are present.")

        # Check for specific analysis details
        risk_score = final_state.get("decision_analysis", {}).get("comprehensive_risk_score", -1)
        assert risk_score != -1, "Comprehensive risk score not found."
        print(f"✔️  Found Comprehensive Risk Score: {risk_score}")

        recommendations = final_state.get("decision_analysis", {}).get("operational_recommendations", [])
        assert len(recommendations) > 0, "No operational recommendations were generated."
        print(f"✔️  Generated {len(recommendations)} operational recommendations.")

        print("\n--- 🎉 TEST PASSED 🎉 ---\n")
    except (AssertionError, KeyError) as e:
        print(f"\n--- ❌ TEST FAILED: {e} ❌ ---\n")


if __name__ == "__main__":
    # Ensure you have your .env file with API keys in the backend folder
    run_test()

