# tools/embedding_client.py
import requests
import logging
from typing import List, Dict, Any

# Configure the base URL for your new service
EMBEDDING_SERVICE_URL = "http://127.0.0.1:8080"
logger = logging.getLogger(__name__)

def get_embedding_from_service(text: str) -> List[float]:
    """Gets a vector embedding from the dedicated microservice."""
    try:
        response = requests.post(f"{EMBEDDING_SERVICE_URL}/embed", json={"text": text})
        response.raise_for_status() # Raises an exception for bad status codes
        return response.json()
    except requests.RequestException as e:
        logger.error(f"API call to embedding service failed: {e}")
        raise ConnectionError("Could not connect to the embedding service.") from e

def query_service_for_incidents(vector: List[float], top_k: int = 3) -> List[Dict[str, Any]]:
    """Queries for similar incidents via the dedicated microservice."""
    try:
        response = requests.post(
            f"{EMBEDDING_SERVICE_URL}/query",
            json={"vector": vector, "top_k": top_k}
        )
        response.raise_for_status()
        return response.json().get("matches", [])
    except requests.RequestException as e:
        logger.error(f"API call to query service failed: {e}")
        raise ConnectionError("Could not connect to the query service.") from e

def upsert_incident_to_service(report_id: str, vector: List[float], metadata: Dict[str, Any]):
    """Upserts an incident report via the dedicated microservice."""
    try:
        response = requests.post(
            f"{EMBEDDING_SERVICE_URL}/upsert",
            json={"report_id": report_id, "vector": vector, "metadata": metadata}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"API call to upsert service failed: {e}")
        raise ConnectionError("Could not connect to the upsert service.") from e