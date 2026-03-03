import requests
import json
url = 'http://router.project-osrm.org/route/v1/driving/72.8258,18.9220;72.8400,19.0150'
params = {'overview': 'full', 'geometries': 'geojson'}
headers = {'User-Agent': 'SmartCityDashboard/1.0'}
response = requests.get(url, params=params, headers=headers)
print(json.dumps(response.json())[:500])
