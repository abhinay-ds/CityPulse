from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


SUPPORTED_EVENT_TYPES = (
    "accident",
    "fire",
    "smoke",
    "flood",
    "crowd",
    "road_blockage",
    "infrastructure_damage",
    "other",
)

EVENT_TO_INCIDENT_CATEGORY = {
    "accident": "Major Road Accident",
    "fire": "Fire / Smoke",
    "smoke": "Fire / Smoke",
    "flood": "Flood",
    "crowd": "Other Emergency",
    "road_blockage": "Road Blockage",
    "infrastructure_damage": "Infrastructure Damage",
    "other": "Other Emergency",
}


@dataclass(frozen=True)
class Detection:
    event_type: str
    confidence: float
    severity: str = "medium"
    description: str | None = None


class CctvDetector(Protocol):
    """Computer-vision interface for a future real detector.

    Implementations must only return detections actually produced from a frame.
    They must not invent events from real camera footage.
    """

    def detect(self, frame) -> list[Detection]:
        ...


class NullCctvDetector:
    """Placeholder detector used until a real CV model is wired in."""

    def detect(self, frame) -> list[Detection]:
        return []


def normalize_event_type(event_type: str) -> str:
    key = (event_type or "other").strip().lower().replace(" ", "_").replace("-", "_")
    aliases = {
        "vehicle_collision": "accident",
        "collision": "accident",
        "unusual_activity": "other",
        "traffic_congestion": "crowd",
        "flooding": "flood",
        "flooding_water_accumulation": "flood",
        "water_accumulation": "flood",
    }
    mapped = aliases.get(key, key)
    return mapped if mapped in SUPPORTED_EVENT_TYPES else "other"
