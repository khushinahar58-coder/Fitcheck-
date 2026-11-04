import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ClothingItem, SavedOutfit, CalendarEntry } from './types';
import { CLOTHING_ITEMS } from './data';

const STORAGE_KEY = 'fitcheck-wardrobe';
const SAVED_KEY = 'fitcheck-saved';
const CALENDAR_KEY = 'fitcheck-calendar';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// The user's local date. toISOString() is UTC, which is already tomorrow on a US evening.
export function todayISO(): string {
  return toISODate(new Date());
}

function daysBetween(fromISO: string, toISO: string): number {
  const ms = new Date(toISO + 'T00:00:00').getTime() - new Date(fromISO + 'T00:00:00').getTime();
  // Round because a day is 23 or 25 hours when the clocks change.
  return Math.round(ms / 86_400_000);
}

// Starter pieces (and data saved before wear dates were kept) only have a day count.
// Turn it into a real date once, so those pieces age like everything else.
function withWearDates(items: ClothingItem[]): ClothingItem[] {
  const today = new Date(todayISO() + 'T00:00:00');
  return items.map((item) => {
    if (item.wearDates?.length || item.lastWornDaysAgo < 0) return item;
    const worn = new Date(today);
    worn.setDate(worn.getDate() - item.lastWornDaysAgo);
    return { ...item, wearDates: [toISODate(worn)] };
  });
}

function daysSinceLastWorn(item: ClothingItem, today: string): number {
  if (!item.wearDates?.length) return -1;
  // ISO dates sort as text. Older data can hold tomorrow's date, so stop at 0.
  const latest = item.wearDates.reduce((a, b) => (b > a ? b : a));
  return Math.max(0, daysBetween(latest, today));
}

export function useWardrobeStore() {
  const [storedItems, setItems] = useState<ClothingItem[]>(() =>
    withWearDates(loadFromStorage(STORAGE_KEY, CLOTHING_ITEMS))
  );
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(() =>
    loadFromStorage(SAVED_KEY, [])
  );
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>(() =>
    loadFromStorage(CALENDAR_KEY, [])
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedItems));
  }, [storedItems]);

  const today = todayISO();
  const items = useMemo(
    () => storedItems.map((item) => ({ ...item, lastWornDaysAgo: daysSinceLastWorn(item, today) })),
    [storedItems, today]
  );

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedOutfits));
  }, [savedOutfits]);

  useEffect(() => {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(calendarEntries));
  }, [calendarEntries]);

  const addItem = useCallback((item: Omit<ClothingItem, 'id'>) => {
    const id = `user-${Date.now()}`;
    setItems((prev) => [...prev, { ...item, id }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const saveOutfit = useCallback((outfit: SavedOutfit) => {
    setSavedOutfits((prev) => [outfit, ...prev.filter((o) => o.id !== outfit.id)]);
  }, []);

  const removeSavedOutfit = useCallback((id: string) => {
    setSavedOutfits((prev) => prev.filter((o) => o.id !== id));
    setCalendarEntries((prev) => prev.filter((e) => e.savedOutfitId !== id));
  }, []);

  const addOutfitToCalendar = useCallback((entry: Omit<CalendarEntry, 'id'>) => {
    const id = `cal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCalendarEntries((prev) => [...prev, { ...entry, id }]);
  }, []);

  const removeCalendarEntry = useCallback((id: string) => {
    setCalendarEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const markCalendarEntryWorn = useCallback((entryId: string) => {
    const now = Date.now();
    setCalendarEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, worn: true, wornAt: now } : e))
    );
  }, []);

  const markItemsWorn = useCallback((itemIds: string[], dateISO?: string) => {
    const today = todayISO();
    // Wearing a look planned for a future date means it was worn today.
    const wearDate = dateISO && dateISO < today ? dateISO : today;
    setItems((prev) =>
      prev.map((item) => {
        if (!itemIds.includes(item.id)) return item;
        const wearDates = item.wearDates ?? [];
        if (wearDates.includes(wearDate)) return item;
        return { ...item, wearDates: [...wearDates, wearDate] };
      })
    );
  }, []);

  const getCalendarEntriesForDate = useCallback(
    (dateISO: string): CalendarEntry[] =>
      calendarEntries.filter((e) => e.date === dateISO),
    [calendarEntries]
  );

  const getTodaysEntries = useCallback(
    (): CalendarEntry[] => getCalendarEntriesForDate(todayISO()),
    [getCalendarEntriesForDate]
  );

  return {
    items,
    savedOutfits,
    calendarEntries,
    addItem,
    removeItem,
    saveOutfit,
    removeSavedOutfit,
    addOutfitToCalendar,
    removeCalendarEntry,
    markCalendarEntryWorn,
    markItemsWorn,
    getCalendarEntriesForDate,
    getTodaysEntries,
  };
}

export function getItemById(items: ClothingItem[], id: string): ClothingItem | undefined {
  return items.find((i) => i.id === id);
}

export function getItemsByCategory(items: ClothingItem[], category: string): ClothingItem[] {
  if (category === 'All') return items;
  return items.filter((i) => i.category === category);
}

export function getRarelyWornItems(items: ClothingItem[], threshold = 30): ClothingItem[] {
  return items
    .filter((i) => i.lastWornDaysAgo >= threshold)
    .sort((a, b) => b.lastWornDaysAgo - a.lastWornDaysAgo);
}

export function formatLastWorn(daysAgo: number): string {
  if (daysAgo < 0) return 'Not worn yet';
  if (daysAgo === 0) return 'Worn today';
  if (daysAgo === 1) return 'Worn yesterday';
  if (daysAgo < 7) return `Worn ${daysAgo} days ago`;
  if (daysAgo < 14) return 'Worn last week';
  if (daysAgo < 30) return 'Worn this month';
  if (daysAgo < 60) return 'Worn last month';
  if (daysAgo < 90) return 'Over 2 months ago';
  return 'Over 3 months ago';
}

export function getWornUrgency(daysAgo: number): 'fresh' | 'moderate' | 'rarely' {
  if (daysAgo < 14) return 'fresh';
  if (daysAgo < 30) return 'moderate';
  return 'rarely';
}

export function formatLongDate(dateISO: string): string {
  const date = new Date(dateISO + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(dateISO: string): string {
  const date = new Date(dateISO + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
