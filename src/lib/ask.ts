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
import { forecastFor, statedWeather } from './weather';
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

// One question and its answer, as shown on the Ask screen.
export interface AskTurn {
  id: number;
  question: string;
  answer: AskAnswer;
}

const OCCASION_PATTERNS: Array<[OccasionId, RegExp]> = [
  ['date', /\b(date night|first date|second date|a date|my date|anniversary|romantic)\b/],
  ['dinner', /\b(dinner|restaurant|supper)\b/],
  ['party', /\b(party|wedding|club|clubbing|night out|drinks|celebration|gala|cocktails?|concert|birthday)\b/],
  ['work', /\b(work|office|meeting|client|interview|presentation|conference|business|boss|coworkers?)\b/],
  ['casual', /\b(casual|weekend|brunch|coffee|errands|class|lecture|park|walk|grocer(y|ies)|relax|hang(ing)? out|day off|travel|airport|flight|lunch|movie|game)\b/],
];

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY = `(?:${WEEKDAYS.join('|')})`;

// Whole words only: "that" must not count as a "hat".
const GARMENT_WORD =
  /\b(?:dress(?:es)?|blazers?|coats?|jackets?|trench|sweaters?|cardigans?|turtlenecks?|shirts?|blouses?|tees?|tops?|camisoles?|polos?|hoodies?|jeans|pants|trousers?|chinos?|shorts|skirts?|shoes?|sneakers?|boots?|heels?|loafers?|flats|sandals?|bags?|handbags?|scar(?:f|ves)|hats?|caps?|belts?|watch(?:es)?|necklaces?|earrings?|ties?|suits?)\b/;

// Words that end a description of a piece: "my cardigan | with my trench coat".
const STOP = 'with|and|but|for|to|on|in|at|use|using|wear|wearing|tonight|tomorrow|today|because|since|that|which|please|i|it|is|was';
const WORD = `(?!(?:${STOP})\\b)[a-z-]+`;

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

// The piece a run of words describes: everything up to its last clothing word.
// "black dress shoes tonight" -> "black dress shoes". Null when no clothing word is in it.
function garmentPhrase(words: string[]): string | null {
  let last = -1;
  words.forEach((w, i) => {
    if (GARMENT_WORD.test(w)) last = i;
  });
  return last < 0 ? null : words.slice(0, last + 1).join(' ');
}

function parseDate(text: string, today: string): { date: string; label: string } {
  const weekday = new Date(today + 'T00:00:00').getDay();
  const label = (date: string) =>
    date === today
      ? 'today'
      : date === addDays(today, 1)
        ? 'tomorrow'
        : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // "the dress I wore on Monday" and "last Friday" are about the past, not the plan.
  const plan = text
    .replace(new RegExp(`\\b(?:wore|worn)\\b[^.,;!?]*?\\b${WEEKDAY}\\b`, 'g'), ' ')
    .replace(new RegExp(`\\blast ${WEEKDAY}\\b`, 'g'), ' ');

  let date = today;
  const inDays = plan.match(/\bin (\d{1,2}) days?\b/);
  const named = plan.match(new RegExp(`\\b(next |this |on )?(${WEEKDAY})\\b`));
  if (/\btomorrow\b/.test(plan)) {
    date = addDays(today, 1);
  } else if (/\b(tonight|today|this (?:morning|afternoon|evening))\b/.test(plan)) {
    date = today;
  } else if (inDays) {
    date = addDays(today, Number(inDays[1]));
  } else if (named) {
    const target = WEEKDAYS.indexOf(named[2]);
    let ahead = (target - weekday + 7) % 7;
    // "next Friday" means the one in the following week.
    if (named[1]?.trim() === 'next') ahead += ahead === 0 ? 7 : weekday < target ? 7 : 0;
    date = addDays(today, ahead);
  } else if (/\b(this |the |next )?weekend\b/.test(plan)) {
    date = weekday === 6 || weekday === 0 ? today : addDays(today, 6 - weekday);
  }
  return { date, label: label(date) };
}

function parseWeather(text: string): StatedWeather | undefined {
  // "baby shower", "hot date" and "hot pink" are not weather.
  if (/\b(rain|rainy|raining|wet|storm|stormy|drizzle|drizzly|pouring|downpour|rain showers?)\b/.test(text)) return 'rain';
  if (/\b(snow|snowy|snowing)\b/.test(text)) return 'snow';
  if (/\b(cold|freezing|chilly|frigid)\b(?! shoulder)/.test(text)) return 'cold';
  if (
    /\bhot (day|out|outside|weather|today|tonight|tomorrow|one)\b|\b(it's|it is|its|be|really|very|so|too|super) hot\b|\b(heat ?wave|sweltering|humid|warm out|scorching)\b/.test(
      text
    )
  ) {
    return 'hot';
  }
  return undefined;
}

export function parseAsk(rawText: string, items: ClothingItem[], today: string = todayISO()): AskParse {
  const text = ` ${rawText.toLowerCase().replace(/[’‘]/g, "'")} `;
  const notes: string[] = [];

  const found = OCCASION_PATTERNS.find(([, re]) => re.test(text));
  const occasionId: OccasionId = found?.[0] ?? 'casual';
  const { date, label: dateLabel } = parseDate(text, today);
  const stated = parseWeather(text);

  let formalityShift = 0;
  const relaxed = /\b(not|nothing|isn't|not too|n't)\s+(too |very |super |that |so )?(formal|dressy|fancy|stuffy)\b|\b(relaxed|laid[- ]back|low[- ]key|comfy|comfortable|chill)\b/;
  if (relaxed.test(text)) formalityShift = -0.6;
  else if (/\b(formal|dressy|fancy|sharp|polished|elegant|dress up|dressed up|smart)\b/.test(text)) formalityShift = 0.5;

  const comfortShoes = /\b(comfortable|comfy) shoes\b|\bwalking\b|\bon my feet\b|\bstanding all\b/.test(text);

  // "no heels", "without a jacket", "I don't want to wear my blazer": leave those pieces out.
  const avoid = new Set<string>();
  const negations = text.matchAll(
    new RegExp(
      `\\b(?:no|without|skip|except|not wearing|(?:don't|do not|won't|never) (?:want to )?wear(?:ing)?|don't want|not)\\s+((?:(?:${WORD}|or)\\s?){1,7})`,
      'g'
    )
  );
  for (const m of negations) {
    // "no heels or flats" names two things.
    for (const part of m[1].split(/\s+or\s+/)) {
      const phrase = garmentPhrase(part.trim().split(/\s+/));
      if (phrase) matchItems(phrase, items).forEach((i) => avoid.add(i.id));
    }
  }

  // "don't repeat last week's dress": leave out what was worn recently.
  if (/\b(don't|do not|not|no|without) repeat(ing)?\b|\bsomething (new|different)\b|\bhaven't worn\b|\bnot the same\b/.test(text)) {
    const about = text.match(/repeat(?:ing)?\s+(?:[a-z']+\s){0,4}?(dress|top|shirt|sweater|jacket|coat|shoes|skirt|pants|jeans)\b/);
    const recent = items.filter((i) => i.lastWornDaysAgo >= 0 && i.lastWornDaysAgo <= (about ? 14 : 7));
    const scoped = about ? matchItems(about[1], recent) : recent.filter((i) => ['Tops', 'Bottoms', 'Dresses'].includes(i.category));
    scoped.forEach((i) => avoid.add(i.id));
    if (scoped.length) notes.push(`Left out ${scoped.length === 1 ? scoped[0].name : `${scoped.length} pieces`} you wore recently.`);
  }

  // "with my trench coat", "wear the black blazer": build the look around that piece.
  const require = new Set<string>();
  const asks = text.matchAll(
    new RegExp(`\\b(?:wear|wearing|with|use|using|include|around|style|styling)\\s+(?:my|the|that|those)\\s+((?:${WORD}\\s?){1,4})`, 'g')
  );
  for (const m of asks) {
    // "I don't want to wear my blazer" was handled above as something to leave out.
    const before = text.slice(Math.max(0, m.index - 30), m.index);
    if (/\b(don't|do not|not|never|won't|no|without)\b[^.,;!?]*$/.test(before)) continue;
    const phrase = garmentPhrase(m[1].trim().split(/\s+/));
    if (!phrase) continue; // "with my friends"
    const hits = matchItems(phrase, items).filter((i) => !avoid.has(i.id));
    if (hits.length) require.add(hits[0].id);
    else notes.push(`I couldn't find "${phrase}" in your closet, so this uses what you own.`);
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

  const forecastDay = forecastFor(ctx.forecast, parse.date);
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
  const nameOf = (id: string) => ctx.items.find((i) => i.id === id)?.name ?? 'that piece';

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
  if (!outfits.length) {
    outfits = generateOutfits(base);
    if (outfits.length && parse.requireItemIds.length) {
      notes.push(`I couldn't build a full look around your ${parse.requireItemIds.map(nameOf).join(' and ')}, so these looks leave ${parse.requireItemIds.length === 1 ? 'it' : 'them'} out.`);
    }
  } else if (parse.requireItemIds.length > 1) {
    // Two jackets cannot both go on. Say which asked-for piece did not make it into the first look.
    const worn = new Set(outfits[0].slots.map((s) => s.itemId));
    const missing = parse.requireItemIds.filter((id) => !worn.has(id));
    if (missing.length) notes.push(`I couldn't fit your ${missing.map(nameOf).join(' and ')} into the same look.`);
  }

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
