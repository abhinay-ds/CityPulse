import React from 'react';
import {
  CloudRain,
  Wind,
  Droplets,
  Sun,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useLocation } from '../../context/LocationContext';
import { Badge } from '../common/Badge';

export const WeatherView: React.FC = () => {
  const { weather, isLoadingWeather } = useCivicData();
  const { location } = useLocation();

  if (isLoadingWeather || !weather) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Synchronizing meteorological telemetry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
            METEOROLOGICAL SENSOR GRID
          </span>
          <Badge variant="blue" size="sm">
            Live Open-Meteo Telemetry
          </Badge>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Weather & Civic Impact
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Hyperlocal atmospheric conditions and urban impact advisories for {location.area}.
        </p>
      </div>

      {/* Main Temperature & Conditions Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-44 h-44 bg-orange-500/10 rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location.area}</span>
              <span className="text-slate-400">·</span>
              <span>{location.mandal}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-6xl sm:text-7xl font-black tracking-tighter">
                {weather.temperatureC}°
              </span>
              <span className="text-xl sm:text-2xl text-slate-300 font-medium">C</span>
            </div>
            <p className="text-lg text-slate-200 font-semibold mt-1">
              {weather.conditionText}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Feels like {weather.feelsLikeC}°C · Updated continuous cycle
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-64">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Humidity</span>
              </div>
              <div className="text-lg font-bold">{weather.humidityPercent}%</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span>Wind</span>
              </div>
              <div className="text-lg font-bold">{weather.windSpeedKmh} km/h</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                <span>Rainfall</span>
              </div>
              <div className="text-lg font-bold">{weather.precipitationMm} mm</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>UV Index</span>
              </div>
              <div className="text-lg font-bold">{weather.uvIndex} Moderate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Civic Impact Advisory Box */}
      <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-amber-950">
                Civic Impact: {weather.civicAdvisory.title}
              </h3>
              <Badge variant="amber" size="sm">
                {weather.civicAdvisory.duration}
              </Badge>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              {weather.civicAdvisory.impactText}
            </p>
            <div className="mt-2 text-[11px] text-amber-800/80 flex items-center gap-1 font-medium">
              <span>Low-lying underpass alert status: Active monitoring by Ward Engineering</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            HOURLY CIVIC PRECIPITATION OUTLOOK
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Next 6 Hours</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {weather.hourlyForecast.map((hour, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center flex flex-col items-center"
            >
              <span className="text-[11px] font-semibold text-slate-500 mb-1">{hour.time}</span>
              <CloudRain className="w-5 h-5 text-blue-500 my-1" />
              <span className="text-sm font-bold text-slate-900">{hour.temp}°</span>
              <span className="text-[10px] font-bold text-sky-600 mt-1">
                {hour.pop}% rain
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5-Day Outlook */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
          5-DAY WEATHER PROFILE
        </span>

        <div className="space-y-2.5">
          {weather.dailyForecast.map((day, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 w-20">{day.day}</span>
              <span className="text-xs text-slate-600 flex-1 truncate px-2">
                {day.condition}
              </span>
              <span className="text-xs text-sky-600 font-bold px-3">
                {day.rainfallProb}% rain
              </span>
              <div className="text-xs font-bold text-slate-900 text-right w-24">
                <span>{day.minTemp}°</span>
                <span className="text-slate-400 mx-1">/</span>
                <span>{day.maxTemp}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
