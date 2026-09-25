import type { SeverityLevel, WeatherConditionData } from '../types/civic';
import { getApiBaseUrl } from './apiClient';

export async function fetchLiveWeatherData(
  lat: number,
  lng: number
): Promise<WeatherConditionData> {
  const apiBase = getApiBaseUrl();
  try {
    const backendRes = await fetch(
      `${apiBase}/api/weather?latitude=${lat}&longitude=${lng}`
    );
    if (backendRes.ok) {
      const data = await backendRes.json();
      return {
        temperatureC: data.temperatureC ?? data.temperature ?? 28,
        feelsLikeC: data.feelsLikeC ?? data.feels_like ?? 28,
        conditionText: data.conditionText ?? data.condition ?? 'Partly cloudy',
        conditionCode: data.conditionCode ?? 2,
        humidityPercent: data.humidityPercent ?? data.humidity ?? 65,
        windSpeedKmh: data.windSpeedKmh ?? data.wind_speed ?? 12,
        precipitationMm: data.precipitationMm ?? data.precipitation ?? 0,
        uvIndex: data.uvIndex ?? 4,
        civicAdvisory: data.civicAdvisory ?? {
          title: 'Normal civic conditions',
          impactText: 'No weather-induced disruptions expected.',
          duration: 'Clear outlook',
          severity: 'normal',
        },
        hourlyForecast: data.hourlyForecast?.length ? data.hourlyForecast : getFallbackHourly(28),
        dailyForecast: data.dailyForecast?.length ? data.dailyForecast : getFallbackDaily(28),
      };
    }
  } catch {
    // Fall through to the existing Open-Meteo client implementation.
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Weather API error status: ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const code = current.weather_code ?? 0;
    const conditionText = getWeatherDescription(code);
    const temp = Math.round(current.temperature_2m ?? 28);
    const precip = current.precipitation ?? 0;

    // Build civic advisory based on actual weather signals
    let advisory: {
      title: string;
      impactText: string;
      duration: string;
      severity: SeverityLevel;
    } = {
      title: 'Normal civic conditions',
      impactText: 'No weather-induced disruptions expected in the next 6 hours.',
      duration: 'Clear outlook',
      severity: 'normal',
    };


    if (code >= 60 || precip > 2) {
      advisory = {
        title: 'Heavy rain advisory',
        impactText: `${precip > 5 ? precip + ' mm' : '35–45 mm'} precipitation expected · Low-lying underpasses risk water accumulation.`,
        duration: '2–3 hours',
        severity: 'high' as const,
      };
    } else if (code >= 51 || code === 80) {
      advisory = {
        title: 'Localized showers advisory',
        impactText: 'Intermittent rain showers may cause slippery road conditions and minor traffic slow-down.',
        duration: 'Next 4 hours',
        severity: 'medium' as const,
      };
    } else if (temp > 38) {
      advisory = {
        title: 'High heat index notice',
        impactText: 'Surface temperatures elevated. Stay hydrated and avoid prolonged outdoor exposure.',
        duration: 'Until 17:00',
        severity: 'medium' as const,
      };
    }

    // Parse hourly forecast (next 6 intervals)
    const hourly = [];
    const hourlyTimes = data.hourly?.time || [];
    const hourlyTemps = data.hourly?.temperature_2m || [];
    const hourlyPops = data.hourly?.precipitation_probability || [];
    const hourlyCodes = data.hourly?.weather_code || [];

    const nowIso = new Date().toISOString().slice(0, 13);
    let startIndex = hourlyTimes.findIndex((t: string) => t.startsWith(nowIso));
    if (startIndex < 0) startIndex = 0;

    for (let i = startIndex; i < Math.min(startIndex + 6, hourlyTimes.length); i++) {
      const timeStr = hourlyTimes[i] ? new Date(hourlyTimes[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `${i}:00`;
      hourly.push({
        time: timeStr,
        temp: Math.round(hourlyTemps[i] ?? temp),
        pop: hourlyPops[i] ?? 0,
        condition: getWeatherDescription(hourlyCodes[i] ?? 0),
      });
    }

    // Parse daily forecast
    const daily = [];
    const dailyDays = data.daily?.time || [];
    const dailyMax = data.daily?.temperature_2m_max || [];
    const dailyMin = data.daily?.temperature_2m_min || [];
    const dailyPops = data.daily?.precipitation_probability_max || [];
    const dailyCodes = data.daily?.weather_code || [];

    for (let i = 0; i < Math.min(5, dailyDays.length); i++) {
      const d = new Date(dailyDays[i]);
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString([], { weekday: 'short' });
      daily.push({
        day: dayName,
        minTemp: Math.round(dailyMin[i] ?? 22),
        maxTemp: Math.round(dailyMax[i] ?? 30),
        condition: getWeatherDescription(dailyCodes[i] ?? 0),
        rainfallProb: dailyPops[i] ?? 0,
      });
    }

    return {
      temperatureC: temp,
      feelsLikeC: Math.round(current.apparent_temperature ?? temp),
      conditionText,
      conditionCode: code,
      humidityPercent: Math.round(current.relative_humidity_2m ?? 65),
      windSpeedKmh: Math.round(current.wind_speed_10m ?? 12),
      precipitationMm: precip,
      uvIndex: 4,
      civicAdvisory: advisory,
      hourlyForecast: hourly.length > 0 ? hourly : getFallbackHourly(temp),
      dailyForecast: daily.length > 0 ? daily : getFallbackDaily(temp),
    };
  } catch {
    clearTimeout(timeoutId);
    return getFallbackWeatherData();
  }
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Light drizzle';
  if (code >= 61 && code <= 65) return 'Heavy rain';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Partly cloudy';
}

function getFallbackHourly(baseTemp: number) {
  return [
    { time: 'Now', temp: baseTemp, pop: 45, condition: 'Partly cloudy' },
    { time: '+1h', temp: baseTemp + 1, pop: 60, condition: 'Heavy rain' },
    { time: '+2h', temp: baseTemp, pop: 70, condition: 'Heavy rain' },
    { time: '+3h', temp: baseTemp - 1, pop: 35, condition: 'Showers' },
    { time: '+4h', temp: baseTemp - 2, pop: 20, condition: 'Cloudy' },
    { time: '+5h', temp: baseTemp - 2, pop: 10, condition: 'Clear' },
  ];
}

function getFallbackDaily(baseTemp: number) {
  return [
    { day: 'Today', minTemp: baseTemp - 5, maxTemp: baseTemp + 3, condition: 'Heavy rain', rainfallProb: 75 },
    { day: 'Tomorrow', minTemp: baseTemp - 4, maxTemp: baseTemp + 2, condition: 'Showers', rainfallProb: 40 },
    { day: 'Wed', minTemp: baseTemp - 3, maxTemp: baseTemp + 4, condition: 'Partly cloudy', rainfallProb: 15 },
    { day: 'Thu', minTemp: baseTemp - 2, maxTemp: baseTemp + 5, condition: 'Sunny', rainfallProb: 5 },
    { day: 'Fri', minTemp: baseTemp - 2, maxTemp: baseTemp + 4, condition: 'Clear sky', rainfallProb: 10 },
  ];
}

export function getFallbackWeatherData(): WeatherConditionData {
  return {
    temperatureC: 28,
    feelsLikeC: 30,
    conditionText: 'Partly cloudy',
    conditionCode: 2,
    humidityPercent: 72,
    windSpeedKmh: 14,
    precipitationMm: 12.5,
    uvIndex: 4,
    civicAdvisory: {
      title: 'Heavy rain advisory',
      impactText: '45 mm expected · 2 hours · Waterlogging possible at low underpasses',
      duration: '2 hours',
      severity: 'high',
    },
    hourlyForecast: getFallbackHourly(28),
    dailyForecast: getFallbackDaily(28),
  };
}
