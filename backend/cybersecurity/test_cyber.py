# backend/test_cyber.py
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_cyber_endpoints():
    """Test all cybersecurity endpoints"""
    
    print("=" * 60)
    print("TESTING CYBERSECURITY API ENDPOINTS")
    print("=" * 60)
    
    # Test 1: Get initial cyber state
    print("\n1. Testing GET /api/v1/cyber/initial-state")
    response = requests.get(f"{BASE_URL}/api/v1/cyber/initial-state")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success! Found {len(data['zones'])} security zones")
        for zone in data['zones']:
            print(f"  - {zone['name']}: {zone['security_state']} state")
    else:
        print(f"✗ Failed with status: {response.status_code}")
    
    # Test 2: Get zone details
    print("\n2. Testing GET /api/v1/cyber/zones/airport_zone/details")
    response = requests.get(f"{BASE_URL}/api/v1/cyber/zones/airport_zone/details")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success! Zone: {data['zone']['name']}")
        print(f"  - Security State: {data['zone']['security_state']}")
        print(f"  - Critical Assets: {len(data['zone']['critical_assets'])}")
    else:
        print(f"✗ Failed with status: {response.status_code}")
    
    # Test 3: Get incidents
    print("\n3. Testing GET /api/v1/cyber/incidents")
    response = requests.get(f"{BASE_URL}/api/v1/cyber/incidents")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success!")
        print(f"  - Active Incidents: {len(data['active_incidents'])}")
        print(f"  - Zones at Risk: {data['zones_at_risk']}")
    else:
        print(f"✗ Failed with status: {response.status_code}")
    
    # Test 4: Simulate ransomware attack
    print("\n4. Testing POST /api/v1/cyber/simulate - Ransomware Attack")
    print("   Simulating CRITICAL ransomware attack on Hospital Zone...")
    
    attack_payload = {
        "zone_id": "hospital_zone",
        "attack_type": "ransomware",
        "severity": "CRITICAL"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/cyber/simulate",
        json=attack_payload
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Attack simulation successful!")
        print(f"  - Incident ID: {data['incident_id']}")
        print(f"  - Initial State: {data['initial_state']} → Final State: {data['final_state']}")
        print(f"  - Time to Detection: {data['time_to_detection']:.1f} minutes")
        print(f"  - Time to Mitigation: {data['time_to_mitigation']:.2f} minutes")
        print(f"  - Anomalies Detected: {data['anomalies_detected']}")
        print(f"  - MITRE TTPs: {', '.join(data['mitre_ttps'])}")
        print(f"  - Response Playbook: {data['response_playbook']}")
        print(f"  - Mitigation Success: {'✓' if data['validation_passed'] else '✗'}")
    else:
        print(f"✗ Failed with status: {response.status_code}")
    
    # Test 5: Simulate brute force attack
    print("\n5. Testing POST /api/v1/cyber/simulate - Brute Force Attack")
    print("   Simulating HIGH severity brute force on Airport Zone...")
    
    attack_payload = {
        "zone_id": "airport_zone",
        "attack_type": "brute_force",
        "severity": "HIGH"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/cyber/simulate",
        json=attack_payload
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Attack simulation successful!")
        print(f"  - Incident ID: {data['incident_id']}")
        print(f"  - Final State: {data['final_state']}")
        print(f"  - Response Playbook: {data['response_playbook']}")
    else:
        print(f"✗ Failed with status: {response.status_code}")
    
    # Test 6: Get event stream
    print("\n6. Testing GET /api/v1/cyber/events/stream")
    response = requests.get(f"{BASE_URL}/api/v1/cyber/events/stream?limit=5")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success! Found {data['total_count']} total events")
        print(f"  Showing last {len(data['events'])} events:")
        for event in data['events'][-3:]:
            print(f"  - [{event['severity']}] {event['event_type']} in {event['zone_id']}")
    else:
        print(f"✗ Failed with status: {response.status_code}")
    
    # Test 7: Check incidents after attacks
    print("\n7. Checking incidents after simulated attacks")
    response = requests.get(f"{BASE_URL}/api/v1/cyber/incidents?active_only=true")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success!")
        print(f"  - Active Incidents: {len(data['incidents'])}")
        for incident in data['incidents']:
            print(f"    • {incident['incident_id']}: {incident['attack_type']} ({incident['status']})")
    else:
        print(f"✗ Failed with status: {response.status_code}")

def test_multiple_attacks():
    """Test multiple simultaneous attacks"""
    
    print("\n" + "=" * 60)
    print("TESTING MULTIPLE SIMULTANEOUS ATTACKS")
    print("=" * 60)
    
    attacks = [
        {"zone_id": "defence_zone", "attack_type": "apt", "severity": "CRITICAL"},
        {"zone_id": "education_zone", "attack_type": "data_exfiltration", "severity": "HIGH"},
        {"zone_id": "commercial_zone", "attack_type": "ddos", "severity": "HIGH"},
    ]
    
    print("\nSimulating 3 simultaneous attacks:")
    results = []
    
    for attack in attacks:
        print(f"\n  Attacking {attack['zone_id']} with {attack['attack_type']}...")
        response = requests.post(f"{BASE_URL}/api/v1/cyber/simulate", json=attack)
        
        if response.status_code == 200:
            data = response.json()
            results.append(data)
            print(f"  ✓ {attack['zone_id']}: {data['initial_state']} → {data['final_state']}")
            print(f"    Mitigation time: {data['time_to_mitigation']:.2f} min")
    
    # Summary
    print("\n" + "-" * 40)
    print("ATTACK SUMMARY:")
    successful_mitigations = sum(1 for r in results if r['validation_passed'])
    print(f"  Total Attacks: {len(results)}")
    print(f"  Successful Mitigations: {successful_mitigations}")
    print(f"  Partial/Failed: {len(results) - successful_mitigations}")
    
    avg_detection = sum(r['time_to_detection'] for r in results) / len(results) if results else 0
    avg_mitigation = sum(r['time_to_mitigation'] for r in results) / len(results) if results else 0
    print(f"  Avg Detection Time: {avg_detection:.1f} minutes")
    print(f"  Avg Mitigation Time: {avg_mitigation:.2f} minutes")

def test_weather_still_works():
    """Verify weather endpoints still work"""
    
    print("\n" + "=" * 60)
    print("VERIFYING WEATHER SYSTEM STILL WORKS")
    print("=" * 60)
    
    print("\n1. Testing GET /api/v1/dashboard/initial-state (Weather)")
    response = requests.get(f"{BASE_URL}/api/v1/dashboard/initial-state")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Weather system operational!")
        print(f"  - Zones with light poles: {len(data['zones'])}")
        total_poles = sum(len(zone['poles']) for zone in data['zones'])
        print(f"  - Total light poles: {total_poles}")
    else:
        print(f"✗ Weather system issue: {response.status_code}")
    
    print("\n2. Testing POST /api/v1/simulation/weather")
    weather_payload = {"scenario": "heavy_rainfall"}
    response = requests.post(f"{BASE_URL}/api/v1/simulation/weather", json=weather_payload)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Weather simulation successful!")
        print(f"  - Scenario: heavy_rainfall")
        print(f"  - New brightness: {data['new_brightness']}%")
    else:
        print(f"✗ Weather simulation failed: {response.status_code}")

if __name__ == "__main__":
    print("\n🚀 Starting Cybersecurity API Tests")
    print("=" * 60)
    print("Make sure the server is running: python main.py")
    print("=" * 60)
    
    try:
        # Check if server is running
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✓ Server is running!")
            
            # Run tests
            test_cyber_endpoints()
            test_multiple_attacks()
            test_weather_still_works()
            
            print("\n" + "=" * 60)
            print("✅ ALL TESTS COMPLETED!")
            print("=" * 60)
            
        else:
            print("✗ Server not responding properly")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to server!")
        print("Please start the server first:")
        print("  python main.py")
        print("\nThen run this test script again.")