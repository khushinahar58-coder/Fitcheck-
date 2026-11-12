import {
  Briefcase,
  UtensilsCrossed,
  Heart,
  Coffee,
  Sparkles,
  CloudSun,
  MoonStar,
  Wind,
  Sun,
  Moon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from 'lucide-react';

export const OCCASION_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  'utensils-crossed': UtensilsCrossed,
  heart: Heart,
  coffee: Coffee,
  sparkles: Sparkles,
};

export const WEATHER_ICONS: Record<string, LucideIcon> = {
  // Live forecast (see lib/weather.ts)
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  // Looks saved before the forecast was live
  'moon-star': MoonStar,
  wind: Wind,
  moon: Moon,
};

export function getOccasionIcon(name: string): LucideIcon {
  return OCCASION_ICONS[name] ?? Sparkles;
}

export function getWeatherIcon(name: string): LucideIcon {
  return WEATHER_ICONS[name] ?? CloudSun;
}
