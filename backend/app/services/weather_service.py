from __future__ import annotations

import logging
from datetime import datetime
from app.utils.clock import utc_now

import httpx

from app.config import settings

logger = logging.getLogger("citypulse.weather")


def _weather_description(code: int) -> str:
    if code == 0:
        return "Clear sky"
    if code in {1, 2}:
        return "Partly cloudy"
    if code == 3:
        return "Overcast"
    if code in {45, 48}:
        return "Foggy"
    if 51 <= code <= 55:
        return "Light drizzle"
    if 61 <= code <= 65:
        return "Heavy rain"
    if 80 <= code <= 82:
        return "Rain showers"
    if code >= 95:
        return "Thunderstorm"
    return "Partly cloudy"


def _advisory(code: int, precip: float, temp: float) -> dict:
    if code >= 60 or precip > 2:
        return {
            "title": "Heavy rain advisory",
            "impactText": "Low-lying underpasses risk water accumulation.",
            "duration": "2–3 hours",
            "severity": "high",
        }
    if code >= 51 or code == 80:
        return {
            "title": "Localized showers advisory",
            "impactText": "Intermittent rain may cause slippery roads and slow traffic.",
            "duration": "Next 4 hours",
            "severity": "medium",
        }
    if temp > 38:
        return {
            "title": "High heat index notice",
            "impactText": "Stay hydrated and avoid prolonged outdoor exposure.",
            "duration": "Until 17:00",
            "severity": "medium",
        }
    return {
        "title": "Normal civic conditions",
        "impactText": "No weather-induced disruptions expected in the next 6 hours.",
        "duration": "Clear outlook",
        "severity": "normal",
    }


def fallback_weather() -> dict:
    temp = 28
    return {
        "temperature": temp,
        "feels_like": 30,
        "humidity": 72,
        "precipitation": 2.5,
        "precipitation_probability": 45,
        "wind_speed": 14,
        "condition": "Partly cloudy",
        "conditionCode": 2,
        "temperatureC": temp,
        "feelsLikeC": 30,
        "conditionText": "Partly cloudy",
        "humidityPercent": 72,
        "windSpeedKmh": 14,
        "precipitationMm": 2.5,
        "uvIndex": 4,
        "isFallback": True,
        "civicAdvisory": _advisory(2, 2.5, temp),
        "hourlyForecast": [
            {"time": "Now", "temp": temp, "pop": 45, "condition": "Partly cloudy"},
            {"time": "+1h", "temp": temp + 1, "pop": 60, "condition": "Heavy rain"},
            {"time": "+2h", "temp": temp, "pop": 40, "condition": "Showers"},
        ],
        "dailyForecast": [
            {
                "day": "Today",
                "minTemp": 23,
                "maxTemp": 31,
                "condition": "Partly cloudy",
                "rainfallProb": 45,
            }
        ],
        "forecast": [],
        "updatedAt": utc_now().isoformat(),
    }


def fetch_weather(latitude: float, longitude: float) -> dict:
    url = f"{settings.open_meteo_base_url.rstrip('/')}/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        "hourly": "temperature_2m,precipitation_probability,weather_code",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "timezone": "auto",
        "forecast_days": 7,
    }
    try:
        with httpx.Client(timeout=6.0) as client:
            response = client.get(url, params=params)
        if response.status_code >= 400:
            logger.warning("Open-Meteo HTTP %s", response.status_code)
            return fallback_weather()
        data = response.json()
        current = data.get("current") or {}
        code = int(current.get("weather_code") or 0)
        temp = round(current.get("temperature_2m") or 28)
        precip = float(current.get("precipitation") or 0)
        humidity = round(current.get("relative_humidity_2m") or 65)
        wind = round(current.get("wind_speed_10m") or 12)
        feels = round(current.get("apparent_temperature") or temp)
        condition = _weather_description(code)

        hourly = []
        times = data.get("hourly", {}).get("time") or []
        temps = data.get("hourly", {}).get("temperature_2m") or []
        pops = data.get("hourly", {}).get("precipitation_probability") or []
        codes = data.get("hourly", {}).get("weather_code") or []
        now_prefix = datetime.now().isoformat()[:13]
        start = 0
        for idx, stamp in enumerate(times):
            if str(stamp).startswith(now_prefix):
                start = idx
                break
        for i in range(start, min(start + 6, len(times))):
            stamp = datetime.fromisoformat(str(times[i]))
            hourly.append(
                {
                    "time": stamp.strftime("%H:%M"),
                    "temp": round(temps[i] if i < len(temps) else temp),
                    "pop": pops[i] if i < len(pops) else 0,
                    "condition": _weather_description(int(codes[i] if i < len(codes) else code)),
                }
            )

        daily = []
        days = data.get("daily", {}).get("time") or []
        max_t = data.get("daily", {}).get("temperature_2m_max") or []
        min_t = data.get("daily", {}).get("temperature_2m_min") or []
        rain_p = data.get("daily", {}).get("precipitation_probability_max") or []
        d_codes = data.get("daily", {}).get("weather_code") or []
        for i in range(min(5, len(days))):
            day = datetime.fromisoformat(str(days[i]))
            daily.append(
                {
                    "day": "Today" if i == 0 else day.strftime("%a"),
                    "minTemp": round(min_t[i] if i < len(min_t) else temp - 4),
                    "maxTemp": round(max_t[i] if i < len(max_t) else temp + 3),
                    "condition": _weather_description(int(d_codes[i] if i < len(d_codes) else code)),
                    "rainfallProb": rain_p[i] if i < len(rain_p) else 0,
                }
            )

        pop = hourly[0]["pop"] if hourly else 0
        return {
            "temperature": temp,
            "feels_like": feels,
            "humidity": humidity,
            "precipitation": precip,
            "precipitation_probability": pop,
            "wind_speed": wind,
            "condition": condition,
            "conditionCode": code,
            "temperatureC": temp,
            "feelsLikeC": feels,
            "conditionText": condition,
            "humidityPercent": humidity,
            "windSpeedKmh": wind,
            "precipitationMm": precip,
            "uvIndex": 4,
            "isFallback": False,
            "civicAdvisory": _advisory(code, precip, temp),
            "hourlyForecast": hourly,
            "dailyForecast": daily,
            "forecast": daily,
            "updatedAt": utc_now().isoformat(),
        }
    except Exception as exc:
        logger.warning("Weather fetch failed: %s", exc)
        return fallback_weather()
