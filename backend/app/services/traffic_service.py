from __future__ import annotations

from app.utils.clock import utc_now

from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.utils.geo import haversine_km


ROADS = [
    ("Main Arterial / Junction Road", 0.0, 0.0),
    ("Underpass Approach", 0.0035, 0.0028),
    ("Park Avenue Corridor", 0.011, -0.0075),
    ("Market Ring Road", -0.0082, 0.0064),
    ("Residential Feeder", 0.006, -0.004),
]


def get_traffic(db: Session, latitude: float, longitude: float) -> dict:
    incidents = db.query(Incident).filter(Incident.status != "RESOLVED").all()
    segments = []
    for index, (road, dlat, dlng) in enumerate(ROADS):
        lat = latitude + dlat
        lng = longitude + dlng
        related = None
        congestion = 22 + (index * 9)
        delay = 4 + index * 3

        for incident in incidents:
            distance = haversine_km(lat, lng, incident.latitude, incident.longitude)
            if distance <= 1.5 and incident.category in {
                "Major Road Accident",
                "Road Blockage",
                "Heavy Rain",
                "Flood",
            }:
                related = incident.incident_id
                congestion = min(95, congestion + 28)
                delay += 12
                break

        congestion = min(95, congestion)
        level = "low"
        if congestion >= 75:
            level = "severe"
        elif congestion >= 55:
            level = "high"
        elif congestion >= 35:
            level = "moderate"

        segments.append(
            {
                "road": road,
                "latitude": round(lat, 5),
                "longitude": round(lng, 5),
                "congestion": congestion,
                "congestionLevel": level,
                "estimated_delay": delay,
                "related_incident": related,
                "isSimulated": True,
            }
        )

    return {
        "isSimulated": True,
        "provider": "citypulse-simulated-traffic",
        "updatedAt": utc_now().isoformat(),
        "segments": segments,
        "note": "No live traffic provider is configured. Values are simulated from civic incidents.",
    }
