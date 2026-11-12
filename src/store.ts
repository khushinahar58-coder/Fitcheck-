import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ClothingItem, SavedOutfit, CalendarEntry } from './types';
import { FIRST_PROFILE_ID, starterItems, storageKeys, type Starter } from './lib/profiles';
import { daysBetween, idleDays, todayISO, toISODate } from './lib/wear';

export { todayISO } from './lib/wear';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Usually the ~5 MB localStorage cap, hit by photos. The app keeps working for this visit.
    return false;
  }
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

// The date a wear is recorded under: a look planned for a future date but worn now counts as today.
function wearDateFor(dateISO: string | undefined, today: string): string {
  return dateISO && dateISO < today ? dateISO : today;
}

const sameLook = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

export interface StoreProfile {
  id: string;
  starter: Starter;
}

const FIRST_PROFILE: StoreProfile = { id: FIRST_PROFILE_ID, starter: 'first' };

export function useWardrobeStore(profile: StoreProfile = FIRST_PROFILE) {
  const keys = useMemo(() => storageKeys(profile.id), [profile.id]);

  const [storedItems, setItems] = useState<ClothingItem[]>(() =>
    withWearDates(loadFromStorage(keys.wardrobe, starterItems(profile.starter)))
  );
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(() => loadFromStorage(keys.saved, []));
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>(() => loadFromStorage(keys.calendar, []));
  const [storageFull, setStorageFull] = useState(false);

  useEffect(() => {
    setStorageFull(!saveToStorage(keys.wardrobe, storedItems));
  }, [keys, storedItems]);

  useEffect(() => {
    saveToStorage(keys.saved, savedOutfits);
  }, [keys, savedOutfits]);

  useEffect(() => {
    saveToStorage(keys.calendar, calendarEntries);
  }, [keys, calendarEntries]);

  const today = todayISO();
  const items = useMemo(
    () => storedItems.map((item) => ({ ...item, lastWornDaysAgo: daysSinceLastWorn(item, today) })),
    [storedItems, today]
  );

  const addItems = useCallback((newItems: Array<Omit<ClothingItem, 'id'>>) => {
    const stamp = Date.now();
    const added = todayISO();
    setItems((prev) => [
      ...prev,
      ...newItems.map((item, i) => ({ addedAt: added, ...item, id: `user-${stamp}-${i}` })),
    ]);
  }, []);

  const addItem = useCallback((item: Omit<ClothingItem, 'id'>) => addItems([item]), [addItems]);

  const updateItem = useCallback((id: string, changes: Partial<Omit<ClothingItem, 'id'>>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const saveOutfit = useCallback((outfit: SavedOutfit) => {
    // A look that is already saved (e.g. renamed) keeps its place; a new one goes on top.
    setSavedOutfits((prev) =>
      prev.some((o) => o.id === outfit.id)
        ? prev.map((o) => (o.id === outfit.id ? outfit : o))
        : [outfit, ...prev]
    );
  }, []);

  const removeSavedOutfit = useCallback((id: string) => {
    setSavedOutfits((prev) => prev.filter((o) => o.id !== id));
    setCalendarEntries((prev) => prev.filter((e) => e.savedOutfitId !== id));
  }, []);

  const addOutfitToCalendar = useCallback((entry: Omit<CalendarEntry, 'id'>) => {
    const id = `cal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCalendarEntries((prev) => {
      // The same pieces on the same day is the same plan. Adding it twice would show two
      // identical cards, each with its own "Mark as worn".
      const ids = entry.slots.map((s) => s.itemId);
      const already = prev.some((e) => e.date === entry.date && sameLook(e.slots.map((s) => s.itemId), ids));
      return already ? prev : [...prev, { ...entry, id }];
    });
  }, []);

  // Take a wear back off the pieces, unless another worn look that day used the same piece.
  const takeBackWear = useCallback((entry: CalendarEntry, entries: CalendarEntry[]) => {
    const day = entry.wornOn ?? wearDateFor(entry.date, entry.wornAt ? toISODate(new Date(entry.wornAt)) : todayISO());
    const stillWorn = new Set(
      entries
        .filter((e) => e.id !== entry.id && e.worn && (e.wornOn ?? e.date) === day)
        .flatMap((e) => e.slots.map((s) => s.itemId))
    );
    const ids = new Set(entry.slots.map((s) => s.itemId).filter((id) => !stillWorn.has(id)));
    setItems((prev) =>
      prev.map((item) =>
        ids.has(item.id) && item.wearDates?.includes(day)
          ? { ...item, wearDates: item.wearDates.filter((d) => d !== day) }
          : item
      )
    );
  }, []);

  const removeCalendarEntry = useCallback(
    (id: string) => {
      const entry = calendarEntries.find((e) => e.id === id);
      if (entry?.worn) takeBackWear(entry, calendarEntries);
      setCalendarEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [calendarEntries, takeBackWear]
  );

  const markCalendarEntryWorn = useCallback((entryId: string) => {
    const now = Date.now();
    const today = todayISO();
    setCalendarEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, worn: true, wornAt: now, wornOn: wearDateFor(e.date, today) } : e
      )
    );
  }, []);

  const markItemsWorn = useCallback((itemIds: string[], dateISO?: string) => {
    const wearDate = wearDateFor(dateISO, todayISO());
    setItems((prev) =>
      prev.map((item) => {
        if (!itemIds.includes(item.id)) return item;
        const wearDates = item.wearDates ?? [];
        if (wearDates.includes(wearDate)) return item;
        return { ...item, wearDates: [...wearDates, wearDate] };
      })
    );
  }, []);

  // Undo "Mark as worn": the look goes back to planned and the wear comes off its pieces.
  const unmarkCalendarEntryWorn = useCallback(
    (entryId: string) => {
      const entry = calendarEntries.find((e) => e.id === entryId);
      if (!entry?.worn) return;
      takeBackWear(entry, calendarEntries);
      setCalendarEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, worn: false, wornAt: undefined, wornOn: undefined } : e))
      );
    },
    [calendarEntries, takeBackWear]
  );

  const getCalendarEntriesForDate = useCallback(
    (dateISO: string): CalendarEntry[] => calendarEntries.filter((e) => e.date === dateISO),
    [calendarEntries]
  );

  const getTodaysEntries = useCallback(
    (): CalendarEntry[] => getCalendarEntriesForDate(todayISO()),
    [getCalendarEntriesForDate]
  );

  // Put the starter closet back and clear saved looks and the calendar.
  const resetCloset = useCallback(() => {
    setItems(withWearDates(starterItems(profile.starter)));
    setSavedOutfits([]);
    setCalendarEntries([]);
  }, [profile.starter]);

  return {
    items,
    savedOutfits,
    calendarEntries,
    storageFull,
    addItem,
    addItems,
    updateItem,
    removeItem,
    saveOutfit,
    removeSavedOutfit,
    addOutfitToCalendar,
    removeCalendarEntry,
    markCalendarEntryWorn,
    unmarkCalendarEntryWorn,
    markItemsWorn,
    getCalendarEntriesForDate,
    getTodaysEntries,
    resetCloset,
  };
}

export function getItemById(items: ClothingItem[], id: string): ClothingItem | undefined {
  return items.find((i) => i.id === id);
}

export function getItemsByCategory(items: ClothingItem[], category: string): ClothingItem[] {
  if (category === 'All') return items;
  return items.filter((i) => i.category === category);
}

// Pieces that have sat for `threshold` days or more, longest first. A piece that has never
// been worn counts from the day it was added.
export function getRarelyWornItems(items: ClothingItem[], threshold = 30): ClothingItem[] {
  return items
    .filter((i) => idleDays(i) >= threshold)
    .sort((a, b) => idleDays(b) - idleDays(a));
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

// Like formatLastWorn, but a never-worn piece says how long it has been waiting.
export function formatIdle(item: ClothingItem): string {
  if (item.lastWornDaysAgo >= 0) return formatLastWorn(item.lastWornDaysAgo);
  const waiting = idleDays(item);
  if (waiting >= 30) return `Never worn · added ${waiting} days ago`;
  return 'Not worn yet';
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
