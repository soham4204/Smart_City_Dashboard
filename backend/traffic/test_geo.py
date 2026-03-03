import requests
import json
url = "http://localhost:8001/api/v1/traffic/calculate-smart-route"
payload = {"origin": [72.8258, 18.9220], "destination": [72.8400, 19.0150]}
headers = {"Content-Type": "application/json"}
response = requests.post(url, json=payload, headers=headers)
data = response.json()
coords = data.get("geojson", {}).get("features", [{}])[0].get("geometry", {}).get("coordinates", "Missing")
print(f"Impact: {data.get('impact_state')}")
if isinstance(coords, list):
    print(f"Coordinates list length: {len(coords)}")
else:
    print(f"Coordinates: {coords}")
