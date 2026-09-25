from __future__ import annotations

import logging

import httpx

from app.config import settings
from app.utils.geo import haversine_km, valid_coordinates

logger = logging.getLogger("citypulse.location")

LOCATION_PRESETS = [
    {
        "area": "Pune Central (FC Road & Shivajinagar)",
        "mandal": "Haveli Mandal",
        "district": "Pune District",
        "state": "Maharashtra",
        "country": "India",
        "display_name": "Shivajinagar, Haveli, Pune, Maharashtra",
        "latitude": 18.5204,
        "longitude": 73.8567,
    },
    {
        "area": "Kothrud & Karve Road",
        "mandal": "Haveli Mandal",
        "district": "Pune District",
        "state": "Maharashtra",
        "country": "India",
        "display_name": "Kothrud, Haveli, Pune, Maharashtra",
        "latitude": 18.5074,
        "longitude": 73.8077,
    },
    {
        "area": "Madhapur & HITEC City",
        "mandal": "Serilingampally Mandal",
        "district": "Hyderabad District",
        "state": "Telangana",
        "country": "India",
        "display_name": "HITEC City, Serilingampally, Hyderabad, Telangana",
        "latitude": 17.4474,
        "longitude": 78.3762,
    },
    {
        "area": "Connaught Place & Barakhamba",
        "mandal": "Chanakyapuri Mandal",
        "district": "New Delhi District",
        "state": "Delhi",
        "country": "India",
        "display_name": "Connaught Place, New Delhi, Delhi",
        "latitude": 28.6315,
        "longitude": 77.2167,
    },
]


def _fallback_location(latitude: float, longitude: float) -> dict:
    closest = LOCATION_PRESETS[0]
    best = haversine_km(latitude, longitude, closest["latitude"], closest["longitude"])
    for preset in LOCATION_PRESETS[1:]:
        dist = haversine_km(latitude, longitude, preset["latitude"], preset["longitude"])
        if dist < best:
            closest = preset
            best = dist

    if best < 15:
        return {
            **closest,
            "latitude": latitude,
            "longitude": longitude,
            "isFallback": True,
        }

    return {
        "area": f"Locality ({latitude:.3f}N, {longitude:.3f}E)",
        "mandal": closest["mandal"],
        "district": closest["district"],
        "state": closest["state"],
        "country": closest["country"],
        "display_name": f"Civic Sector at {latitude:.4f}, {longitude:.4f}",
        "latitude": latitude,
        "longitude": longitude,
        "isFallback": True,
    }


def resolve_location(latitude: float, longitude: float) -> dict:
    if not valid_coordinates(latitude, longitude):
        raise ValueError("Invalid coordinates")

    url = f"{settings.nominatim_base_url.rstrip('/')}/reverse"
    params = {
        "format": "json",
        "lat": latitude,
        "lon": longitude,
        "zoom": 18,
        "addressdetails": 1,
    }
    headers = {
        "User-Agent": "CityPulse-CivicPlatform/1.0 (hackathon)",
        "Accept-Language": "en",
    }

    try:
        with httpx.Client(timeout=6.0) as client:
            response = client.get(url, params=params, headers=headers)
        if response.status_code == 429:
            logger.warning("Nominatim rate limited")
            return _fallback_location(latitude, longitude)
        if response.status_code >= 400:
            logger.warning("Nominatim HTTP %s", response.status_code)
            return _fallback_location(latitude, longitude)

        payload = response.json()
        addr = payload.get("address") or {}
        area = (
            addr.get("suburb")
            or addr.get("neighbourhood")
            or addr.get("residential")
            or addr.get("quarter")
            or addr.get("commercial")
            or addr.get("road")
            or f"Sector near ({latitude:.3f}, {longitude:.3f})"
        )
        mandal = (
            addr.get("county")
            or addr.get("municipality")
            or addr.get("subdistrict")
            or addr.get("borough")
            or "Central Mandal"
        )
        district = (
            addr.get("state_district")
            or addr.get("city")
            or addr.get("district")
            or addr.get("town")
            or "Civic District"
        )
        state = addr.get("state") or "Local State"
        country = addr.get("country") or "Unknown"
        display_name = payload.get("display_name") or f"{area}, {mandal}, {district}"
        return {
            "area": area,
            "mandal": mandal,
            "district": district,
            "state": state,
            "country": country,
            "display_name": display_name,
            "latitude": latitude,
            "longitude": longitude,
            "isFallback": False,
        }
    except (httpx.TimeoutException, httpx.RequestError) as exc:
        logger.warning("Nominatim unavailable: %s", exc)
        return _fallback_location(latitude, longitude)
    except Exception as exc:
        logger.warning("Nominatim parse failure: %s", exc)
        return _fallback_location(latitude, longitude)
