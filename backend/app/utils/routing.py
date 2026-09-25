from __future__ import annotations


def simulated_authority_routing(category: str) -> dict:
    department = "Municipal Rapid Response"
    if category in {"Fire / Smoke", "Gas Leak"}:
        department = "Fire & Emergency Services"
    elif category in {"Major Road Accident", "Road Blockage"}:
        department = "Traffic Police"
    elif category in {"Flood", "Heavy Rain"}:
        department = "Municipal Drainage & Stormwater Cell"
    elif category == "Infrastructure Damage":
        department = "Municipal Electrical & Works Cell"

    return {
        "department": department,
        "routingStatus": "simulated",
        "assignedUnit": "Simulated Duty Officer #104",
        "etaMinutes": 12,
        "isSimulated": True,
        "actionGuidance": (
            "Authority routing is simulated for the hackathon MVP. "
            "This is not a live municipal dispatch. Call 112 for life-threatening emergencies."
        ),
    }
