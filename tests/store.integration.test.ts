// @vitest-environment jsdom
// Integration: the real store hook with real (jsdom) localStorage, no UI.
// Covers the follow-ups promised in the PR #2 and PR #4 reviews, plus separate closets per profile.
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWardrobeStore, getRarelyWornItems, formatIdle, todayISO } from '../src/store';
import { addDays } from '../src/lib/wear';
import type { CalendarEntry } from '../src/types';

const today = todayISO();
const look = (date: string, itemIds: string[], name = 'Test look'): Omit<CalendarEntry, 'id'> => ({
  savedOutfitId: 'x', date, occasionId: 'dinner', occasionLabel: 'Dinner Out', outfitName: name,
  slots: itemIds.map((itemId, i) => ({ role: `Slot ${i}`, itemId })), addedAt: Date.now(), worn: false,
});
const wearDates = (store: ReturnType<typeof useWardrobeStore>, id: string) =>
  store.items.find((i) => i.id === id)!.wearDates ?? [];

describe('undoing a wear', () => {
  beforeEach(() => localStorage.clear());

  it('"I didn\'t wear this" puts the look back to planned and takes today off its pieces', () => {
    const { result } = renderHook(() => useWardrobeStore());
    act(() => result.current.addOutfitToCalendar(look(today, ['t2', 'b4'])));
    const entryId = result.current.calendarEntries[0].id;

    act(() => {
      result.current.markCalendarEntryWorn(entryId);
      result.current.markItemsWorn(['t2', 'b4'], today);
    });
    expect(wearDates(result.current, 't2')).toContain(today);
    expect(getRarelyWornItems(result.current.items).map((i) => i.id)).not.toContain('t2');

    act(() => result.current.unmarkCalendarEntryWorn(entryId));
    expect(result.current.calendarEntries[0].worn).toBe(false);
    expect(wearDates(result.current, 't2')).not.toContain(today);
    expect(wearDates(result.current, 'b4')).not.toContain(today);
    // The Cashmere Sweater is back to being a piece that needs wearing.
    expect(getRarelyWornItems(result.current.items).map((i) => i.id)).toContain('t2');
  });

  it('keeps the wear on a piece that another worn look used the same day', () => {
    const { result } = renderHook(() => useWardrobeStore());
    act(() => {
      result.current.addOutfitToCalendar(look(today, ['t2', 'b4'], 'Morning'));
      result.current.addOutfitToCalendar(look(today, ['t2', 'b2'], 'Evening'));
    });
    const [morning, evening] = result.current.calendarEntries;
    act(() => {
      result.current.markCalendarEntryWorn(morning.id);
      result.current.markItemsWorn(['t2', 'b4'], today);
      result.current.markCalendarEntryWorn(evening.id);
      result.current.markItemsWorn(['t2', 'b2'], today);
    });
    act(() => result.current.unmarkCalendarEntryWorn(morning.id));
    expect(wearDates(result.current, 't2')).toContain(today); // still worn that evening
    expect(wearDates(result.current, 'b4')).not.toContain(today);
  });

  it('removing a worn entry also takes the wear back', () => {
    const { result } = renderHook(() => useWardrobeStore());
    act(() => result.current.addOutfitToCalendar(look(today, ['d2'])));
    const entryId = result.current.calendarEntries[0].id;
    act(() => {
      result.current.markCalendarEntryWorn(entryId);
      result.current.markItemsWorn(['d2'], today);
    });
    act(() => result.current.removeCalendarEntry(entryId));
    expect(result.current.calendarEntries).toHaveLength(0);
    expect(wearDates(result.current, 'd2')).not.toContain(today);
  });
});

describe('planning a look', () => {
  beforeEach(() => localStorage.clear());

  it('the same pieces on the same day are only planned once', () => {
    const { result } = renderHook(() => useWardrobeStore());
    act(() => result.current.addOutfitToCalendar(look(today, ['t3', 'b3', 's2'])));
    act(() => result.current.addOutfitToCalendar(look(today, ['s2', 't3', 'b3'])));
    expect(result.current.calendarEntries).toHaveLength(1);
    // A different day, or different pieces, is a different plan.
    act(() => result.current.addOutfitToCalendar(look(addDays(today, 1), ['t3', 'b3', 's2'])));
    act(() => result.current.addOutfitToCalendar(look(today, ['t3', 'b3', 's1'])));
    expect(result.current.calendarEntries).toHaveLength(3);
  });
});

describe('never-worn pieces', () => {
  beforeEach(() => localStorage.clear());

  it('a new piece records the day it was added and is not "rarely worn" yet', () => {
    const { result } = renderHook(() => useWardrobeStore());
    act(() => result.current.addItem({ name: 'New Top', category: 'Tops', image: '', color: 'Red', brand: 'X', lastWornDaysAgo: -1, tags: [] }));
    const added = result.current.items.find((i) => i.name === 'New Top')!;
    expect(added.addedAt).toBe(today);
    expect(getRarelyWornItems(result.current.items).map((i) => i.name)).not.toContain('New Top');
    expect(formatIdle(added)).toBe('Not worn yet');
  });

  it('a piece added 40 days ago and never worn counts as rarely worn', () => {
    const { result } = renderHook(() => useWardrobeStore());
    act(() =>
      result.current.addItem({
        name: 'Forgotten Top', category: 'Tops', image: '', color: 'Red', brand: 'X', lastWornDaysAgo: -1, tags: [],
        addedAt: addDays(today, -40),
      })
    );
    const forgotten = result.current.items.find((i) => i.name === 'Forgotten Top')!;
    expect(getRarelyWornItems(result.current.items).map((i) => i.name)).toContain('Forgotten Top');
    expect(formatIdle(forgotten)).toBe('Never worn · added 40 days ago');
  });

  it('adds several pieces at once with distinct ids', () => {
    const { result } = renderHook(() => useWardrobeStore());
    const before = result.current.items.length;
    const piece = { category: 'Tops' as const, image: '', color: 'Red', brand: 'X', lastWornDaysAgo: -1, tags: [] };
    act(() => result.current.addItems([{ ...piece, name: 'A' }, { ...piece, name: 'B' }, { ...piece, name: 'C' }]));
    expect(result.current.items).toHaveLength(before + 3);
    expect(new Set(result.current.items.map((i) => i.id)).size).toBe(before + 3);
  });
});

describe('profiles keep separate closets', () => {
  beforeEach(() => localStorage.clear());

  it('each profile has its own pieces and its own storage', () => {
    const first = renderHook(() => useWardrobeStore({ id: 'khushi', starter: 'first' }));
    const second = renderHook(() => useWardrobeStore({ id: 'bakul', starter: 'second' }));
    const blank = renderHook(() => useWardrobeStore({ id: 'someone-new', starter: 'empty' }));

    expect(first.result.current.items.map((i) => i.name)).toContain('Silk Blouse');
    expect(first.result.current.items.map((i) => i.name)).not.toContain('Claude Code Hat');
    expect(second.result.current.items.map((i) => i.name)).toContain('Claude Code Hat');
    expect(second.result.current.items.map((i) => i.name)).toContain('Blossom Hat');
    expect(blank.result.current.items).toEqual([]);

    act(() => second.result.current.removeItem('a5'));
    expect(JSON.parse(localStorage.getItem('fitcheck-wardrobe:bakul')!).some((i: { id: string }) => i.id === 'a5')).toBe(false);
    // The first profile still uses the original key, so closets saved before profiles existed still load.
    expect(JSON.parse(localStorage.getItem('fitcheck-wardrobe')!)).toHaveLength(first.result.current.items.length);
  });

  it('resetting a closet brings back the starter pieces and clears plans', () => {
    const { result } = renderHook(() => useWardrobeStore({ id: 'bakul', starter: 'second' }));
    const starting = result.current.items.length;
    act(() => {
      result.current.removeItem('a5');
      result.current.addOutfitToCalendar(look(today, ['m-t1', 'm-b1']));
    });
    act(() => result.current.resetCloset());
    expect(result.current.items).toHaveLength(starting);
    expect(result.current.calendarEntries).toEqual([]);
  });
});
