// Profiles: each person on a device gets a separate closet, saved looks and calendar.
// There is still no server or sign-in. Everything lives in this browser's localStorage,
// and the settings screen can erase it.

import type { ClothingItem } from '../types';
import { CLOTHING_ITEMS, SECOND_CLOSET_ITEMS } from '../data';
import { DEFAULT_CITY, type City, type TempUnit } from './weather';

export type HairStyle = 'none' | 'short' | 'medium' | 'long' | 'bun';
export type Build = 'slim' | 'regular' | 'broad' | 'curvy';

export interface AvatarConfig {
  skin: string; // hex
  hair: HairStyle;
  hairColor: string; // hex
  build: Build;
  beard: boolean;
}

// A plain dress-form figure. Nobody's looks are guessed; each person sets their own.
export const DEFAULT_AVATAR: AvatarConfig = {
  skin: '#D9C7B4',
  hair: 'none',
  hairColor: '#2D2722',
  build: 'regular',
  beard: false,
};

export const SKIN_TONES = ['#D9C7B4', '#F3D9C4', '#E6B998', '#C68E63', '#9A6440', '#5E3B26'];
export const HAIR_COLORS = ['#1E1A16', '#4A3323', '#8A5A33', '#C9A26B', '#A33B2A', '#9A9A9A'];

export type Starter = 'first' | 'second' | 'empty';

export interface Profile {
  id: string;
  name: string;
  tagline: string;
  starter: Starter;
  avatar: AvatarConfig;
}

export interface ProfileState {
  activeId: string;
  profiles: Profile[];
}

export interface AppSettings {
  unit: TempUnit;
  city: City;
}

// The first profile keeps the storage keys the app has always used, so closets saved
// before profiles existed are still there.
export const FIRST_PROFILE_ID = 'khushi';

export const DEFAULT_PROFILES: Profile[] = [
  {
    id: FIRST_PROFILE_ID,
    name: 'Khushi',
    tagline: 'Working professional · Fashion lover',
    starter: 'first',
    avatar: DEFAULT_AVATAR,
  },
  {
    id: 'bakul',
    name: 'Bakul',
    tagline: 'Starter closet · two real hats',
    starter: 'second',
    avatar: DEFAULT_AVATAR,
  },
];

const PROFILES_KEY = 'fitcheck-profiles';
const SETTINGS_KEY = 'fitcheck-settings';

export function storageKeys(profileId: string) {
  const suffix = profileId === FIRST_PROFILE_ID ? '' : `:${profileId}`;
  return {
    wardrobe: `fitcheck-wardrobe${suffix}`,
    saved: `fitcheck-saved${suffix}`,
    calendar: `fitcheck-calendar${suffix}`,
  };
}

export function starterItems(starter: Starter): ClothingItem[] {
  if (starter === 'first') return CLOTHING_ITEMS;
  if (starter === 'second') return SECOND_CLOSET_ITEMS;
  return [];
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is full or blocked. The app still works for this visit.
  }
}

export function loadProfiles(): ProfileState {
  const saved = read<ProfileState>(PROFILES_KEY);
  if (saved?.profiles?.length) {
    const profiles = saved.profiles.map((p) => ({ ...p, avatar: { ...DEFAULT_AVATAR, ...p.avatar } }));
    const activeId = profiles.some((p) => p.id === saved.activeId) ? saved.activeId : profiles[0].id;
    return { activeId, profiles };
  }
  return { activeId: FIRST_PROFILE_ID, profiles: DEFAULT_PROFILES };
}

export function saveProfiles(state: ProfileState): void {
  write(PROFILES_KEY, state);
}

export function makeProfile(name: string, existing: Profile[]): Profile {
  const clean = name.trim().slice(0, 24) || 'New profile';
  const base = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile';
  let id = base;
  for (let n = 2; existing.some((p) => p.id === id); n++) id = `${base}-${n}`;
  return { id, name: clean, tagline: 'My closet', starter: 'empty', avatar: DEFAULT_AVATAR };
}

export function eraseProfileData(profileId: string): void {
  const keys = storageKeys(profileId);
  for (const key of Object.values(keys)) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to erase if storage is blocked.
    }
  }
}

// Removes everything FitCheck has stored in this browser, for every profile.
export function eraseEverything(): void {
  try {
    const mine = Object.keys(localStorage).filter((k) => k.startsWith('fitcheck-'));
    for (const key of mine) localStorage.removeItem(key);
  } catch {
    // Nothing to erase if storage is blocked.
  }
}

function defaultUnit(): TempUnit {
  // Fahrenheit for US visitors, Celsius for everyone else. Either can switch.
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  return /-(US|BS|KY|LR|PW|FM|MH)$/i.test(lang) ? 'F' : 'C';
}

export function loadSettings(): AppSettings {
  const saved = read<Partial<AppSettings>>(SETTINGS_KEY);
  return {
    unit: saved?.unit === 'C' || saved?.unit === 'F' ? saved.unit : defaultUnit(),
    city: saved?.city && Number.isFinite(saved.city.lat) ? saved.city : DEFAULT_CITY,
  };
}

export function saveSettings(settings: AppSettings): void {
  write(SETTINGS_KEY, settings);
}
