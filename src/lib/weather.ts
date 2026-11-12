// Real forecasts from Open-Meteo (https://open-meteo.com): free, no key, and it allows
// requests straight from the browser. Temperatures are kept in Celsius and converted for display.

import type { DayWeather, WeatherInfo } from '../types';

export type TempUnit = 'C' | 'F';

export interface City {
  name: string;
  lat: number;
  lon: number;
}

// The team is at UVA Darden, so the app starts there. Anyone can change it on the Profile screen.
export const DEFAULT_CITY: City = { name: 'Charlottesville, Virginia', lat: 38.0293, lon: -78.4767 };

export function toUnit(celsius: number, unit: TempUnit): number {
  return Math.round(unit === 'F' ? (celsius * 9) / 5 + 32 : celsius);
}

export function formatTemp(celsius: number, unit: TempUnit, withUnit = true): string {
  return `${toUnit(celsius, unit)}°${withUnit ? unit : ''}`;
}

// WMO weather codes, as Open-Meteo returns them.
export function describeCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear', icon: 'sun' };
  if (code === 1) return { condition: 'Mostly clear', icon: 'sun' };
  if (code === 2) return { condition: 'Partly cloudy', icon: 'cloud-sun' };
  if (code === 3) return { condition: 'Overcast', icon: 'cloud' };
  if (code === 45 || code === 48) return { condition: 'Fog', icon: 'cloud-fog' };
  if (code >= 51 && code <= 57) return { condition: 'Drizzle', icon: 'cloud-drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { condition: 'Rain', icon: 'cloud-rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { condition: 'Snow', icon: 'cloud-snow' };
  if (code >= 95) return { condition: 'Thunderstorms', icon: 'cloud-lightning' };
  return { condition: 'Cloudy', icon: 'cloud' };
}

function isWet(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 71 && code <= 86) || code >= 95;
}

interface ForecastResponse {
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: Array<number | null>;
    wind_speed_10m_max?: Array<number | null>;
  };
}

export function parseForecast(json: ForecastResponse): DayWeather[] {
  const d = json.daily;
  if (!d?.time?.length) return [];
  return d.time
    .map((date, i) => {
      const code = d.weather_code[i];
      const chance = d.precipitation_probability_max?.[i];
      return {
        date,
        code,
        ...describeCode(code),
        highC: d.temperature_2m_max[i],
        lowC: d.temperature_2m_min[i],
        // Far-off days come back without a probability; fall back on what the code says.
        rainChance: chance ?? (isWet(code) ? 70 : 10),
        windKph: d.wind_speed_10m_max?.[i] ?? 0,
      };
    })
    .filter((day) => Number.isFinite(day.highC) && Number.isFinite(day.lowC));
}

type Fetch = typeof fetch;

export async function fetchForecast(city: City, fetchImpl: Fetch = fetch): Promise<DayWeather[]> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${city.lat.toFixed(3)}&longitude=${city.lon.toFixed(3)}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max' +
    '&timezone=auto&forecast_days=14';
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
  const days = parseForecast(await res.json());
  if (!days.length) throw new Error('Forecast came back empty');
  return days;
}

export async function searchCities(query: string, fetchImpl: Fetch = fetch): Promise<City[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetchImpl(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`
  );
  if (!res.ok) throw new Error(`City search failed (${res.status})`);
  const json = (await res.json()) as {
    results?: Array<{ name: string; admin1?: string; country?: string; latitude: number; longitude: number }>;
  };
  return (json.results ?? []).map((r) => ({
    name: [r.name, r.admin1 ?? r.country].filter(Boolean).join(', '),
    lat: r.latitude,
    lon: r.longitude,
  }));
}

const CACHE_KEY = 'fitcheck-forecast';
const CACHE_MS = 60 * 60 * 1000;

interface CachedForecast {
  key: string;
  at: number;
  days: DayWeather[];
}

const cityKey = (city: City) => `${city.lat.toFixed(3)},${city.lon.toFixed(3)}`;

export function readCachedForecast(city: City, now = Date.now()): { days: DayWeather[]; fresh: boolean } | null {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as CachedForecast | null;
    if (!cached || cached.key !== cityKey(city)) return null;
    return { days: cached.days, fresh: now - cached.at < CACHE_MS };
  } catch {
    return null;
  }
}

export function writeCachedForecast(city: City, days: DayWeather[], now = Date.now()): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ key: cityKey(city), at: now, days }));
  } catch {
    // A full or blocked localStorage only costs us the cache.
  }
}

// The snapshot stored with a saved look.
export function toWeatherInfo(day: DayWeather, note: string): WeatherInfo {
  return {
    condition: day.condition,
    emoji: day.icon,
    tempHigh: Math.round(day.highC),
    tempLow: Math.round(day.lowC),
    note,
  };
}

// Weather the user described in words ("rainy", "freezing") rather than a forecast.
export function statedWeather(date: string, kind: 'rain' | 'cold' | 'hot' | 'mild' | 'snow', base?: DayWeather | null): DayWeather {
  const presets = {
    rain: { code: 63, highC: base?.highC ?? 14, lowC: base?.lowC ?? 9, rainChance: 90 },
    snow: { code: 73, highC: -1, lowC: -6, rainChance: 80 },
    cold: { code: base?.code ?? 3, highC: 4, lowC: -2, rainChance: base?.rainChance ?? 10 },
    hot: { code: base?.code ?? 0, highC: 31, lowC: 22, rainChance: base?.rainChance ?? 5 },
    mild: { code: base?.code ?? 1, highC: 21, lowC: 14, rainChance: base?.rainChance ?? 5 },
  }[kind];
  return { date, windKph: base?.windKph ?? 8, ...describeCode(presets.code), ...presets, stated: true };
}
