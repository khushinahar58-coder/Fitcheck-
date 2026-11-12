export type Category =
  | 'Tops'
  | 'Bottoms'
  | 'Dresses'
  | 'Outerwear'
  | 'Shoes'
  | 'Accessories';

export type OccasionId = 'work' | 'dinner' | 'date' | 'casual' | 'party';

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  image: string;
  color: string;
  brand: string;
  lastWornDaysAgo: number; // Worked out from wearDates when the app reads items. 0 = today, -1 = never
  tags: string[];
  wearDates?: string[]; // ISO date strings when item was marked as worn. The source of truth
  addedAt?: string; // ISO date the piece joined the closet. Lets a never-worn piece go stale
}

export interface Occasion {
  id: OccasionId;
  label: string;
  emoji: string;
  description: string;
}

export interface OutfitSlot {
  role: string; // e.g. "Top", "Bottom", "Shoes"
  itemId: string;
}

export interface Outfit {
  id: string;
  occasionId: OccasionId;
  name: string;
  description: string;
  slots: OutfitSlot[];
  featured?: boolean;
  reasons?: string[]; // why the engine picked this look, most important first
}

export interface SavedOutfit {
  id: string;
  outfitId: string;
  occasionId: OccasionId;
  occasionLabel: string;
  name: string;
  slots: OutfitSlot[];
  weather?: WeatherInfo; // missing when no forecast was available at save time
  savedAt: number;
}

// One day of real forecast. Temperatures are stored in Celsius and converted for display.
export interface DayWeather {
  date: string; // ISO date
  code: number; // WMO weather code
  condition: string;
  icon: string;
  highC: number;
  lowC: number;
  rainChance: number; // 0-100
  windKph: number;
  stated?: boolean; // true when the user described the weather instead of a forecast
}

// The weather snapshot kept with a saved look. Temperatures are Celsius.
export interface WeatherInfo {
  condition: string;
  emoji: string;
  tempHigh: number;
  tempLow: number;
  note: string;
}

export interface CalendarEntry {
  id: string;
  savedOutfitId: string; // links to the SavedOutfit
  date: string; // ISO date string (YYYY-MM-DD)
  occasionId: OccasionId;
  occasionLabel: string;
  outfitName: string;
  slots: OutfitSlot[];
  addedAt: number;
  worn: boolean;
  wornAt?: number;
  wornOn?: string; // ISO date recorded on the pieces when this entry was marked worn
}
