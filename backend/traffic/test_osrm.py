import requests
import json
url = "http://router.project-osrm.org/route/v1/driving/72.8400,19.0150;72.8656,19.0896?overview=full&geometries=geojson"
headers = {"User-Agent": "SmartCityDashboard/1.0"}
data = requests.get(url, headers=headers).json()
try:
    geom = data["routes"][0]["geometry"]
    print(f"Geometry type: {type(geom)}")
    print(f"Geometry (if string): {geom[:50] if isinstance(geom, str) else 'Not a string'}")
    if isinstance(geom, dict):
        print(f"Dict keys: {geom.keys()}")
        print(f"Geom type: {geom.get('type')}")
        coords = geom.get('coordinates', [])
        print(f"Coords length: {len(coords)}")
except Exception as e:
    print(e)
