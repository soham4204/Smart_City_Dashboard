# backend/seed_database.py
import os
import time
from dotenv import load_dotenv
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from langchain_community.embeddings import HuggingFaceEmbeddings  # ✅ HuggingFace instead of Google

# --- Configuration ---
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "smart-city-incidents")

if not PINECONE_API_KEY:
    raise ValueError("❌ PINECONE_API_KEY not found in .env file. Please set it.")

print("✅ API key loaded successfully")
print(f"📍 Using Pinecone index: {PINECONE_INDEX_NAME}")

# --- Historical incidents (same as before) ---
historical_incidents = [
    {"id": "inc-001", "summary": "Severe traffic congestion and high noise levels detected during monsoon season.", "action_taken": "Increased light brightness to 95% for visibility, activated dynamic traffic signal optimization.", "outcome": "Resolved: Congestion eased after 45 minutes."},
    {"id": "inc-002", "summary": "Extreme heat conditions and critical air quality detected.", "action_taken": "Reduced light brightness to 70% to conserve energy, issued public health advisory.", "outcome": "Mitigated: Energy load reduced, public awareness increased."},
    {"id": "inc-003", "summary": "Low ambient light during clear daylight hours, indicating sensor malfunction.", "action_taken": "Dispatched sensor maintenance team, cross-validated with backup systems.", "outcome": "Resolved: Faulty light sensor calibrated."},
    {"id": "inc-004", "summary": "Heavy rainfall with flooding in low-lying areas and power outage reports.", "action_taken": "Emergency services deployed, activated backup power systems, coordinated drainage pumps.", "outcome": "Resolved: Waters receded within 2 hours, power restored."},
    {"id": "inc-005", "summary": "High wind speeds affecting street infrastructure and moderate traffic delays.", "action_taken": "Secured loose street furniture, issued weather advisory, reduced traffic speed limits.", "outcome": "Mitigated: No major damage reported, traffic normalized."},
    {"id": "inc-006", "summary": "Air quality index spiked to hazardous levels due to industrial emissions.", "action_taken": "Issued air quality alert, recommended indoor activities, activated air filtration systems.", "outcome": "Monitored: AQI returned to moderate levels after 6 hours."},
    {"id": "inc-007", "summary": "Multiple vehicle collision on main highway during foggy conditions.", "action_taken": "Deployed emergency response teams, activated fog lights at 100%, rerouted traffic.", "outcome": "Resolved: Highway cleared in 90 minutes, minor injuries treated."},
    {"id": "inc-008", "summary": "Unusually high noise pollution from construction activity exceeding limits.", "action_taken": "Issued noise violation notice, enforced quiet hours, monitored decibel levels.", "outcome": "Resolved: Construction adjusted schedule to comply with regulations."}
]

def run_seeding():
    print("\n--- Starting Vector Database Seeding ---\n")
    
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)

        if PINECONE_INDEX_NAME not in pc.list_indexes().names():
            print(f"⚠️ Index '{PINECONE_INDEX_NAME}' does not exist. Creating it now...")
            pc.create_index(
                name=PINECONE_INDEX_NAME, 
                dimension=384,  # ✅ HuggingFace MiniLM = 384 dims
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
            print("⏳ Waiting for index to be initialized...")
            time.sleep(10)
            print(f"✅ Index '{PINECONE_INDEX_NAME}' created successfully.")
        else:
            print(f"✅ Pinecone index '{PINECONE_INDEX_NAME}' already exists.")

        # --- Initialize HuggingFace embeddings ---
        print("🔧 Initializing HuggingFace Embeddings...")
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

        texts = [incident["summary"] for incident in historical_incidents]
        
        print(f"\n📤 Upserting {len(texts)} documents into index '{PINECONE_INDEX_NAME}'...")

        PineconeVectorStore.from_texts(
            texts=texts,
            embedding=embeddings,
            metadatas=historical_incidents,
            index_name=PINECONE_INDEX_NAME
        )

        print("\n✅ Seeding Complete!")

    except Exception as e:
        print(f"\n❌ Error during seeding: {type(e).__name__}")
        print(f"   Message: {str(e)}")
        raise

if __name__ == "__main__":
    run_seeding()
