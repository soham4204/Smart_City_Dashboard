# backend/weather/tools/collector_tools.py
import os
import requests
from langchain.tools import tool

# --- Real Weather Data ---
@tool
def fetch_weather_data(location: str):
    """
    Fetches real-time weather data.
    'location' can be a city name (e.g. 'Mumbai') or coordinates (e.g. '19.089,72.865').
    """
    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key:
        return {"error": "Weather API key not found."}

    # WeatherAPI accepts "lat,lon" directly in the 'q' parameter
    url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={location}&aqi=no"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if "error" in data:
            return {"error": data["error"]["message"]}
            
        return {
            "condition": data["current"]["condition"]["text"],
            "temperature": data["current"]["temp_c"],
            "humidity": data["current"]["humidity"],
            "wind_kph": data["current"]["wind_kph"],
            "precip_mm": data["current"]["precip_mm"],
            "visibility_km": data["current"]["vis_km"],
            "is_day": data["current"]["is_day"]
        }
    except Exception as e:
        return {"error": str(e)}

# --- Synthetic CCTV / Traffic Data ---
# (We will upgrade this to Real TomTom Data in the next step)
@tool
def get_enhanced_synthetic_cctv_data(time_of_day: str = "day"):
    """
    Generates synthetic CCTV analysis data for traffic and crowd density.
    """
    import random
    
    # Simulate variations based on time
    if time_of_day == "peak_morning":
        congestion = random.uniform(0.7, 0.95)
        crowd = random.randint(50, 150)
    elif time_of_day == "night":
        congestion = random.uniform(0.1, 0.3)
        crowd = random.randint(5, 20)
    else:
        congestion = random.uniform(0.3, 0.7)
        crowd = random.randint(20, 80)

    return {
        "detected_objects": ["car", "bus", "pedestrian", "bike"],
        "vehicle_count": random.randint(10, 50),
        "congestion_level": round(congestion, 2), # 0.0 to 1.0
        "estimated_crowd_density": crowd,
        "average_speed_kmh": random.randint(10, 60),
        "incident_detected": random.choice([True, False, False, False]) # 25% chance of incident
    }