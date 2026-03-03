import requests
import json
url = "http://localhost:8001/api/v1/traffic/calculate-smart-route"
payload = {"origin": [72.8258, 18.9220], "destination": [72.8400, 19.0150]} # CST to KEM
headers = {"Content-Type": "application/json"}
try:
    response = requests.post(url, json=payload, headers=headers)
    print("Status:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", e)
