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
  'cloud-sun': CloudSun,
  'moon-star': MoonStar,
  wind: Wind,
  sun: Sun,
  moon: Moon,
};

export function getOccasionIcon(name: string): LucideIcon {
  return OCCASION_ICONS[name] ?? Sparkles;
}

export function getWeatherIcon(name: string): LucideIcon {
  return WEATHER_ICONS[name] ?? CloudSun;
}
