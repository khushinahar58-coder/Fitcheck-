// Bugs an independent review found before this was merged, each pinned by a test.
import { describe, it, expect } from 'vitest';
import { CLOTHING_ITEMS } from '../src/data';
import { answerAsk, parseAsk } from '../src/lib/ask';
import { guessCategory } from '../src/lib/attributes';
import { generateOutfits } from '../src/lib/engine';
import { forecastFor } from '../src/lib/weather';
import type { Category, ClothingItem, DayWeather } from '../src/types';

// Wednesday 11 November 2026.
const TODAY = '2026-11-11';
const day = (date: string, highC = 16, lowC = 7): DayWeather => ({
  date, code: 1, condition: 'Mostly clear', icon: 'sun', highC, lowC, rainChance: 10, windKph: 8,
});
const forecast = Array.from({ length: 10 }, (_, i) => day(`2026-11-${11 + i}`));
const parse = (text: string) => parseAsk(text, CLOTHING_ITEMS, TODAY);
const names = (ids: string[]) => ids.map((id) => CLOTHING_ITEMS.find((i) => i.id === id)!.name).sort();

describe('Ask: saying what you do not want', () => {
  it('"I don\'t want to wear my blazer" leaves the blazer out instead of requiring it', () => {
    const p = parse("Work tomorrow, I don't want to wear my blazer");
    expect(p.requireItemIds).toEqual([]);
    expect(names(p.avoidItemIds)).toEqual(['Black Blazer']);
  });

  it('"not wearing my heels" leaves them out without claiming they are missing', () => {
    const p = parse('Party, not wearing my heels');
    expect(names(p.avoidItemIds)).toEqual(['Black Heels']);
    expect(p.notes.join(' ')).not.toMatch(/couldn't find/);
  });

  it('"no dress shoes" does not rule out every dress when no dress shoes are owned', () => {
    expect(parse('Work, no dress shoes').avoidItemIds).toEqual([]);
  });

  it('"no heels or flats" rules out both', () => {
    expect(names(parse('Dinner, no heels or flats').avoidItemIds)).toEqual(['Ballet Flats', 'Black Heels']);
  });
});

describe('Ask: asking for pieces', () => {
  it('"wear my cardigan with my trench coat" asks for both, and both are in the look', () => {
    const a = answerAsk('Dinner. Wear my cardigan with my trench coat', { items: CLOTHING_ITEMS, forecast, today: TODAY });
    expect(names(a.parse.requireItemIds)).toEqual(['Knit Cardigan', 'Trench Coat']);
    const worn = a.outfits[0].slots.map((s) => s.itemId);
    expect(worn).toContain('t5');
    expect(worn).toContain('o2');
  });

  it('two jackets cannot both go on: one is worn and the note says which was left out', () => {
    const a = answerAsk('Dinner with my trench coat. Use my leather jacket.', { items: CLOTHING_ITEMS, forecast, today: TODAY });
    const worn = a.outfits[0].slots.map((s) => s.itemId);
    expect(worn.filter((id) => id === 'o2' || id === 'o3')).toHaveLength(1);
    expect(a.notes.join(' ')).toMatch(/couldn't fit your (Trench Coat|Leather Jacket) into the same look/);
  });

  it('"with my friends that night" is not about a hat', () => {
    const p = parse('Dinner with my friends that night');
    expect(p.requireItemIds).toEqual([]);
    expect(p.notes).toEqual([]);
  });
});

describe('Ask: the day and the weather', () => {
  it('"tonight" wins over a weekday mentioned in passing', () => {
    expect(parse('Dinner tonight, not the dress I wore on Monday').date).toBe(TODAY);
    expect(parse('Dinner on Friday, not the dress I wore on Monday').date).toBe('2026-11-13');
    expect(parse('Party Saturday, something different from last Friday').date).toBe('2026-11-14');
  });

  it('a baby shower is not rain, and a hot date is not a heat wave', () => {
    expect(parse('What do I wear to a baby shower').stated).toBeUndefined();
    expect(parse('I have a hot date tonight').stated).toBeUndefined();
    expect(parse('Something hot pink for a party').stated).toBeUndefined();
    expect(parse("It's hot out, casual weekend").stated).toBe('hot');
    expect(parse('Rain showers and a client meeting').stated).toBe('rain');
  });
});

describe('the forecast and the clock', () => {
  it('uses the first forecast day when the city is already on tomorrow', () => {
    const london = [day('2026-11-12', 11, 6), day('2026-11-13')];
    expect(forecastFor(london, '2026-11-11')?.highC).toBe(11); // 11:30 pm in Virginia, London set
    expect(forecastFor(london, '2026-11-12')?.highC).toBe(11);
    expect(forecastFor(london, '2026-11-09')).toBeNull();
    expect(forecastFor([], '2026-11-11')).toBeNull();
  });
});

describe('sorting typed pieces onto shelves', () => {
  it('goes by the last clothing word', () => {
    const cases: Array<[string, Category]> = [
      ['denim shirt', 'Tops'],
      ['dark bootcut jeans', 'Bottoms'],
      ['flat-front chinos', 'Bottoms'],
      ['cap sleeve top', 'Tops'],
      ['ankle boot', 'Shoes'],
      ['black oxfords', 'Shoes'],
      ['oxford shirt', 'Tops'],
      ['leather watch', 'Accessories'],
      ['something unrecognisable', 'Tops'],
    ];
    for (const [phrase, shelf] of cases) expect(guessCategory(phrase), phrase).toBe(shelf);
  });
});

describe('a big closet', () => {
  // 160 pieces: 50 tops, 35 bottoms, 15 dresses, 20 coats, 25 pairs of shoes, 15 accessories.
  const big: ClothingItem[] = [];
  const add = (n: number, category: Category, kinds: string[], colors: string[]) => {
    for (let i = 0; i < n; i++) {
      big.push({
        id: `${category}-${i}`, name: `${colors[i % colors.length]} ${kinds[i % kinds.length]}`, category, image: '',
        color: colors[i % colors.length], brand: 'X', lastWornDaysAgo: (i * 7) % 90, tags: [],
      });
    }
  };
  add(50, 'Tops', ['Shirt', 'Sweater', 'T-Shirt', 'Blouse', 'Turtleneck'], ['White', 'Navy', 'Black', 'Grey', 'Olive', 'Burgundy']);
  add(35, 'Bottoms', ['Jeans', 'Trousers', 'Chinos', 'Skirt'], ['Indigo', 'Black', 'Khaki', 'Charcoal']);
  add(15, 'Dresses', ['Dress', 'Slip Dress'], ['Black', 'Floral', 'Red']);
  add(20, 'Outerwear', ['Blazer', 'Trench Coat', 'Leather Jacket', 'Wool Coat', 'Rain Jacket'], ['Navy', 'Camel', 'Black']);
  add(25, 'Shoes', ['Sneakers', 'Boots', 'Loafers', 'Heels', 'Flats'], ['White', 'Brown', 'Black']);
  add(15, 'Accessories', ['Bag', 'Scarf', 'Watch', 'Necklace', 'Belt'], ['Tan', 'Grey', 'Gold']);

  it('still answers quickly on a freezing day (the slowest case)', () => {
    const started = performance.now();
    const looks = generateOutfits({ items: big, occasionId: 'dinner', weather: day(TODAY, -1, -8), count: 8 });
    const elapsed = performance.now() - started;
    expect(looks).toHaveLength(8);
    expect(elapsed).toBeLessThan(700); // it was 7.8 seconds before the search was bounded
  });

  it('always keeps a piece the user asked for, however it ranks', () => {
    const looks = generateOutfits({ items: big, occasionId: 'work', weather: day(TODAY), requireItemIds: ['Tops-2'] });
    expect(looks.length).toBeGreaterThan(0);
    for (const look of looks) expect(look.slots.map((s) => s.itemId)).toContain('Tops-2');
  });
});
