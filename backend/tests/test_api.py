from tests.conftest import client
from seed import seed_data
from app.database import SessionLocal
from app.models.incident import Incident


def test_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["success"] is True


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_location_resolve_success():
    res = client.post(
        "/api/v1/location/resolve",
        json={"latitude": 18.5204, "longitude": 73.8567},
    )
    assert res.status_code == 200
    body = res.json()
    assert "area" in body
    assert "mandal" in body
    assert "district" in body
    assert body["latitude"] == 18.5204


def test_location_invalid_coordinates():
    res = client.post(
        "/api/v1/location/resolve",
        json={"latitude": 200, "longitude": 10},
    )
    assert res.status_code == 422


def test_get_incidents():
    res = client.get("/api/incidents")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert any(item["id"] == "INC-DEMO-001" for item in data)


def test_get_incident_not_found():
    res = client.get("/api/incidents/INC-MISSING")
    assert res.status_code == 404


def test_create_incident_and_persist():
    payload = {
        "category": "Road Blockage",
        "description": "Fallen debris blocking a lane.",
        "latitude": 18.53,
        "longitude": 73.85,
        "area": "Test Area",
        "mandal": "Haveli Mandal",
        "district": "Pune District",
        "locationName": "Test Corridor",
    }
    created = client.post("/api/incidents", json=payload)
    assert created.status_code == 201
    incident_id = created.json()["id"]
    fetched = client.get(f"/api/incidents/{incident_id}")
    assert fetched.status_code == 200
    assert fetched.json()["category"] == "Road Blockage"
    db = SessionLocal()
    try:
        row = db.query(Incident).filter(Incident.incident_id == incident_id).first()
        assert row is not None
    finally:
        db.close()


def test_create_incident_invalid_input():
    res = client.post("/api/incidents", json={"category": "Not A Real Category", "description": "x"})
    assert res.status_code == 422


def test_alerts_crud_filters():
    listing = client.get("/api/alerts", params={"category": "Weather", "status": "active"})
    assert listing.status_code == 200
    assert all(item["category"] == "Weather" for item in listing.json())

    created = client.post(
        "/api/alerts",
        json={
            "title": "Civic notice",
            "message": "Temporary civic advisory.",
            "category": "Civic",
            "priority": "low",
            "area": "Kothrud",
            "district": "Pune District",
        },
    )
    assert created.status_code == 201
    alert_id = created.json()["id"]
    patched = client.patch(f"/api/alerts/{alert_id}/status", json={"status": "resolved"})
    assert patched.status_code == 200
    assert patched.json()["status"] == "resolved"
    missing = client.get("/api/alerts/ALT-MISSING")
    assert missing.status_code == 404


def test_cctv_cameras_and_events():
    cameras = client.get("/api/cctv/cameras")
    assert cameras.status_code == 200
    assert any(item["camera_id"] == "CAM-DEMO-001" for item in cameras.json())
    camera = client.get("/api/cctv/cameras/CAM-DEMO-001")
    assert camera.status_code == 200
    events = client.get("/api/cctv/events")
    assert events.status_code == 200
    event = client.post(
        "/api/cctv/events",
        json={
            "camera_id": "CAM-DEMO-001",
            "event_type": "unusual activity",
            "severity": "low",
            "confidence": 70,
            "description": "Simulated unusual stoppage. No facial recognition.",
        },
    )
    assert event.status_code == 201
    assert event.json()["isSimulated"] is True
    missing = client.get("/api/cctv/events/CCTV-MISSING")
    assert missing.status_code == 404


def test_emergency_reports():
    created = client.post(
        "/api/emergency",
        json={
            "category": "Gas Leak",
            "description": "Suspected LPG smell near bakery.",
            "severity": "high",
            "latitude": 18.51,
            "longitude": 73.86,
            "location_name": "Test bakery",
        },
    )
    assert created.status_code == 201
    report_id = created.json()["report_id"]
    listing = client.get("/api/emergency")
    assert listing.status_code == 200
    fetched = client.get(f"/api/emergency/{report_id}")
    assert fetched.status_code == 200
    patched = client.patch(
        f"/api/emergency/{report_id}/status",
        json={"status": "under_review"},
    )
    assert patched.status_code == 200
    assert patched.json()["status"] == "under_review"
    missing = client.get("/api/emergency/EMG-MISSING")
    assert missing.status_code == 404


def test_news():
    listing = client.get("/api/news")
    assert listing.status_code == 200
    assert any(item["news_id"] == "NEWS-DEMO-001" for item in listing.json())
    created = client.post(
        "/api/news",
        json={
            "title": "Ward notice",
            "summary": "Water tanker schedule updated.",
            "source": "Ward Office",
            "geographic_level": "Area",
            "priority": "routine",
            "verified": True,
        },
    )
    assert created.status_code == 201
    missing = client.get("/api/news/NEWS-MISSING")
    assert missing.status_code == 404


def test_weather_traffic_pulse_insights():
    weather = client.get("/api/weather", params={"latitude": 18.52, "longitude": 73.85})
    assert weather.status_code == 200
    assert "temperature" in weather.json()
    traffic = client.get("/api/traffic", params={"latitude": 18.52, "longitude": 73.85})
    assert traffic.status_code == 200
    assert traffic.json()["isSimulated"] is True
    pulse = client.get("/api/pulse", params={"latitude": 18.52, "longitude": 73.85})
    assert pulse.status_code == 200
    body = pulse.json()
    assert "overallScore" in body
    first = client.get("/api/pulse", params={"latitude": 18.52, "longitude": 73.85}).json()["overallScore"]
    second = client.get("/api/pulse", params={"latitude": 18.52, "longitude": 73.85}).json()["overallScore"]
    assert first == second
    insights = client.get("/api/insights", params={"latitude": 18.52, "longitude": 73.85})
    assert insights.status_code == 200
    assert "plainLanguageSummary" in insights.json()
    analyzed = client.post("/api/insights/analyze", json={"latitude": 18.52, "longitude": 73.85})
    assert analyzed.status_code == 200


def test_incident_status_lifecycle():
    created = client.post(
        "/api/incidents",
        json={
            "category": "Infrastructure Damage",
            "description": "Broken railing on pedestrian overpass.",
            "latitude": 18.51,
            "longitude": 73.84,
            "area": "Kothrud",
            "mandal": "Haveli Mandal",
            "district": "Pune District",
            "locationName": "Overpass walkway",
        },
    )
    assert created.status_code == 201
    incident_id = created.json()["id"]
    patched = client.patch(f"/api/incidents/{incident_id}/status", json={"status": "UNDER REVIEW"})
    assert patched.status_code == 200
    assert patched.json()["status"] == "UNDER REVIEW"
    alerts = client.get("/api/alerts")
    assert alerts.status_code == 200
    assert any("Infrastructure Damage" in item["title"] for item in alerts.json())


def test_pulse_and_insights_include_grounded_fields():
    pulse = client.get("/api/pulse", params={"latitude": 18.52, "longitude": 73.85}).json()
    assert pulse["contributingFactors"]
    assert "riskLevel" in pulse
    assert pulse["location"]["latitude"] == 18.52
    insights = client.get("/api/insights", params={"latitude": 18.52, "longitude": 73.85}).json()
    assert insights["insights"]
    card = insights["insights"][0]
    assert "title" in card
    assert "severity" in card
    assert "evidence" in card
    assert "explanation" in card
    assert "recommendedAction" in card


def test_weather_invalid_coords():
    res = client.get("/api/weather", params={"latitude": 999, "longitude": 0})
    assert res.status_code == 422


def test_duplicate_alerts_reuse_existing():
    payload = {
        "title": "Duplicate civic notice",
        "message": "Same advisory twice.",
        "category": "Civic",
        "priority": "low",
        "area": "Kothrud",
        "district": "Pune District",
        "latitude": 18.5074,
        "longitude": 73.8077,
    }
    first = client.post("/api/alerts", json=payload)
    second = client.post("/api/alerts", json=payload)
    assert first.status_code in {200, 201}
    assert second.status_code in {200, 201}
    assert first.json()["id"] == second.json()["id"]


def test_stream_is_event_stream():
    with client.stream("GET", "/api/stream") as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")


def test_seed_is_idempotent():
    db = SessionLocal()
    try:
        before = db.query(Incident).count()
    finally:
        db.close()
    seed_data()
    db = SessionLocal()
    try:
        after = db.query(Incident).count()
    finally:
        db.close()
    assert after == before
