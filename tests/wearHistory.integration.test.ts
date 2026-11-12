// @vitest-environment jsdom
// Integration: the real store hook, the real seed wardrobe and real (jsdom) localStorage, with no UI.
// Seam under test: marking a piece worn -> stored wear dates -> derived "last worn" -> the 30-day rule.
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWardrobeStore, getRarelyWornItems } from '../src/store';

const rarelyWornNames = (items: { name: string; lastWornDaysAgo: number }[]) =>
  getRarelyWornItems(items as never, 30).map((i) => i.name);

describe('wear history -> not worn recently', () => {
  beforeEach(() => localStorage.clear());

  it('a 42-day-old piece leaves the list once it is worn, and stays off after a reload', () => {
    const first = renderHook(() => useWardrobeStore());
    expect(rarelyWornNames(first.result.current.items)).toContain('Cashmere Sweater');

    act(() => first.result.current.markItemsWorn(['t2']));
    expect(rarelyWornNames(first.result.current.items)).not.toContain('Cashmere Sweater');
    first.unmount();

    // A fresh store reads what the first one saved, the way the app does on reload.
    const reloaded = renderHook(() => useWardrobeStore());
    expect(rarelyWornNames(reloaded.result.current.items)).not.toContain('Cashmere Sweater');
  });
});
