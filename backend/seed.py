from datetime import timedelta
from app.utils.clock import utc_now

from app.database import Base, SessionLocal, engine, ensure_sqlite_columns
from app.models import Alert, CctvCamera, CctvEvent, CivicNews, EmergencyReport, Incident


def upsert_by_id(db, model, id_field: str, identity: str, values: dict):
    existing = db.query(model).filter(getattr(model, id_field) == identity).first()
    if existing:
        return False
    db.add(model(**values))
    return True


def seed_data():
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_columns()
    db = SessionLocal()

    try:
        now = utc_now()
        inserted = {
            "incidents": 0,
            "alerts": 0,
            "cameras": 0,
            "events": 0,
            "emergencies": 0,
            "news": 0,
        }

        incidents = [
            {
                "incident_id": "INC-DEMO-001",
                "category": "Heavy Rain",
                "title": "Water accumulation near main road",
                "description": "Surface water accumulation reported near the underpass.",
                "location_name": "Main Road Underpass",
                "area": "Shivajinagar",
                "mandal": "Haveli Mandal",
                "district": "Pune District",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "severity": "high",
                "confidence_percent": 92,
                "status": "VERIFIED",
                "possible_impact": "Possible traffic slowdown and temporary road obstruction.",
                "what_to_do": "Avoid the low-lying road until water recedes.",
                "source_type": "citizen",
                "authority_routing": {
                    "department": "Municipal Drainage & Stormwater Cell",
                    "routingStatus": "simulated",
                    "assignedUnit": "Ward Pump Unit 4",
                    "etaMinutes": 15,
                    "isSimulated": True,
                    "actionGuidance": "Drainage team notified for assessment. Simulated routing.",
                },
                "created_at": now - timedelta(minutes=12),
                "updated_at": now - timedelta(minutes=8),
            },
            {
                "incident_id": "INC-DEMO-002",
                "category": "Major Road Accident",
                "title": "Two-wheeler accident reported",
                "description": "A road accident has been reported near the central junction.",
                "location_name": "FC Road Junction",
                "area": "Shivajinagar",
                "mandal": "Haveli Mandal",
                "district": "Pune District",
                "latitude": 18.5235,
                "longitude": 73.8412,
                "severity": "medium",
                "confidence_percent": 86,
                "status": "RESPONSE INITIATED",
                "possible_impact": "Traffic congestion around the junction.",
                "what_to_do": "Use an alternate route and follow traffic personnel instructions.",
                "source_type": "citizen",
                "authority_routing": {
                    "department": "Traffic Police",
                    "routingStatus": "simulated",
                    "assignedUnit": "Traffic Response Unit 2",
                    "etaMinutes": 8,
                    "isSimulated": True,
                    "actionGuidance": "Traffic response unit assigned. Simulated routing.",
                },
                "created_at": now - timedelta(minutes=27),
                "updated_at": now - timedelta(minutes=20),
            },
            {
                "incident_id": "INC-DEMO-003",
                "category": "Infrastructure Damage",
                "title": "Damaged streetlight reported",
                "description": "A damaged streetlight has been reported near the residential area.",
                "location_name": "Kothrud Residential Block",
                "area": "Kothrud",
                "mandal": "Haveli Mandal",
                "district": "Pune District",
                "latitude": 18.5074,
                "longitude": 73.8077,
                "severity": "low",
                "confidence_percent": 78,
                "status": "UNDER REVIEW",
                "possible_impact": "Reduced visibility during nighttime.",
                "what_to_do": "Exercise caution in the area after dark.",
                "source_type": "citizen",
                "authority_routing": {
                    "department": "Municipal Electrical Cell",
                    "routingStatus": "prepared",
                    "assignedUnit": None,
                    "etaMinutes": None,
                    "isSimulated": True,
                    "actionGuidance": "Maintenance request prepared. Simulated routing.",
                },
                "created_at": now - timedelta(hours=1),
                "updated_at": now - timedelta(minutes=40),
            },
            {
                "incident_id": "INC-DEMO-004",
                "category": "Fire / Smoke",
                "title": "Smoke detected near market area",
                "description": "Smoke was reported near a commercial market area.",
                "location_name": "Laxmi Road Market",
                "area": "Budhwar Peth",
                "mandal": "Haveli Mandal",
                "district": "Pune District",
                "latitude": 18.516,
                "longitude": 73.855,
                "severity": "critical",
                "confidence_percent": 95,
                "status": "RESPONSE INITIATED",
                "possible_impact": "Potential fire hazard and traffic disruption.",
                "what_to_do": "Maintain distance and follow emergency personnel instructions.",
                "source_type": "cctv_ai",
                "authority_routing": {
                    "department": "Fire & Emergency Services",
                    "routingStatus": "simulated",
                    "assignedUnit": "Fire Response Unit 1",
                    "etaMinutes": 6,
                    "isSimulated": True,
                    "actionGuidance": "Emergency response dispatch simulated.",
                },
                "created_at": now - timedelta(minutes=43),
                "updated_at": now - timedelta(minutes=30),
            },
            {
                "incident_id": "INC-DEMO-005",
                "category": "Infrastructure Damage",
                "title": "Open manhole cover reported",
                "description": "Repeated infrastructure complaint for an unsecured manhole.",
                "location_name": "Karve Road Service Lane",
                "area": "Kothrud",
                "mandal": "Haveli Mandal",
                "district": "Pune District",
                "latitude": 18.5088,
                "longitude": 73.8099,
                "severity": "medium",
                "confidence_percent": 81,
                "status": "REPORTED",
                "possible_impact": "Pedestrian and two-wheeler hazard.",
                "what_to_do": "Avoid the service lane until municipal crew secures the cover.",
                "source_type": "citizen",
                "authority_routing": {
                    "department": "Municipal Electrical & Works Cell",
                    "routingStatus": "simulated",
                    "assignedUnit": "Ward Works Crew 3",
                    "etaMinutes": 25,
                    "isSimulated": True,
                    "actionGuidance": "Works ticket prepared. Simulated routing.",
                },
                "created_at": now - timedelta(minutes=90),
                "updated_at": now - timedelta(minutes=90),
            },
        ]

        for row in incidents:
            if upsert_by_id(db, Incident, "incident_id", row["incident_id"], row):
                inserted["incidents"] += 1

        alerts = [
            {
                "alert_id": "ALT-DEMO-001",
                "title": "Heavy Rain Alert",
                "message": "Heavy rainfall is expected. Avoid low-lying roads and underpasses.",
                "category": "Weather",
                "priority": "high",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "location_name": "Shivajinagar",
                "area": "Shivajinagar",
                "district": "Pune District",
                "status": "active",
                "source": "Civic Meteorological Grid",
                "icon_type": "weather",
                "created_at": now - timedelta(minutes=10),
            },
            {
                "alert_id": "ALT-DEMO-002",
                "title": "Traffic Diversion",
                "message": "Traffic movement may be affected near FC Road Junction due to an incident.",
                "category": "Traffic",
                "priority": "medium",
                "latitude": 18.5235,
                "longitude": 73.8412,
                "location_name": "FC Road Junction",
                "area": "Shivajinagar",
                "district": "Pune District",
                "status": "active",
                "source": "CCTV Vision & Citizen Reports",
                "icon_type": "traffic",
                "created_at": now - timedelta(minutes=25),
            },
            {
                "alert_id": "ALT-DEMO-003",
                "title": "Streetlight Maintenance",
                "message": "Maintenance has been requested for a damaged streetlight in Kothrud.",
                "category": "Infrastructure",
                "priority": "low",
                "latitude": 18.5074,
                "longitude": 73.8077,
                "location_name": "Kothrud",
                "area": "Kothrud",
                "district": "Pune District",
                "status": "active",
                "source": "Ward Engineering Control",
                "icon_type": "hazard",
                "created_at": now - timedelta(hours=1),
            },
            {
                "alert_id": "ALT-DEMO-004",
                "title": "Emergency Response",
                "message": "Emergency services are responding to smoke near Laxmi Road Market.",
                "category": "Emergency",
                "priority": "critical",
                "latitude": 18.516,
                "longitude": 73.855,
                "location_name": "Laxmi Road Market",
                "area": "Budhwar Peth",
                "district": "Pune District",
                "status": "active",
                "source": "Fire Control Room",
                "icon_type": "fire",
                "created_at": now - timedelta(minutes=40),
            },
        ]
        for row in alerts:
            if upsert_by_id(db, Alert, "alert_id", row["alert_id"], row):
                inserted["alerts"] += 1

        cameras = [
            {
                "camera_id": "CAM-DEMO-001",
                "name": "Main Junction North Pole",
                "camera_code": "CP-CAM-401",
                "latitude": 18.5235,
                "longitude": 73.8412,
                "status": "demo",
                "location_name": "FC Road Junction",
                "area": "Shivajinagar",
                "mandal": "Haveli Mandal",
                "district": "Pune District",
                "stream_fps": 25,
                "resolution": "1080p · Optical 30x",
                "is_simulated": 1,
                "stream_type": "demo",
                "stream_url": None,
                "is_enabled": 1,
                "last_error": None,
                "last_seen": now - timedelta(seconds=8),
                "created_at": now - timedelta(days=1),
            },
            {
                "camera_id": "CAM-DEMO-002",
                "name": "Underpass Transit Portal",
                "camera_code": "CP-CAM-402",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "status": "demo",
                "location_name": "Main Road Underpass",
                "area": "Shivajinagar",
                "mandal": "Haveli Mandal",
                "district": "Pune District",
                "stream_fps": 24,
                "resolution": "1080p · Thermal Overlay",
                "is_simulated": 1,
                "stream_type": "demo",
                "stream_url": None,
                "is_enabled": 1,
                "last_error": None,
                "last_seen": now - timedelta(seconds=3),
                "created_at": now - timedelta(days=1),
            },
            {
                "camera_id": "CAM-DEMO-003",
                "name": "East Sector Market Promenade",
                "camera_code": "CP-CAM-403",
                "latitude": 18.516,
                "longitude": 73.855,
                "status": "offline",
                "location_name": "Laxmi Road Market",
                "area": "Budhwar Peth",
                "mandal": "Haveli Mandal",
                "district": "Pune District",
                "stream_fps": 0,
                "resolution": "1080p",
                "is_simulated": 1,
                "stream_type": "demo",
                "stream_url": None,
                "is_enabled": 0,
                "last_error": "Demo node parked offline for presentation contrast",
                "last_seen": now - timedelta(minutes=18),
                "created_at": now - timedelta(days=1),
            },
        ]
        for row in cameras:
            if upsert_by_id(db, CctvCamera, "camera_id", row["camera_id"], row):
                inserted["cameras"] += 1

        events = [
            {
                "event_id": "CCTV-DEMO-001",
                "camera_id": "CAM-DEMO-001",
                "event_type": "vehicle collision",
                "severity": "high",
                "confidence": 94,
                "latitude": 18.5235,
                "longitude": 73.8412,
                "description": "Simulated multi-vehicle velocity mismatch at signal junction. No facial identification.",
                "is_simulated": 1,
                "created_at": now - timedelta(minutes=12),
            },
            {
                "event_id": "CCTV-DEMO-002",
                "camera_id": "CAM-DEMO-002",
                "event_type": "flooding/water accumulation",
                "severity": "medium",
                "confidence": 89,
                "latitude": 18.5204,
                "longitude": 73.8567,
                "description": "Simulated road-surface water threshold event. Privacy-preserving spatial class only.",
                "is_simulated": 1,
                "created_at": now - timedelta(minutes=6),
            },
            {
                "event_id": "CCTV-DEMO-003",
                "camera_id": "CAM-DEMO-001",
                "event_type": "traffic congestion",
                "severity": "medium",
                "confidence": 83,
                "latitude": 18.5235,
                "longitude": 73.8412,
                "description": "Simulated congestion class from queue length. No person identity stored.",
                "is_simulated": 1,
                "created_at": now - timedelta(minutes=18),
            },
        ]
        for row in events:
            if upsert_by_id(db, CctvEvent, "event_id", row["event_id"], row):
                inserted["events"] += 1

        emergencies = [
            {
                "report_id": "EMG-DEMO-001",
                "category": "Fire / Smoke",
                "description": "Citizen emergency report of smoke near market stalls.",
                "severity": "high",
                "status": "response_initiated",
                "latitude": 18.516,
                "longitude": 73.855,
                "location_name": "Laxmi Road Market",
                "evidence_url": None,
                "is_simulated": 1,
                "authority_routing": {
                    "department": "Fire & Emergency Services",
                    "routingStatus": "simulated",
                    "assignedUnit": "Fire Response Unit 1",
                    "etaMinutes": 6,
                    "isSimulated": True,
                    "actionGuidance": "Dispatch is simulated for the hackathon MVP.",
                },
                "created_at": now - timedelta(minutes=40),
                "updated_at": now - timedelta(minutes=32),
            },
        ]
        for row in emergencies:
            if upsert_by_id(db, EmergencyReport, "report_id", row["report_id"], row):
                inserted["emergencies"] += 1

        news_rows = [
            {
                "news_id": "NEWS-DEMO-001",
                "title": "Shivajinagar: Pre-monsoon stormwater culvert maintenance completed",
                "summary": "Municipal teams concluded sediment extraction across arterial road culverts.",
                "source": "Civic Information Bureau (demo)",
                "geographic_level": "Area",
                "location_name": "Shivajinagar",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "priority": "important",
                "verified": 1,
                "is_demo": 1,
                "published_at": now - timedelta(hours=1),
            },
            {
                "news_id": "NEWS-DEMO-002",
                "title": "Haveli Mandal: Scheduled traffic detour during flyover inspection",
                "summary": "Night inspection 23:00–05:00. Heavy vehicles rerouted to outer ring bypass.",
                "source": "Traffic Police Commissionerate (demo)",
                "geographic_level": "Mandal",
                "location_name": "Haveli Mandal",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "priority": "routine",
                "verified": 1,
                "is_demo": 1,
                "published_at": now - timedelta(hours=3),
            },
            {
                "news_id": "NEWS-DEMO-003",
                "title": "Pune District: Emergency command center expands sensor coverage",
                "summary": "Intersection telemetry now feeds the municipal emergency dispatch board.",
                "source": "Smart City Mission Authority (demo)",
                "geographic_level": "District",
                "location_name": "Pune District",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "priority": "routine",
                "verified": 1,
                "is_demo": 1,
                "published_at": now - timedelta(hours=5),
            },
            {
                "news_id": "NEWS-DEMO-004",
                "title": "Transit Alert: Feeder bus frequency increased on metro corridors",
                "summary": "Feeder buses will operate at 8-minute headways during peak rain hours.",
                "source": "Public Transport Undertaking (demo)",
                "geographic_level": "Nearby",
                "location_name": "Metro Line 1 Corridor",
                "latitude": 18.528,
                "longitude": 73.872,
                "priority": "routine",
                "verified": 1,
                "is_demo": 1,
                "published_at": now - timedelta(hours=6),
            },
        ]
        for row in news_rows:
            if upsert_by_id(db, CivicNews, "news_id", row["news_id"], row):
                inserted["news"] += 1

        db.commit()
        print("======================================")
        print("CityPulse seed completed (idempotent)")
        print("======================================")
        print(inserted)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
