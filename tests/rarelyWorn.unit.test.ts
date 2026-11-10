// Unit: getRarelyWornItems() alone. It calls nothing, so there is nothing to mock.
import { describe, it, expect } from 'vitest';
import { getRarelyWornItems } from '../src/store';
import type { ClothingItem } from '../src/types';

const piece = (id: string, lastWornDaysAgo: number) =>
  ({ id, name: id, lastWornDaysAgo } as unknown as ClothingItem);

describe('getRarelyWornItems', () => {
  const items = [piece('fresh', 5), piece('edge-29', 29), piece('edge-30', 30), piece('old', 42), piece('oldest', 70)];

  it('keeps pieces worn 30+ days ago, oldest first', () => {
    expect(getRarelyWornItems(items, 30).map((i) => i.id)).toEqual(['oldest', 'old', 'edge-30']);
  });

  it('drops anything worn in the last 29 days', () => {
    const ids = getRarelyWornItems(items, 30).map((i) => i.id);
    expect(ids).not.toContain('fresh');
    expect(ids).not.toContain('edge-29');
  });
});
