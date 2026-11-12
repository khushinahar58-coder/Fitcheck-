// Things most screens need: who is using the app, their units, and the forecast.
// Kept in one context so screens do not pass them down by hand.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { DayWeather } from '../types';
import type { AppSettings, Profile } from './profiles';
import { fetchForecast, forecastFor, formatTemp, readCachedForecast, writeCachedForecast, type City } from './weather';

export type ForecastStatus = 'loading' | 'ready' | 'unavailable';

export interface AppContextValue {
  profile: Profile;
  settings: AppSettings;
  forecast: DayWeather[];
  forecastStatus: ForecastStatus;
  weatherFor: (dateISO: string) => DayWeather | null;
  fmt: (celsius: number) => string; // "54°F"
  fmtShort: (celsius: number) => string; // "54°"
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = AppContext.Provider;

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

// The forecast for a city: what was cached is shown at once, then refreshed if it is over an hour old.
export function useForecast(city: City): { forecast: DayWeather[]; status: ForecastStatus } {
  const [state, setState] = useState<{ forecast: DayWeather[]; status: ForecastStatus }>(() => {
    const cached = readCachedForecast(city);
    return cached ? { forecast: cached.days, status: 'ready' } : { forecast: [], status: 'loading' };
  });

  useEffect(() => {
    let cancelled = false;
    const cached = readCachedForecast(city);
    if (cached) setState({ forecast: cached.days, status: 'ready' });
    else setState({ forecast: [], status: 'loading' });
    if (cached?.fresh) return;

    fetchForecast(city)
      .then((days) => {
        if (cancelled) return;
        writeCachedForecast(city, days);
        setState({ forecast: days, status: 'ready' });
      })
      .catch(() => {
        // Offline or the service is down. Keep an older forecast if there is one.
        if (!cancelled) setState((prev) => (prev.forecast.length ? prev : { forecast: [], status: 'unavailable' }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the coordinates identify the city
  }, [city.lat, city.lon]);

  return state;
}

export function useAppValue(profile: Profile, settings: AppSettings): AppContextValue {
  const { forecast, status } = useForecast(settings.city);
  const weatherFor = useCallback((dateISO: string) => forecastFor(forecast, dateISO), [forecast]);
  const fmt = useCallback((celsius: number) => formatTemp(celsius, settings.unit), [settings.unit]);
  const fmtShort = useCallback((celsius: number) => formatTemp(celsius, settings.unit, false), [settings.unit]);
  return { profile, settings, forecast, forecastStatus: status, weatherFor, fmt, fmtShort };
}
