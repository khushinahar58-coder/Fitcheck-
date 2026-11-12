// The outfit engine, checked against the rubric in docs/SPEC.md section 6:
// uses only owned pieces · matches the occasion · suits the forecast · includes a rarely-worn
// piece when one fits · gives a one-line reason · no shopping suggestions.
import { describe, it, expect } from 'vitest';
import { CLOTHING_ITEMS, SECOND_CLOSET_ITEMS, OCCASIONS } from '../src/data';
import { attrsOf } from '../src/lib/attributes';
import { checkOutfitForWeather, closetGap, generateOutfits, OCCASION_PROFILES } from '../src/lib/engine';
import type { ClothingItem, DayWeather, OccasionId, Outfit } from '../src/types';

const day = (highC: number, lowC: number, rainChance = 0, code = 1): DayWeather => ({
  date: '2026-11-12', code, condition: code >= 51 ? 'Rain' : 'Clear', icon: 'sun', highC, lowC, rainChance, windKph: 8,
});
const MILD = day(21, 14);
const COLD_RAIN = day(9, 3, 85, 63);
const HOT = day(32, 23);
const FREEZING = day(-1, -8);

const CLOSETS: Array<[string, ClothingItem[]]> = [
  ['first starter closet', CLOTHING_ITEMS],
  ['second starter closet', SECOND_CLOSET_ITEMS],
];
const OCCASION_IDS = OCCASIONS.map((o) => o.id);
const WEATHERS: Array<[string, DayWeather | null]> = [
  ['no forecast', null], ['mild', MILD], ['cold rain', COLD_RAIN], ['hot', HOT], ['freezing', FREEZING],
];

const piecesOf = (outfit: Outfit, closet: ClothingItem[]) =>
  outfit.slots.map((s) => closet.find((i) => i.id === s.itemId)!);

describe('every look, for every closet, occasion and forecast', () => {
  for (const [closetName, closet] of CLOSETS) {
    for (const occasionId of OCCASION_IDS) {
      for (const [weatherName, weather] of WEATHERS) {
        const looks = generateOutfits({ items: closet, occasionId, weather });
        const label = `${closetName} · ${occasionId} · ${weatherName}`;

        it(`${label}: returns 3+ complete looks that differ`, () => {
          expect(looks.length).toBeGreaterThanOrEqual(3);
          expect(new Set(looks.map((l) => l.id)).size).toBe(looks.length);
          for (const look of looks) {
            const cats = piecesOf(look, closet).map((p) => p.category);
            const complete = cats.includes('Dresses') || (cats.includes('Tops') && cats.includes('Bottoms'));
            expect(complete, look.name).toBe(true);
            expect(cats.filter((c) => c === 'Shoes').length, 'one pair of shoes').toBe(1);
          }
        });

        it(`${label}: uses only owned pieces, each once, with unique slot labels`, () => {
          for (const look of looks) {
            const ids = look.slots.map((s) => s.itemId);
            expect(ids.every((id) => closet.some((i) => i.id === id))).toBe(true);
            expect(new Set(ids).size).toBe(ids.length);
            expect(new Set(look.slots.map((s) => s.role)).size).toBe(look.slots.length);
          }
        });

        it(`${label}: gives a reason and never suggests shopping`, () => {
          for (const look of looks) {
            expect(look.description.length).toBeGreaterThan(15);
            expect(look.description).not.toMatch(/\b(buy|shop|purchase|order|new piece)\b/i);
          }
        });

        it(`${label}: brings back a rarely-worn piece in the first three looks`, () => {
          const stale = looks.slice(0, 3).some((look) => piecesOf(look, closet).some((p) => p.lastWornDaysAgo >= 30));
          expect(stale).toBe(true);
        });
      }
    }
  }
});

describe('matches the occasion', () => {
  it('keeps hats, sneakers and denim jackets out of work looks', () => {
    for (const [, closet] of CLOSETS) {
      for (const look of generateOutfits({ items: closet, occasionId: 'work', weather: MILD })) {
        const kinds = piecesOf(look, closet).map((p) => attrsOf(p).kind);
        expect(kinds).not.toContain('hat');
        expect(kinds).not.toContain('sneakers');
        expect(kinds).not.toContain('denim-jacket');
        expect(kinds).not.toContain('tee');
      }
    }
  });

  it('keeps the core of every look within one step of the occasion range', () => {
    for (const [, closet] of CLOSETS) {
      for (const occasionId of OCCASION_IDS as OccasionId[]) {
        const { lo, hi } = OCCASION_PROFILES[occasionId];
        for (const look of generateOutfits({ items: closet, occasionId, weather: MILD })) {
          for (const p of piecesOf(look, closet)) {
            if (!['Tops', 'Bottoms', 'Dresses', 'Shoes'].includes(p.category)) continue;
            const f = attrsOf(p).formality;
            expect(f, `${p.name} for ${occasionId}`).toBeGreaterThanOrEqual(lo - 1);
            expect(f, `${p.name} for ${occasionId}`).toBeLessThanOrEqual(hi + 1);
          }
        }
      }
    }
  });

  it('only puts a hat on a casual look', () => {
    const casual = generateOutfits({ items: SECOND_CLOSET_ITEMS, occasionId: 'casual', weather: MILD });
    const hatsWorn = casual.flatMap((l) => piecesOf(l, SECOND_CLOSET_ITEMS)).filter((p) => attrsOf(p).kind === 'hat');
    expect(hatsWorn.length).toBeGreaterThan(0);
    for (const occasionId of ['work', 'dinner', 'date', 'party'] as OccasionId[]) {
      const looks = generateOutfits({ items: SECOND_CLOSET_ITEMS, occasionId, weather: MILD });
      expect(looks.flatMap((l) => piecesOf(l, SECOND_CLOSET_ITEMS)).some((p) => attrsOf(p).kind === 'hat')).toBe(false);
    }
  });
});

describe('suits the forecast', () => {
  it('adds an outer layer to every look when it is cold or freezing', () => {
    for (const [, closet] of CLOSETS) {
      for (const weather of [COLD_RAIN, FREEZING]) {
        for (const occasionId of OCCASION_IDS as OccasionId[]) {
          for (const look of generateOutfits({ items: closet, occasionId, weather })) {
            expect(piecesOf(look, closet).some((p) => p.category === 'Outerwear'), `${occasionId}: ${look.name}`).toBe(true);
          }
        }
      }
    }
  });

  it('skips coats, sweaters and cardigans when it is hot', () => {
    for (const [, closet] of CLOSETS) {
      for (const occasionId of OCCASION_IDS as OccasionId[]) {
        for (const look of generateOutfits({ items: closet, occasionId, weather: HOT })) {
          const pieces = piecesOf(look, closet);
          expect(pieces.some((p) => p.category === 'Outerwear'), `${occasionId}: ${look.name}`).toBe(false);
          expect(pieces.some((p) => attrsOf(p).kind === 'scarf')).toBe(false);
        }
      }
    }
  });

  it('never picks open shoes in the rain, and the first look has rain-proof shoes', () => {
    for (const [, closet] of CLOSETS) {
      for (const occasionId of OCCASION_IDS as OccasionId[]) {
        const looks = generateOutfits({ items: closet, occasionId, weather: COLD_RAIN });
        for (const look of looks) {
          const shoes = piecesOf(look, closet).find((p) => p.category === 'Shoes')!;
          expect(attrsOf(shoes).open, `${occasionId}: ${shoes.name}`).toBe(false);
        }
        const firstShoes = piecesOf(looks[0], closet).find((p) => p.category === 'Shoes')!;
        expect(attrsOf(firstShoes).rainOk, `${occasionId}: ${firstShoes.name}`).toBe(true);
      }
    }
  });

  it('mentions the weather in the reason when it shaped the look', () => {
    const [first] = generateOutfits({ items: CLOTHING_ITEMS, occasionId: 'dinner', weather: COLD_RAIN, formatTemp: (c) => `${Math.round(c)}°C` });
    expect(first.description).toMatch(/rain|°C/);
  });
});

describe('requests and limits', () => {
  it('is deterministic: the same closet and day give the same looks', () => {
    const a = generateOutfits({ items: CLOTHING_ITEMS, occasionId: 'date', weather: MILD });
    const b = generateOutfits({ items: CLOTHING_ITEMS, occasionId: 'date', weather: MILD });
    expect(a.map((l) => l.id)).toEqual(b.map((l) => l.id));
  });

  it('builds every look around a required piece', () => {
    const looks = generateOutfits({ items: CLOTHING_ITEMS, occasionId: 'dinner', weather: MILD, requireItemIds: ['o2'] });
    expect(looks.length).toBeGreaterThan(0);
    for (const look of looks) expect(look.slots.map((s) => s.itemId)).toContain('o2');
  });

  it('leaves out pieces the user ruled out', () => {
    const noDresses = CLOTHING_ITEMS.filter((i) => i.category === 'Dresses').map((i) => i.id);
    const looks = generateOutfits({ items: CLOTHING_ITEMS, occasionId: 'party', weather: MILD, avoidItemIds: noDresses });
    for (const look of looks) expect(look.slots.some((s) => noDresses.includes(s.itemId))).toBe(false);
  });

  it('a more relaxed request lowers how dressy the looks are', () => {
    const avg = (looks: Outfit[]) => {
      const f = looks.flatMap((l) => piecesOf(l, CLOTHING_ITEMS)).filter((p) => p.category !== 'Accessories').map((p) => attrsOf(p).formality);
      return f.reduce((a, b) => a + b, 0) / f.length;
    };
    const usual = generateOutfits({ items: CLOTHING_ITEMS, occasionId: 'work', weather: MILD });
    const relaxed = generateOutfits({ items: CLOTHING_ITEMS, occasionId: 'work', weather: MILD, formalityShift: -0.8 });
    expect(avg(relaxed)).toBeLessThan(avg(usual));
  });

  it('does not repeat a look worn in the past week', () => {
    const [first] = generateOutfits({ items: CLOTHING_ITEMS, occasionId: 'dinner', weather: MILD });
    const worn = first.slots.map((s) => s.itemId);
    const [next] = generateOutfits({ items: CLOTHING_ITEMS, occasionId: 'dinner', weather: MILD, recentLooks: [worn] });
    expect(next.id).not.toBe(first.id);
  });
});

describe('closets that cannot make a look (adversarial cases)', () => {
  it('an empty closet gives no looks and a plain explanation', () => {
    expect(generateOutfits({ items: [], occasionId: 'work' })).toEqual([]);
    expect(closetGap([])).toMatch(/empty/i);
  });

  it('tops alone give no looks and say what is missing, without telling anyone to shop', () => {
    const tops = CLOTHING_ITEMS.filter((i) => i.category === 'Tops');
    expect(generateOutfits({ items: tops, occasionId: 'casual' })).toEqual([]);
    expect(closetGap(tops)).toMatch(/no bottoms/);
    expect(closetGap(tops)).not.toMatch(/\b(buy|shop|purchase)\b/i);
  });

  it('one top and one bottom still make a look, with no shoes invented', () => {
    const two = CLOTHING_ITEMS.filter((i) => i.id === 't1' || i.id === 'b2');
    const looks = generateOutfits({ items: two, occasionId: 'work' });
    expect(looks).toHaveLength(1);
    expect(looks[0].slots.map((s) => s.itemId).sort()).toEqual(['b2', 't1']);
    expect(closetGap(two)).toBeNull();
  });

  it('a never-worn piece with an old added date counts as rarely worn', () => {
    const closet: ClothingItem[] = [
      { ...CLOTHING_ITEMS.find((i) => i.id === 't1')!, lastWornDaysAgo: 2 },
      { ...CLOTHING_ITEMS.find((i) => i.id === 'b2')!, lastWornDaysAgo: 2 },
      { ...CLOTHING_ITEMS.find((i) => i.id === 't3')!, id: 'new-top', name: 'Forgotten Top', lastWornDaysAgo: -1, addedAt: '2026-08-01' },
    ];
    const looks = generateOutfits({ items: closet, occasionId: 'dinner', today: '2026-11-12' });
    expect(looks[0].slots.map((s) => s.itemId)).toContain('new-top');
    expect(looks[0].description).toMatch(/first wear/);
  });
});

describe('checking a finished look against the forecast', () => {
  const fmt = (c: number) => `${Math.round(c)}°C`;
  const pick = (...ids: string[]) => ids.map((id) => CLOTHING_ITEMS.find((i) => i.id === id)!);

  it('warns about a cold night with no outer layer and names a coat the user owns', () => {
    const check = checkOutfitForWeather(pick('d2', 's1'), CLOTHING_ITEMS, day(8, 1), 'dinner', fmt);
    expect(check.ok).toBe(false);
    expect(check.note).toMatch(/Trench Coat|Leather Jacket|Black Blazer|Denim Jacket/);
  });

  it('warns about rain and shoes that will not cope', () => {
    const check = checkOutfitForWeather(pick('t1', 'b2', 'o2', 's1'), CLOTHING_ITEMS, COLD_RAIN, 'work', fmt);
    expect(check.ok).toBe(false);
    expect(check.note).toMatch(/Black Heels/);
    expect(check.note).toMatch(/Leather Ankle Boots/);
  });

  it('passes a look that suits the day', () => {
    const check = checkOutfitForWeather(pick('t1', 'b2', 's4'), CLOTHING_ITEMS, MILD, 'work', fmt);
    expect(check.ok).toBe(true);
  });
});
