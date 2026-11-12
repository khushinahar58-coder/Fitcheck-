// "Ask FitCheck": turns a typed request ("what do I wear to a birthday dinner Friday?")
// into settings for the outfit engine, then answers with looks from the closet.
//
// This is pattern matching, not a language model. It understands the occasion, the day,
// weather words, and a handful of preferences (more relaxed, no heels, don't repeat, with my
// trench coat). Whatever it understood is returned in `parse`, so the screen can show it.

import type { CalendarEntry, ClothingItem, DayWeather, OccasionId, Outfit } from '../types';
import { OCCASIONS } from '../data';
import { attrsOf } from './attributes';
import { colorInfo, findColorWord } from './color';
import { closetGap, generateOutfits } from './engine';
import { statedWeather } from './weather';
import { addDays, daysBetween, todayISO } from './wear';

export type StatedWeather = 'rain' | 'cold' | 'hot' | 'mild' | 'snow';

export interface AskParse {
  occasionId: OccasionId;
  occasionGuessed: boolean;
  date: string;
  dateLabel: string;
  stated?: StatedWeather;
  formalityShift: number;
  avoidItemIds: string[];
  requireItemIds: string[];
  preferColorFamily?: string;
  comfortShoes: boolean;
  notes: string[];
}

export interface AskContext {
  items: ClothingItem[];
  forecast: DayWeather[];
  entries?: CalendarEntry[];
  today?: string;
  formatTemp?: (celsius: number) => string;
}

export interface AskAnswer {
  parse: AskParse;
  weather: DayWeather | null;
  outfits: Outfit[];
  message: string;
  notes: string[];
}

const OCCASION_PATTERNS: Array<[OccasionId, RegExp]> = [
  ['date', /\b(date night|first date|second date|a date|my date|anniversary|romantic)\b/],
  ['dinner', /\b(dinner|restaurant|supper)\b/],
  ['party', /\b(party|wedding|club|clubbing|night out|drinks|celebration|gala|cocktails?|concert|birthday)\b/],
  ['work', /\b(work|office|meeting|client|interview|presentation|conference|business|boss|coworkers?)\b/],
  ['casual', /\b(casual|weekend|brunch|coffee|errands|class|lecture|park|walk|grocer(y|ies)|relax|hang(ing)? out|day off|travel|airport|flight|lunch|movie|game)\b/],
];

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const GARMENT_WORD =
  /dress|blazer|coat|jacket|trench|sweater|cardigan|turtleneck|shirt|blouse|tee|top|camisole|polo|hoodie|jeans|pants|trousers?|chinos?|shorts|skirt|shoes?|sneakers?|boots?|heels?|loafers?|flats|sandals?|bag|scarf|hat|cap|belt|watch|necklace|earrings?|tie|suit/;

const STOP_WORDS = new Set(['a', 'an', 'the', 'my', 'that', 'those', 'this', 'these', 'some', 'any', 'pair', 'of', 'new', 'favorite', 'favourite', 'old']);

const singular = (word: string) =>
  word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;

function vocabulary(item: ClothingItem): Set<string> {
  const a = attrsOf(item);
  const text = `${item.name} ${item.color} ${item.category} ${a.kind} ${a.color.family} ${(item.tags ?? []).join(' ')}`;
  const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const set = new Set<string>();
  for (const w of words) {
    set.add(w);
    set.add(singular(w));
  }
  if (item.category === 'Outerwear') ['jacket', 'coat'].forEach((w) => set.add(w));
  return set;
}

// Pieces in the closet that a phrase like "black heels" or "trench coat" could mean.
export function matchItems(phrase: string, items: ClothingItem[]): ClothingItem[] {
  const tokens = phrase
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .map(singular);
  if (!tokens.length) return [];
  return items.filter((item) => {
    const vocab = vocabulary(item);
    return tokens.every((t) => vocab.has(t));
  });
}

function parseDate(text: string, today: string): { date: string; label: string } {
  const weekday = new Date(today + 'T00:00:00').getDay();
  const label = (date: string) =>
    date === today
      ? 'today'
      : date === addDays(today, 1)
        ? 'tomorrow'
        : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  let date = today;
  const inDays = text.match(/\bin (\d{1,2}) days?\b/);
  const named = text.match(/\b(next |this |on )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (/\btomorrow\b/.test(text)) {
    date = addDays(today, 1);
  } else if (inDays) {
    date = addDays(today, Number(inDays[1]));
  } else if (named) {
    let ahead = (WEEKDAYS.indexOf(named[2]) - weekday + 7) % 7;
    // "next Friday" said on a Friday (or any day) means the one in the following week.
    if (named[1]?.trim() === 'next') ahead += ahead === 0 ? 7 : weekday < WEEKDAYS.indexOf(named[2]) ? 7 : 0;
    date = addDays(today, ahead);
  } else if (/\b(this |the |next )?weekend\b/.test(text)) {
    date = weekday === 6 || weekday === 0 ? today : addDays(today, 6 - weekday);
  }
  return { date, label: label(date) };
}

export function parseAsk(rawText: string, items: ClothingItem[], today: string = todayISO()): AskParse {
  const text = ` ${rawText.toLowerCase().replace(/[’‘]/g, "'")} `;
  const notes: string[] = [];

  const found = OCCASION_PATTERNS.find(([, re]) => re.test(text));
  const occasionId: OccasionId = found?.[0] ?? 'casual';
  const { date, label: dateLabel } = parseDate(text, today);

  let stated: StatedWeather | undefined;
  if (/\b(rain|rainy|raining|wet|storm|stormy|drizzle|showers?|pouring)\b/.test(text)) stated = 'rain';
  else if (/\b(snow|snowy|snowing)\b/.test(text)) stated = 'snow';
  else if (/\b(cold|freezing|chilly|frigid)\b/.test(text)) stated = 'cold';
  else if (/\b(hot|heat|sweltering|humid|warm out|heatwave)\b/.test(text)) stated = 'hot';

  let formalityShift = 0;
  const relaxed = /\b(not|nothing|isn't|not too|n't)\s+(too |very |super |that |so )?(formal|dressy|fancy|stuffy)\b|\b(relaxed|laid[- ]back|low[- ]key|comfy|comfortable|chill)\b/;
  if (relaxed.test(text)) formalityShift = -0.6;
  else if (/\b(formal|dressy|fancy|sharp|polished|elegant|dress up|dressed up|smart)\b/.test(text)) formalityShift = 0.5;

  const comfortShoes = /\b(comfortable|comfy) shoes\b|\bwalking\b|\bon my feet\b|\bstanding all\b/.test(text);

  // "no heels", "without a jacket": leave those pieces out.
  const avoid = new Set<string>();
  const negations = text.matchAll(/\b(?:no|without|skip|not wearing|don't want|except)\s+((?:[a-z-]+\s?){1,3})/g);
  for (const m of negations) {
    const words = m[1].trim().split(/\s+/);
    // Try the longest phrase first: "black leather jacket", then "black leather", then "black".
    for (let n = words.length; n >= 1; n--) {
      const phrase = words.slice(0, n).join(' ');
      if (!GARMENT_WORD.test(phrase)) continue;
      const hits = matchItems(phrase, items);
      if (hits.length) {
        hits.forEach((i) => avoid.add(i.id));
        break;
      }
    }
  }

  // "don't repeat last week's dress": leave out what was worn recently.
  if (/\b(don't|do not|not|no|without) repeat(ing)?\b|\bsomething (new|different)\b|\bhaven't worn\b|\bnot the same\b/.test(text)) {
    const about = text.match(/repeat(?:ing)?\s+(?:[a-z']+\s){0,4}?(dress|top|shirt|sweater|jacket|coat|shoes|skirt|pants|jeans)/);
    const recent = items.filter((i) => i.lastWornDaysAgo >= 0 && i.lastWornDaysAgo <= (about ? 14 : 7));
    const scoped = about ? matchItems(about[1], recent) : recent.filter((i) => ['Tops', 'Bottoms', 'Dresses'].includes(i.category));
    scoped.forEach((i) => avoid.add(i.id));
    if (scoped.length) notes.push(`Left out ${scoped.length === 1 ? scoped[0].name : `${scoped.length} pieces`} you wore recently.`);
  }

  // "with my trench coat", "wear the black blazer": build the look around that piece.
  const require = new Set<string>();
  const asks = text.matchAll(/\b(?:wear|wearing|with|use|using|include|around|style|styling)\s+(?:my|the|that|those)\s+((?:[a-z-]+\s?){1,4})/g);
  for (const m of asks) {
    const words = m[1].trim().split(/\s+/);
    let matched = false;
    for (let n = words.length; n >= 1 && !matched; n--) {
      const phrase = words.slice(0, n).join(' ');
      if (!GARMENT_WORD.test(phrase)) continue;
      const hits = matchItems(phrase, items).filter((i) => !avoid.has(i.id));
      if (hits.length) {
        require.add(hits[0].id);
        matched = true;
      }
    }
    if (!matched) {
      const garment = words.findIndex((w) => GARMENT_WORD.test(w));
      if (garment >= 0) {
        notes.push(`I couldn't find "${words.slice(0, garment + 1).join(' ')}" in your closet, so this uses what you own.`);
      }
    }
  }

  // "something red", "in green": lean towards that color if the closet has it.
  let preferColorFamily: string | undefined;
  const colorAsk = text.match(/\b(?:something|anything|in|wear(?:ing)?)\s+(?:a |an )?([a-z-]+(?: [a-z]+)?)\b/g) ?? [];
  for (const phrase of colorAsk) {
    const word = findColorWord(phrase);
    if (!word) continue;
    const family = colorInfo(word).family;
    const owned = items.some((i) => i.category !== 'Accessories' && attrsOf(i).color.family === family);
    if (owned) preferColorFamily = family;
    else if (!notes.some((n) => n.includes("couldn't find"))) notes.push(`You don't own anything ${word.toLowerCase()} yet, so I left that out.`);
    break;
  }

  if (/\b(buy|shop|shopping|purchase|order online|should i get)\b/.test(text)) {
    notes.push('FitCheck only works with clothes you already own, so there are no shopping suggestions.');
  }

  return {
    occasionId,
    occasionGuessed: !found,
    date,
    dateLabel,
    stated,
    formalityShift,
    avoidItemIds: [...avoid],
    requireItemIds: [...require],
    preferColorFamily,
    comfortShoes,
    notes,
  };
}

export function answerAsk(text: string, ctx: AskContext): AskAnswer {
  const today = ctx.today ?? todayISO();
  const parse = parseAsk(text, ctx.items, today);
  const notes = [...parse.notes];
  const occasion = OCCASIONS.find((o) => o.id === parse.occasionId)!;

  const forecastDay = ctx.forecast.find((d) => d.date === parse.date) ?? null;
  const weather = parse.stated ? statedWeather(parse.date, parse.stated, forecastDay) : forecastDay;
  if (!weather && ctx.forecast.length && daysBetween(today, parse.date) > 0) {
    notes.push("That day is too far out for a forecast, so weather isn't factored in.");
  }

  const gap = closetGap(ctx.items);
  if (gap) return { parse, weather, outfits: [], message: gap, notes };

  const recentLooks = (ctx.entries ?? [])
    .filter((e) => e.worn && daysBetween(e.wornOn ?? e.date, today) <= 7)
    .map((e) => e.slots.map((s) => s.itemId));

  const base = {
    items: ctx.items,
    occasionId: parse.occasionId,
    weather,
    today,
    formatTemp: ctx.formatTemp,
    count: 3,
    preferColorFamily: parse.preferColorFamily,
    comfortShoes: parse.comfortShoes,
    recentLooks,
  };

  let outfits = generateOutfits({
    ...base,
    avoidItemIds: parse.avoidItemIds,
    requireItemIds: parse.requireItemIds,
    formalityShift: parse.formalityShift,
  });
  if (!outfits.length && parse.avoidItemIds.length) {
    // Leaving those pieces out left nothing to build with, so put them back and say so.
    outfits = generateOutfits({ ...base, requireItemIds: parse.requireItemIds, formalityShift: parse.formalityShift });
    if (outfits.length) notes.push("Leaving those pieces out didn't leave enough for a full look, so I kept them in.");
  }
  if (!outfits.length) outfits = generateOutfits(base);

  if (parse.occasionGuessed) {
    notes.unshift("I wasn't sure of the occasion, so I assumed a casual day. Add \"work\", \"dinner\", \"date\" or \"party\" to change it.");
  }

  const fmt = ctx.formatTemp ?? ((c: number) => `${Math.round(c)}°C`);
  const when = parse.dateLabel === 'today' || parse.dateLabel === 'tomorrow' ? parse.dateLabel : `on ${parse.dateLabel}`;
  const sky = weather
    ? ` (${weather.stated ? 'you said ' : ''}${weather.condition.toLowerCase()}, ${fmt(weather.highC)} / ${fmt(weather.lowC)})`
    : '';
  const message = outfits.length
    ? `For ${occasion.label.toLowerCase()} ${when}${sky}, I'd wear ${outfits[0].name}. ${outfits[0].description}`
    : 'I could not build a full look from your closet for that. Try a different occasion.';

  return { parse, weather, outfits, message, notes };
}

// The requests the product spec uses to judge the engine, offered as one-tap examples.
export const EXAMPLE_ASKS = [
  'What do I wear to a birthday dinner Friday?',
  'Rainy work day, client meeting, nothing too formal',
  "Date night tomorrow, don't repeat last week's dress",
  'Casual weekend, comfortable shoes',
];
