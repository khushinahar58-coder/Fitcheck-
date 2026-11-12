// "Ask FitCheck": the golden and adversarial requests from docs/SPEC.md section 6.
import { describe, it, expect } from 'vitest';
import { CLOTHING_ITEMS, SECOND_CLOSET_ITEMS } from '../src/data';
import { attrsOf } from '../src/lib/attributes';
import { answerAsk, matchItems, parseAsk } from '../src/lib/ask';
import type { ClothingItem, DayWeather } from '../src/types';

// Thursday 12 November 2026.
const TODAY = '2026-11-12';
const forecast: DayWeather[] = Array.from({ length: 10 }, (_, i) => ({
  date: `2026-11-${String(12 + i).padStart(2, '0')}`,
  code: 1, condition: 'Mostly clear', icon: 'sun', highC: 16, lowC: 7, rainChance: 10, windKph: 8,
}));
const ctx = (items: ClothingItem[] = CLOTHING_ITEMS) => ({ items, forecast, today: TODAY });
const names = (ids: string[], items = CLOTHING_ITEMS) => ids.map((id) => items.find((i) => i.id === id)!.name);

describe('golden cases', () => {
  it('"What do I wear to a birthday dinner Friday?" -> dinner, this Friday, a full look', () => {
    const a = answerAsk('What do I wear to a birthday dinner Friday?', ctx());
    expect(a.parse.occasionId).toBe('dinner');
    expect(a.parse.date).toBe('2026-11-13');
    expect(a.weather?.date).toBe('2026-11-13');
    expect(a.outfits.length).toBe(3);
    expect(a.message).toMatch(/^For dinner out tomorrow/);
    expect(a.message).toContain(a.outfits[0].name);
  });

  it('"Rainy work day, client meeting, nothing too formal" -> work, rain, relaxed', () => {
    const a = answerAsk('Rainy work day, client meeting, nothing too formal', ctx());
    expect(a.parse.occasionId).toBe('work');
    expect(a.parse.stated).toBe('rain');
    expect(a.parse.formalityShift).toBeLessThan(0);
    expect(a.weather?.rainChance).toBeGreaterThanOrEqual(50);
    const first = a.outfits[0].slots.map((s) => CLOTHING_ITEMS.find((i) => i.id === s.itemId)!);
    expect(first.some((p) => p.category === 'Outerwear')).toBe(true);
    expect(attrsOf(first.find((p) => p.category === 'Shoes')!).open).toBe(false);
    expect(a.message).toMatch(/you said rain/);
  });

  it('"don\'t repeat last week\'s dress" leaves out the dress worn in the last two weeks', () => {
    const a = answerAsk("Birthday dinner tomorrow, don't repeat last week's dress", ctx());
    expect(a.parse.date).toBe('2026-11-13');
    // The Floral Midi Dress was worn 14 days ago; the other two dresses were not.
    expect(names(a.parse.avoidItemIds)).toEqual(['Floral Midi Dress']);
    for (const look of a.outfits) expect(look.slots.map((s) => s.itemId)).not.toContain('d1');
  });

  it('builds the look around a piece the user names', () => {
    const a = answerAsk('Date night with my leather jacket', ctx());
    expect(a.parse.occasionId).toBe('date');
    expect(names(a.parse.requireItemIds)).toEqual(['Leather Jacket']);
    for (const look of a.outfits) expect(look.slots.map((s) => s.itemId)).toContain('o3');
  });

  it('"no heels" keeps heels out', () => {
    const a = answerAsk('Party on Saturday, no heels', ctx());
    expect(a.parse.occasionId).toBe('party');
    expect(a.parse.date).toBe('2026-11-14');
    expect(names(a.parse.avoidItemIds)).toEqual(['Black Heels']);
    for (const look of a.outfits) expect(look.slots.map((s) => s.itemId)).not.toContain('s1');
  });

  it('works for the second closet too', () => {
    const a = answerAsk('Client meeting tomorrow', ctx(SECOND_CLOSET_ITEMS));
    expect(a.parse.occasionId).toBe('work');
    expect(a.outfits.length).toBe(3);
  });
});

describe('adversarial cases', () => {
  it('a piece the user does not own: says so, and still only uses owned pieces', () => {
    const a = answerAsk('Dinner tonight with my red sequin dress', ctx());
    expect(a.parse.requireItemIds).toEqual([]);
    expect(a.notes.join(' ')).toMatch(/couldn't find "red sequin dress"/);
    for (const look of a.outfits) {
      for (const slot of look.slots) expect(CLOTHING_ITEMS.some((i) => i.id === slot.itemId)).toBe(true);
    }
  });

  it('a color the user does not own: says so instead of inventing it', () => {
    const a = answerAsk('Something purple for a party', ctx());
    expect(a.parse.preferColorFamily).toBeUndefined();
    expect(a.notes.join(' ')).toMatch(/don't own anything purple/);
    expect(a.outfits.length).toBeGreaterThan(0);
  });

  it('contradictory limits: ruling out every top and dress falls back and explains', () => {
    const a = answerAsk('Work tomorrow, no tops, no dress', ctx());
    expect(a.outfits.length).toBeGreaterThan(0);
    expect(a.notes.join(' ')).toMatch(/didn't leave enough/);
  });

  it('an empty closet: no looks, and a nudge to add what you own', () => {
    const a = answerAsk('What do I wear to work?', ctx([]));
    expect(a.outfits).toEqual([]);
    expect(a.message).toMatch(/closet is empty/i);
    expect(a.message).not.toMatch(/\b(buy|shop)\b/i);
  });

  it('a shopping request: answers from the closet and says there is no shopping', () => {
    const a = answerAsk('What should I buy for a wedding?', ctx());
    expect(a.notes.join(' ')).toMatch(/no shopping suggestions/);
    expect(a.outfits.length).toBeGreaterThan(0);
  });

  it('no occasion: assumes casual and says so', () => {
    const a = answerAsk('what should I wear', ctx());
    expect(a.parse.occasionGuessed).toBe(true);
    expect(a.parse.occasionId).toBe('casual');
    expect(a.notes[0]).toMatch(/assumed a casual day/);
  });

  it('"with my friends" is not a clothing request', () => {
    const a = answerAsk('Dinner with my friends on Saturday', ctx());
    expect(a.parse.requireItemIds).toEqual([]);
    expect(a.notes.join(' ')).not.toMatch(/couldn't find/);
  });

  it('a day past the forecast: answers without weather and says why', () => {
    const a = answerAsk('Party in 13 days', ctx());
    expect(a.weather).toBeNull();
    expect(a.notes.join(' ')).toMatch(/too far out/);
  });
});

describe('reading the day', () => {
  const dateOf = (text: string) => parseAsk(text, CLOTHING_ITEMS, TODAY).date;
  it('today, tonight, tomorrow', () => {
    expect(dateOf('dinner tonight')).toBe('2026-11-12');
    expect(dateOf('work tomorrow')).toBe('2026-11-13');
  });
  it('weekday names mean the next one, including today', () => {
    expect(dateOf('party on thursday')).toBe('2026-11-12');
    expect(dateOf('party on monday')).toBe('2026-11-16');
    expect(dateOf('party next friday')).toBe('2026-11-20');
  });
  it('the weekend means Saturday', () => {
    expect(dateOf('casual weekend')).toBe('2026-11-14');
  });
});

describe('matching words to pieces', () => {
  it('finds pieces by name, color and kind', () => {
    expect(matchItems('trench coat', CLOTHING_ITEMS).map((i) => i.id)).toEqual(['o2']);
    expect(matchItems('heels', CLOTHING_ITEMS).map((i) => i.id)).toEqual(['s1']);
    expect(matchItems('black dress', CLOTHING_ITEMS).map((i) => i.id)).toEqual(['d3']);
    expect(matchItems('jacket', CLOTHING_ITEMS).length).toBe(4);
    expect(matchItems('green jumpsuit', CLOTHING_ITEMS)).toEqual([]);
  });
});
