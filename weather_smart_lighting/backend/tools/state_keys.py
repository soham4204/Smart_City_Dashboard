# tools/state_keys.py
# Centralized constants for all session state keys to prevent typos and bugs.

# --- Parameter Extraction ---
EXTRACTED_PARAMS = "extracted_params"

# --- Raw Data Collection ---
RAW_WEATHER_DATA = "weather_data"
RAW_CCTV_DATA = "cctv_data"
RAW_IOT_DATA = "iot_data"

# --- Preprocessing Stage ---
PREPROCESSED_DATA = "filtered_data"
PREPROCESSING_REPORT = "pipeline_report"

# --- Sensor Fusion Stage ---
FUSED_STATE = "fused_environmental_state"
SENSOR_FUSION_REPORT = "sensor_fusion_report"

# --- Anomaly Detection Stage ---
ANOMALY_ASSESSMENT = "anomaly_assessment"

# --- Decision Engine Stage ---
DECISION_ANALYSIS = "decision_analysis"
DECISION_RECOMMENDATIONS = "decision_recommendations"

# --- Final Reporting Stage ---
FINAL_REPORT = "comprehensive_report"