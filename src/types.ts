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
  lastWornDaysAgo: number; // 0 = today, -1 = never
  tags: string[];
  wearDates?: string[]; // ISO date strings when item was marked as worn
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
}

export interface SavedOutfit {
  id: string;
  outfitId: string;
  occasionId: OccasionId;
  occasionLabel: string;
  name: string;
  slots: OutfitSlot[];
  weather: WeatherInfo;
  savedAt: number;
}

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
}
