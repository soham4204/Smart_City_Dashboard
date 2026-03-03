import traceback
import sys

try:
    from agent import agent_app
    print("Agent imported successfully")
    inputs = {
        "scenario": "heavy_rainfall",
        "location": "Mumbai",
        "zone_id": "test_123",
        "config": {"heat_threshold": 35},
    }
    result = agent_app.invoke(inputs)
    print("Success! Result keys:", result.keys() if isinstance(result, dict) else result)
except Exception as e:
    with open("python_error.txt", "w", encoding="utf-8") as f:
        traceback.print_exc(file=f)
