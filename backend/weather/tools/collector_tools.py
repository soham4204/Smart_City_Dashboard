import os
import random
import requests
import logging
from datetime import datetime, timezone
from typing import Dict, Any

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

API_TIMEOUT = 10
WEATHER_API_BASE_URL = "http://api.weatherapi.com/v1/current.json"

def get_live_weather(location: str, state: dict) -> Dict[str, Any]:
    """
    Fetches live weather data and saves the raw dictionary to session state.
    """
    api_key = os.environ.get("WEATHER_API_KEY") or "2a8cb759288745b69f7123240251708"
    params = {"key": api_key, "q": location, "aqi": "yes"}
    
    collection_start = datetime.now(timezone.utc)
    try:
        logger.info(f"Fetching weather data for location: {location}")
        response = requests.get(WEATHER_API_BASE_URL, params=params, timeout=API_TIMEOUT)
        response.raise_for_status()
        weather_data = response.json()
        
        weather_data["collection_metadata"] = {
            "collected_at": collection_start.isoformat(),
            "response_time_ms": int((datetime.now(timezone.utc) - collection_start).total_seconds() * 1000),
            "api_status": "success",
            "data_source": "WeatherAPI",
            "location_resolved": weather_data.get("location", {}).get("name", location)
        }

        state["weather_data"] = weather_data
        logger.info(f"Successfully saved weather data for {location} to state.")
        return {"status": "success", "message": "Weather data collected and saved."}

    except requests.exceptions.RequestException as e:
        error_msg = f"Weather API request failed: {str(e)}"
        logger.error(error_msg)
        # Still save an error marker to state if needed
        state["weather_data"] = {"error": error_msg}
        return {"status": "error", "message": error_msg}

def get_enhanced_synthetic_cctv_data(zone_id: str, state: dict) -> Dict[str, Any]:
    """
    Generates simulated CCTV data and saves the raw dictionary to session state.
    """
    logger.info(f"Generating enhanced synthetic CCTV data for zone: {zone_id}")
    current_hour = datetime.now().hour
    
    if 7 <= current_hour <= 9 or 17 <= current_hour <= 19:
        base_vehicle_multiplier, base_pedestrian_multiplier = 1.5, 1.3
    elif 22 <= current_hour or current_hour <= 6:
        base_vehicle_multiplier, base_pedestrian_multiplier = 0.4, 0.3
    else:
        base_vehicle_multiplier, base_pedestrian_multiplier = 1.0, 1.0
    
    cctv_data = {
        "zone_id": zone_id, 
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "pedestrian_count": max(1, int(random.randint(5, 50) * base_pedestrian_multiplier)), 
        "vehicle_count": max(2, int(random.randint(10, 100) * base_vehicle_multiplier)),
        "congestion_level": round(min(1.0, (random.randint(5, 50) + random.randint(10, 100)) / 150), 3), 
        "incident_detected": random.random() < 0.05,
        "camera_metadata": {
            "camera_id": f"CAM-{zone_id}-01", 
            "detection_confidence": round(random.uniform(0.85, 0.98), 3)
        }
    }
    if cctv_data["incident_detected"]:
        cctv_data["incident_details"] = {"type": random.choice(["minor_collision", "stalled_vehicle"])}
    
    # Save the raw data directly to the session state
    state["cctv_data"] = cctv_data
    logger.info(f"Successfully saved CCTV data for {zone_id} to state.")
    return {"status": "success", "message": "CCTV data collected and saved."}

def get_enhanced_synthetic_iot_sensor_data(zone_id: str, state: dict) -> Dict[str, Any]:
    """
    Generates simulated IoT data and saves the raw dictionary to session state.
    """
    logger.info(f"Generating enhanced synthetic IoT sensor data for zone: {zone_id}")
    current_hour = datetime.now().hour
    
    if 7 <= current_hour <= 9 or 17 <= current_hour <= 19:
        aqi_base, noise_base = random.randint(80, 150), random.randint(65, 90)
    else:
        aqi_base, noise_base = random.randint(40, 100), random.randint(50, 75)
    light_range = (200, 800) if 6 <= current_hour <= 18 else (5, 200)
    
    iot_data = {
        "zone_id": zone_id, 
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "air_quality_index": aqi_base, 
        "noise_level_db": noise_base,
        "ambient_light_lux": random.randint(*light_range),
        "sensor_metadata": {
            "sensor_network_id": f"IoT-{zone_id}", 
            "data_reliability": round(random.uniform(0.90, 0.99), 3)
        },
        "additional_metrics": {
            "humidity_percent": random.randint(40, 80), 
            "uv_index": max(0, random.randint(0, 11) if 6 <= current_hour <= 18 else 0)
        }
    }
    
    # Save the raw data directly to the session state
    state["iot_data"] = iot_data
    logger.info(f"Successfully saved IoT data for {zone_id} to state.")
    return {"status": "success", "message": "IoT data collected and saved."}
