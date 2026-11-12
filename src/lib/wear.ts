// Date and wear-history helpers with no React or storage in them, so the store,
// the outfit engine and the tests can all share one definition of "rarely worn".

import type { ClothingItem } from '../types';

export const RARELY_WORN_DAYS = 30;

export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// The user's local date. toISOString() is UTC, which is already tomorrow on a US evening.
export function todayISO(): string {
  return toISODate(new Date());
}

export function daysBetween(fromISO: string, toISO: string): number {
  const ms = new Date(toISO + 'T00:00:00').getTime() - new Date(fromISO + 'T00:00:00').getTime();
  // Round because a day is 23 or 25 hours when the clocks change.
  return Math.round(ms / 86_400_000);
}

export function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

// Days a piece has sat unworn. A worn piece counts from its last wear. A never-worn piece
// counts from the day it was added, so something bought and forgotten still surfaces.
// -1 means unknown: never worn and no added date (the two starter hats, older saved data).
export function idleDays(item: ClothingItem, today: string = todayISO()): number {
  if (item.lastWornDaysAgo >= 0) return item.lastWornDaysAgo;
  if (item.addedAt) return Math.max(0, daysBetween(item.addedAt, today));
  return -1;
}

export function isRarelyWorn(item: ClothingItem, threshold = RARELY_WORN_DAYS, today?: string): boolean {
  return idleDays(item, today) >= threshold;
}
