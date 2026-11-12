// The pieces that turn outside input into data: typed clothes, color words, the forecast, the 3D figure.
import { describe, it, expect, vi } from 'vitest';
import { CLOTHING_ITEMS, SECOND_CLOSET_ITEMS } from '../src/data';
import { attrsOf, guessCategory } from '../src/lib/attributes';
import { colorInfo, findColorWord } from '../src/lib/color';
import { DEFAULT_AVATAR } from '../src/lib/profiles';
import { draftToItem, parseQuickAdd } from '../src/lib/quickAdd';
import { describeCode, fetchForecast, formatTemp, parseForecast, searchCities, statedWeather } from '../src/lib/weather';
import { buildFigure, figureSpec } from '../src/three/buildFigure';

describe('type what you own', () => {
  it('splits a list and sorts each piece onto the right shelf', () => {
    const drafts = parseQuickAdd('white oxford shirt, dark jeans, a burgundy scarf\nred floral dress and my black leather jacket');
    expect(drafts.map((d) => [d.name, d.category, d.color])).toEqual([
      ['Oxford Shirt', 'Tops', 'White'],
      ['Jeans', 'Bottoms', 'Dark'],
      ['Scarf', 'Accessories', 'Burgundy'],
      ['Floral Dress', 'Dresses', 'Floral Red'],
      ['Leather Jacket', 'Outerwear', 'Black'],
    ]);
  });

  it('gives every draft a drawn picture and no invented wear history', () => {
    const [item] = parseQuickAdd('navy blazer').map(draftToItem);
    expect(item.image.startsWith('data:image/svg+xml')).toBe(true);
    expect(item.lastWornDaysAgo).toBe(-1);
    expect(attrsOf(item).kind).toBe('blazer');
  });

  it('ignores empty lines and stray punctuation', () => {
    expect(parseQuickAdd(' ,, \n ; ')).toEqual([]);
    expect(parseQuickAdd('black belt.').map((d) => d.name)).toEqual(['Belt']);
  });

  it('puts awkward names on the right shelf', () => {
    expect(guessCategory('denim jacket')).toBe('Outerwear');
    expect(guessCategory('dress shirt')).toBe('Tops');
    expect(guessCategory('dress shoes')).toBe('Shoes');
    expect(guessCategory('slip dress')).toBe('Dresses');
    expect(guessCategory('baseball cap')).toBe('Accessories');
    expect(guessCategory('khakis')).toBe('Bottoms');
  });
});

describe('colors', () => {
  it('matches whole words only', () => {
    expect(colorInfo('Titanium').known).toBe(false); // not "tan"
    expect(colorInfo('Colored').known).toBe(false); // not "red"
    expect(colorInfo('Oxford Navy corduroy').family).toBe('navy');
    expect(colorInfo('Floral Blue')).toMatchObject({ family: 'blue', pattern: true });
    expect(findColorWord('my light blue shirt')).toBe('Light Blue');
  });
});

describe('reading every starter piece', () => {
  it('recognises the kind of every piece in both closets (nothing falls through to a generic kind)', () => {
    const generic = [...CLOTHING_ITEMS, ...SECOND_CLOSET_ITEMS].filter((i) =>
      ['top', 'pants', 'jacket', 'shoes', 'accessory'].includes(attrsOf(i).kind)
    );
    // A Field Jacket is a plain jacket; everything else should be recognised.
    expect(generic.map((i) => i.name)).toEqual(['Field Jacket']);
  });

  it('knows a color for every starter piece', () => {
    const unknown = [...CLOTHING_ITEMS, ...SECOND_CLOSET_ITEMS].filter((i) => !colorInfo(i.color).known);
    expect(unknown.map((i) => `${i.name}: ${i.color}`)).toEqual([]);
  });
});

describe('weather', () => {
  const sample = {
    daily: {
      time: ['2026-11-11', '2026-11-12', '2026-11-25'],
      weather_code: [2, 63, 71],
      temperature_2m_max: [23.4, 9.1, 1],
      temperature_2m_min: [5.2, 3.3, -4],
      precipitation_probability_max: [0, 85, null],
      wind_speed_10m_max: [14, 22, null],
    },
  };

  it('parses an Open-Meteo forecast', () => {
    const days = parseForecast(sample);
    expect(days[0]).toMatchObject({ date: '2026-11-11', condition: 'Partly cloudy', highC: 23.4, lowC: 5.2, rainChance: 0 });
    expect(days[1]).toMatchObject({ condition: 'Rain', icon: 'cloud-rain', rainChance: 85 });
    // No probability that far out: a snow code still counts as wet.
    expect(days[2]).toMatchObject({ condition: 'Snow', rainChance: 70, windKph: 0 });
    expect(parseForecast({})).toEqual([]);
  });

  it('converts and labels temperatures', () => {
    expect(formatTemp(0, 'F')).toBe('32°F');
    expect(formatTemp(23.4, 'F')).toBe('74°F');
    expect(formatTemp(23.4, 'C')).toBe('23°C');
    expect(formatTemp(5.2, 'F', false)).toBe('41°');
  });

  it('names every kind of sky', () => {
    expect(describeCode(0).condition).toBe('Clear');
    expect(describeCode(45).condition).toBe('Fog');
    expect(describeCode(81).condition).toBe('Rain');
    expect(describeCode(96).condition).toBe('Thunderstorms');
  });

  it('asks Open-Meteo for the chosen city and reports a failure', async () => {
    const ok = vi.fn(async () => ({ ok: true, json: async () => sample })) as unknown as typeof fetch;
    const days = await fetchForecast({ name: 'X', lat: 38.0293, lon: -78.4767 }, ok);
    expect(days).toHaveLength(3);
    expect((ok as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('latitude=38.029&longitude=-78.477');

    const down = vi.fn(async () => ({ ok: false, status: 503 })) as unknown as typeof fetch;
    await expect(fetchForecast({ name: 'X', lat: 1, lon: 1 }, down)).rejects.toThrow(/503/);
  });

  it('finds cities by name', async () => {
    const found = vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: [{ name: 'Mumbai', admin1: 'Maharashtra', country: 'India', latitude: 19.07, longitude: 72.88 }] }),
    })) as unknown as typeof fetch;
    expect(await searchCities('Mumbai', found)).toEqual([{ name: 'Mumbai, Maharashtra', lat: 19.07, lon: 72.88 }]);
    expect(await searchCities('M', found)).toEqual([]);
  });

  it('weather the user describes overrides the sky but keeps the forecast temperatures for rain', () => {
    const base = parseForecast(sample)[0];
    expect(statedWeather('2026-11-11', 'rain', base)).toMatchObject({ rainChance: 90, highC: 23.4, stated: true, condition: 'Rain' });
    expect(statedWeather('2026-11-11', 'cold', base).highC).toBeLessThan(6);
  });
});

describe('the 3D figure', () => {
  const pick = (...ids: string[]) => ids.map((id) => [...CLOTHING_ITEMS, ...SECOND_CLOSET_ITEMS].find((i) => i.id === id)!);
  const partNames = (ids: string[]) => {
    const figure = buildFigure(pick(...ids), DEFAULT_AVATAR);
    const names: string[] = [];
    figure.traverse((o) => o.name && names.push(o.name));
    return names;
  };

  it('dresses the figure in every piece of a look', () => {
    expect(partNames(['t1', 'b2', 'o1', 's4', 'a2'])).toEqual(
      expect.arrayContaining(['body', 'garment-top', 'garment-bottom', 'garment-outer', 'garment-shoes', 'accessory-necklace'])
    );
  });

  it('a dress replaces the top and bottom, and a cardigan goes over it', () => {
    const names = partNames(['d1', 't5', 's4']);
    expect(names).toContain('garment-dress');
    expect(names).toContain('garment-mid');
    expect(names).not.toContain('garment-top');
    expect(names).not.toContain('garment-bottom');
  });

  it('puts the hats on', () => {
    expect(partNames(['m-t3', 'm-b1', 'a5'])).toContain('accessory-hat');
  });

  it('an empty look is just the figure, and hair and beard follow the avatar', () => {
    expect(partNames([])).toEqual(['body', 'head']);
    const figure = buildFigure([], { ...DEFAULT_AVATAR, hair: 'long', beard: true });
    expect(figure.getObjectByName('hair')).toBeTruthy();
    expect(figure.getObjectByName('beard')).toBeTruthy();
  });

  it('sorts a cardigan worn alone as the top', () => {
    const spec = figureSpec(pick('t5', 'b1'));
    expect(spec.top?.item.id).toBe('t5');
    expect(spec.mid).toBeUndefined();
  });
});
