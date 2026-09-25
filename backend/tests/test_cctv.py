from tests.conftest import client


def test_create_demo_camera():
    res = client.post(
        "/api/cctv/cameras",
        json={
            "camera_id": "CAM-TEST-DEMO",
            "name": "Hackathon Demo Cam",
            "latitude": 18.52,
            "longitude": 73.85,
            "location_name": "Test Junction",
            "area": "Kothrud",
            "mandal": "Haveli Mandal",
            "district": "Pune District",
            "stream_type": "demo",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["camera_id"] == "CAM-TEST-DEMO"
    assert body["stream_type"] == "demo"
    assert body["status"] == "demo"
    assert body["stream_url"] is None
    assert body["isSimulated"] is True
    assert body["coords"]["lat"] == 18.52


def test_create_rtsp_camera():
    res = client.post(
        "/api/cctv/cameras",
        json={
            "camera_id": "CAM-TEST-RTSP",
            "name": "Area RTSP Cam",
            "latitude": 18.53,
            "longitude": 73.86,
            "stream_type": "rtsp",
            "stream_url": "rtsp://user:secret-pass@203.0.113.10:554/Streaming/Channels/101",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["stream_type"] == "rtsp"
    assert body["status"] == "offline"
    assert body["isSimulated"] is False
    assert body["stream_url"] is not None
    assert "secret-pass" not in body["stream_url"]
    assert "user:" not in body["stream_url"]
    assert "203.0.113.10" in body["stream_url"]


def test_reject_invalid_coordinates():
    res = client.post(
        "/api/cctv/cameras",
        json={
            "name": "Bad coords",
            "latitude": 200,
            "longitude": 10,
            "stream_type": "demo",
        },
    )
    assert res.status_code == 422


def test_reject_rtsp_camera_without_stream_url():
    res = client.post(
        "/api/cctv/cameras",
        json={
            "name": "Missing stream",
            "latitude": 18.52,
            "longitude": 73.85,
            "stream_type": "rtsp",
        },
    )
    assert res.status_code == 422


def test_retrieve_camera():
    res = client.get("/api/cctv/cameras/CAM-DEMO-001")
    assert res.status_code == 200
    body = res.json()
    assert body["camera_id"] == "CAM-DEMO-001"
    assert body["stream_type"] == "demo"
    assert body["status"] == "demo"
    assert "latestEvent" in body
    assert body["location_name"]


def test_update_camera():
    created = client.post(
        "/api/cctv/cameras",
        json={
            "camera_id": "CAM-TEST-PATCH",
            "name": "Before update",
            "latitude": 18.51,
            "longitude": 73.84,
            "stream_type": "demo",
        },
    )
    assert created.status_code == 201
    patched = client.patch(
        "/api/cctv/cameras/CAM-TEST-PATCH",
        json={"name": "After update", "area": "Deccan"},
    )
    assert patched.status_code == 200
    assert patched.json()["name"] == "After update"
    assert patched.json()["area"] == "Deccan"


def test_demo_connect():
    res = client.post("/api/cctv/cameras/CAM-DEMO-001/connect")
    assert res.status_code == 200
    body = res.json()
    assert body["camera_id"] == "CAM-DEMO-001"
    assert body["stream_type"] == "demo"
    assert body["status"] == "demo"
    assert body["connected"] is True
    assert body["last_error"] is None


def test_disconnect():
    client.post("/api/cctv/cameras/CAM-DEMO-002/connect")
    res = client.post("/api/cctv/cameras/CAM-DEMO-002/disconnect")
    assert res.status_code == 200
    body = res.json()
    assert body["connected"] is False
    fetched = client.get("/api/cctv/cameras/CAM-DEMO-002")
    assert fetched.status_code == 200
    assert fetched.json()["is_enabled"] is False


def test_camera_status():
    res = client.get("/api/cctv/cameras/CAM-DEMO-001/status")
    assert res.status_code == 200
    body = res.json()
    assert body["camera_id"] == "CAM-DEMO-001"
    assert "status" in body
    assert "stream_type" in body
    assert "last_seen" in body
    assert "last_error" in body


def test_event_retrieval():
    listing = client.get("/api/cctv/events")
    assert listing.status_code == 200
    assert any(item["event_id"] == "CCTV-DEMO-001" for item in listing.json())
    one = client.get("/api/cctv/events/CCTV-DEMO-001")
    assert one.status_code == 200
    assert one.json()["camera_id"] == "CAM-DEMO-001"
    filtered = client.get("/api/cctv/events", params={"camera_id": "CAM-DEMO-001"})
    assert filtered.status_code == 200
    assert all(item["camera_id"] == "CAM-DEMO-001" for item in filtered.json())


def test_rtsp_connect_does_not_claim_live_without_source():
    created = client.post(
        "/api/cctv/cameras",
        json={
            "camera_id": "CAM-TEST-DEAD",
            "name": "Unreachable RTSP",
            "latitude": 18.5,
            "longitude": 73.8,
            "stream_type": "rtsp",
            "stream_url": "rtsp://127.0.0.1:1/no-camera",
        },
    )
    assert created.status_code == 201
    assert created.json()["status"] != "online"
    connected = client.post("/api/cctv/cameras/CAM-TEST-DEAD/connect")
    assert connected.status_code == 200
    body = connected.json()
    assert body["status"] == "offline"
    assert body["connected"] is False
    assert body["last_error"]


def test_delete_camera():
    created = client.post(
        "/api/cctv/cameras",
        json={
            "camera_id": "CAM-TEST-DEL",
            "name": "Temporary camera",
            "latitude": 18.5,
            "longitude": 73.8,
            "stream_type": "demo",
        },
    )
    assert created.status_code == 201
    deleted = client.delete("/api/cctv/cameras/CAM-TEST-DEL")
    assert deleted.status_code == 200
    missing = client.get("/api/cctv/cameras/CAM-TEST-DEL")
    assert missing.status_code == 404
