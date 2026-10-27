import { useState, useCallback, useEffect } from 'react';
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

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function useWardrobeStore() {
  const [items, setItems] = useState<ClothingItem[]>(() =>
    loadFromStorage(STORAGE_KEY, CLOTHING_ITEMS)
  );
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(() =>
    loadFromStorage(SAVED_KEY, [])
  );
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>(() =>
    loadFromStorage(CALENDAR_KEY, [])
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

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
    const wearDate = dateISO ?? todayISO();
    setItems((prev) =>
      prev.map((item) => {
        if (!itemIds.includes(item.id)) return item;
        const wearDates = item.wearDates ?? [];
        if (wearDates.includes(wearDate)) return item;
        return {
          ...item,
          lastWornDaysAgo: 0,
          wearDates: [...wearDates, wearDate],
        };
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
