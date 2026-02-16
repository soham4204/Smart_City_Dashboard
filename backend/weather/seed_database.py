# backend/weather/seed_database.py
from sqlmodel import Session, select
from database import engine
from models import Zone, LightPole

def seed_data_if_empty():
    with Session(engine) as session:
        if session.exec(select(Zone)).first():
            return

        print("Seeding 3D Data...")

        # 1. Create Zones with different visual heights (e.g., higher = more critical)
        zones = [
            Zone(id="z1", name="CSM International Airport", color="#ef4444", heat_threshold=35, height=200.0), # Tallest zone
            Zone(id="z2", name="KEM Hospital", color="#3b82f6", heat_threshold=30, height=100.0),
            Zone(id="z3", name="Dadar Residential", color="#10b981", heat_threshold=40, height=50.0), # Lowest zone
        ]
        
        for z in zones:
            session.add(z)
        
        # 2. Create Poles with Altitude
        # Note: If using "WorldElevation" in frontend, altitude 0 might be underground. 
        # Use roughly 10-20m to ensure they sit on top of terrain/buildings.
        poles = [
            LightPole(id="P001", zone_id="z1", latitude=19.089, longitude=72.868, altitude=15.0, group="Airport"),
            LightPole(id="P002", zone_id="z1", latitude=19.091, longitude=72.870, altitude=15.0, group="Airport"),
            LightPole(id="P003", zone_id="z2", latitude=19.002, longitude=72.842, altitude=12.0, group="Hospital"),
            LightPole(id="P004", zone_id="z3", latitude=19.017, longitude=72.845, altitude=5.0, group="Residential"),
        ]

        for p in poles:
            session.add(p)
            
        session.commit()
        print("Seeding Complete.")