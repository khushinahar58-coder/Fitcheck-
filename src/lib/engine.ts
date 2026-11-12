// The outfit engine. Given the pieces someone owns, an occasion and (optionally) a forecast,
// it builds complete looks and says in one line why it picked each.
//
// It is rules and scoring, not a language model, so it runs in the browser with no key, gives
// the same answer for the same closet, and can only ever use pieces that are in the closet.
//
// How a look is scored (higher is better):
//   occasion   each piece is penalised for being dressier or more casual than the occasion wants
//   cohesion   very dressy and very casual pieces in one look are penalised
//   color      neutrals go with anything; one accent color is good, three is not; one pattern max
//   weather    layers when it is cold, none when it is hot, rain-proof shoes and coats when wet
//   rediscover pieces that have sat 30+ days get a bonus (the point of the product)
//   recency    pieces worn in the last couple of days get a penalty

import type { ClothingItem, DayWeather, OccasionId, Outfit, OutfitSlot } from '../types';
import { attrsOf, roleFor, type Attrs, type Kind } from './attributes';
import { idleDays, RARELY_WORN_DAYS } from './wear';

export interface EngineOptions {
  items: ClothingItem[];
  occasionId: OccasionId;
  weather?: DayWeather | null;
  today?: string;
  count?: number;
  formatTemp?: (celsius: number) => string;
  avoidItemIds?: string[];
  requireItemIds?: string[];
  formalityShift?: number; // negative = more relaxed than the occasion's default
  preferColorFamily?: string;
  comfortShoes?: boolean;
  recentLooks?: string[][]; // item ids of looks worn in the past week, to avoid repeating one
}

interface Piece {
  item: ClothingItem;
  a: Attrs;
  idle: number;
}

interface Candidate {
  top?: Piece;
  bottom?: Piece;
  dress?: Piece;
  mid?: Piece;
  outer?: Piece;
  shoes?: Piece;
  acc: Piece[];
  score: number;
}

interface OccasionProfile {
  lo: number;
  hi: number;
  evening: boolean;
  phrase: string;
}

export const OCCASION_PROFILES: Record<OccasionId, OccasionProfile> = {
  work: { lo: 3.3, hi: 5, evening: false, phrase: 'Polished enough for the office' },
  dinner: { lo: 2.9, hi: 4.6, evening: true, phrase: 'Dressed up without trying too hard' },
  date: { lo: 2.9, hi: 4.6, evening: true, phrase: 'A little dressed up for date night' },
  casual: { lo: 1, hi: 3.3, evening: false, phrase: 'Easy pieces for a relaxed day' },
  party: { lo: 3.2, hi: 5, evening: true, phrase: 'Dressed up for a night out' },
};

export type Chill = 'hot' | 'mild' | 'cool' | 'cold' | 'freezing';

export interface WeatherRead {
  feelC: number;
  chill: Chill;
  rain: boolean;
}

// How the day will feel for this occasion. Evenings lean on the low, daytime on the high.
export function readWeather(weather: DayWeather, evening: boolean): WeatherRead {
  const feelC = evening
    ? (weather.highC + 2 * weather.lowC) / 3
    : (2 * weather.highC + weather.lowC) / 3;
  const chill: Chill =
    feelC >= 24 ? 'hot' : feelC >= 18 ? 'mild' : feelC >= 12 ? 'cool' : feelC >= 5 ? 'cold' : 'freezing';
  return { feelC, chill, rain: weather.rainChance >= 50 };
}

// What each occasion tends to call for, on top of how dressy a piece is. Small nudges only:
// a party leans towards dresses and heels, a day off towards jeans and sneakers.
const STYLE_NUDGE: Record<OccasionId, Partial<Record<Kind, number>>> = {
  work: {
    blazer: 0.5, trousers: 0.4, shirt: 0.4, blouse: 0.4, 'dress-shoes': 0.3, loafers: 0.3, flats: 0.2, heels: 0.2,
    tee: -1, hoodie: -2, 'denim-jacket': -1, 'leather-jacket': -0.5, 'slip-dress': -0.8, shorts: -2,
  },
  dinner: {
    blouse: 0.4, camisole: 0.3, dress: 0.5, 'slip-dress': 0.5, heels: 0.3, boots: 0.2, 'wide-leg': 0.2, skirt: 0.3,
    shirt: 0.3, chinos: 0.2, loafers: 0.3, hoodie: -2,
  },
  date: {
    dress: 0.6, 'slip-dress': 0.7, camisole: 0.4, skirt: 0.4, heels: 0.4, 'leather-jacket': 0.4, shirt: 0.3, boots: 0.2,
    hoodie: -2,
  },
  casual: {
    jeans: 0.6, sneakers: 0.6, tee: 0.5, hoodie: 0.4, 'denim-jacket': 0.5, sweater: 0.3, boots: 0.2, chinos: 0.3,
    polo: 0.3, shorts: 0.3, heels: -1, blazer: -0.5, trousers: -0.5, 'slip-dress': -1, 'dress-shoes': -0.8,
  },
  party: {
    'slip-dress': 1, dress: 0.7, heels: 0.7, camisole: 0.5, skirt: 0.4, 'leather-jacket': 0.4, blazer: 0.3, shirt: 0.3,
    'dress-shoes': 0.3, loafers: 0.2, sweater: -0.8, turtleneck: -0.5, cardigan: -1, sneakers: -0.5, flats: -0.2,
    hoodie: -2,
  },
};

const CATEGORY_WEIGHT = { Tops: 2, Bottoms: 2, Dresses: 2.5, Outerwear: 1.2, Shoes: 2, Accessories: 1 };

function occasionPenalty(p: Piece, lo: number, hi: number): number {
  const f = p.a.formality;
  const gap = f < lo ? lo - f : f > hi ? f - hi : 0;
  return gap * CATEGORY_WEIGHT[p.item.category] * (p.a.flex ? 0.5 : 1) * 2;
}

function rediscoverBonus(p: Piece): number {
  if (p.idle < RARELY_WORN_DAYS) return 0;
  return 1 + (Math.min(p.idle, 120) / 120) * 0.6;
}

function recencyPenalty(p: Piece): number {
  // People repeat shoes and bags without thinking about it; repeating a top is what they notice.
  if (p.a.kind === 'bag' || p.a.kind === 'watch' || p.a.kind === 'belt') return 0;
  const scale = p.item.category === 'Shoes' || p.item.category === 'Accessories' ? 0.4 : 1;
  if (p.idle < 0) return 0;
  if (p.idle <= 1) return 1.5 * scale;
  if (p.idle === 2) return 1 * scale;
  if (p.idle <= 6) return 0.3 * scale;
  return 0;
}

function mainPieces(c: Candidate): Piece[] {
  return [c.top, c.dress, c.mid, c.bottom, c.outer, c.shoes].filter((p): p is Piece => !!p);
}

function allPieces(c: Candidate): Piece[] {
  return [...mainPieces(c), ...c.acc];
}

function isDenim(p: Piece): boolean {
  return p.a.kind === 'jeans' || p.a.kind === 'denim-jacket' || /denim|chambray/.test(p.item.name.toLowerCase());
}

function colorScore(pieces: Piece[]): number {
  let score = 0;
  // Denim reads as a neutral even though it is blue.
  const accents = new Set(
    pieces.filter((p) => !p.a.color.neutral && !isDenim(p)).map((p) => p.a.color.family)
  );
  if (accents.size === 0) score += 0.8;
  else if (accents.size === 1) score += 1.2;
  else if (accents.size === 2) score -= 1.2;
  else score -= 3;

  const patterns = pieces.filter((p) => p.a.color.pattern).length;
  if (patterns > 1) score -= 3;

  const families = pieces.map((p) => p.a.color.family);
  if (families.includes('navy') && families.includes('black')) score -= 0.6;
  // The same strong color top and bottom (olive jacket, olive trousers) reads as a uniform.
  const garments = pieces.filter((p) => p.item.category !== 'Shoes' && p.item.category !== 'Accessories');
  const loud = garments.filter((p) => !p.a.color.neutral && !isDenim(p)).map((p) => p.a.color.family);
  if (new Set(loud).size < loud.length) score -= 1.8;
  if (pieces.filter(isDenim).length > 1) score -= 1.5;
  return score;
}

function weatherScore(c: Candidate, w: WeatherRead | null, occasionId: OccasionId): number {
  if (!w) {
    // No forecast: assume a mild day, and let a blazer finish a work look.
    return c.outer && c.outer.a.kind === 'blazer' && occasionId === 'work' ? 0.4 : c.outer ? -0.3 : 0;
  }
  let score = 0;
  const outer = c.outer;
  const base = c.top ?? c.dress;
  const warmBase = (base?.a.warmth ?? 0) >= 2 || !!c.mid;
  const shoes = c.shoes;

  switch (w.chill) {
    case 'hot':
      if (outer) score -= outer.a.kind === 'blazer' && occasionId === 'work' ? 1.5 : 3;
      if (c.mid) score -= 2;
      if ((base?.a.warmth ?? 0) >= 2) score -= 2;
      if (shoes?.a.kind === 'boots') score -= 0.8;
      break;
    case 'mild':
      if (outer) score -= outer.a.warmth >= 3 ? 2 : outer.a.kind === 'blazer' || outer.a.kind === 'denim-jacket' ? 0 : 0.5;
      break;
    case 'cool':
      score += outer || warmBase ? 1 : -1.5;
      if (outer && c.mid) score -= 0.5;
      break;
    case 'cold':
      if (outer) score += outer.a.warmth >= 3 ? 2 : 1.5;
      else score -= warmBase ? 2.5 : 4;
      if (base?.a.open && !outer) score -= 1;
      if (shoes?.a.open) score -= 2;
      break;
    case 'freezing':
      if (outer) score += outer.a.warmth >= 3 ? 2.5 : outer.a.warmth === 2 ? 1 : -1;
      else score -= 6;
      if (warmBase) score += 1;
      if (shoes?.a.open) score -= 3;
      break;
  }

  if (w.rain) {
    if (outer) score += outer.a.rainOk ? 1.2 : -0.5;
    else if (w.chill !== 'hot') score -= 1.5;
    if (shoes) {
      if (shoes.a.rainOk) score += 1.5;
      else if (shoes.a.open) score -= 3;
      else score -= 1.5;
    }
  }
  return score;
}

function scoreMain(c: Candidate, o: EngineOptions, profile: OccasionProfile, w: WeatherRead | null): number {
  const pieces = mainPieces(c);
  let score = 0;
  for (const p of pieces) {
    score -= occasionPenalty(p, profile.lo, profile.hi);
    score -= recencyPenalty(p);
    score += STYLE_NUDGE[o.occasionId][p.a.kind] ?? 0;
  }
  score += Math.min(3, pieces.reduce((sum, p) => sum + rediscoverBonus(p), 0));

  const core = [c.top, c.dress, c.bottom, c.shoes].filter((p): p is Piece => !!p).map((p) => p.a.formality);
  const spread = Math.max(...core) - Math.min(...core);
  if (spread > 1.8) score -= (spread - 1.8) * 2;

  score += colorScore(pieces);
  score += weatherScore(c, w, o.occasionId);
  // Bare shoulders at work need something over them.
  if (o.occasionId === 'work' && (c.top ?? c.dress)?.a.open && !c.outer && !c.mid) score -= 2.5;

  if (o.preferColorFamily && pieces.some((p) => p.a.color.family === o.preferColorFamily)) score += 1.5;
  if (o.comfortShoes && c.shoes) {
    score += ['sneakers', 'flats', 'boots', 'loafers'].includes(c.shoes.a.kind) ? 1 : -2;
  }
  if (o.recentLooks?.length) {
    const key = [c.top?.item.id, c.dress?.item.id, c.bottom?.item.id].filter(Boolean) as string[];
    if (o.recentLooks.some((look) => key.every((id) => look.includes(id)))) score -= 4;
  }
  return score;
}

const JEWELRY: Kind[] = ['necklace', 'earrings'];

function accessoryGroup(kind: Kind): string {
  return JEWELRY.includes(kind) ? 'jewelry' : kind;
}

function pickAccessories(
  c: Candidate,
  pool: Piece[],
  o: EngineOptions,
  profile: OccasionProfile,
  w: WeatherRead | null,
  required: Set<string>,
  usedBefore: Map<string, number>
): Piece[] {
  const main = mainPieces(c);
  const accentFamilies = new Set(main.filter((p) => !p.a.color.neutral && !isDenim(p)).map((p) => p.a.color.family));
  const sunny = !w || (!w.rain && (o.weather?.code ?? 0) <= 2);

  // Hats only reach this list on a day off, and a cap with a scarf is one accessory too many.
  const hatInPlay = pool.some((p) => p.a.kind === 'hat');

  const scored = pool.map((p) => {
    let s = -occasionPenalty(p, profile.lo, profile.hi) - recencyPenalty(p) + rediscoverBonus(p) * 0.6;
    // The same earrings on every suggested look is not much of a suggestion. Bags are the exception.
    s -= (usedBefore.get(p.item.id) ?? 0) * (p.a.kind === 'bag' ? 0.3 : 1.2);
    if (!p.a.color.neutral && !accentFamilies.has(p.a.color.family) && accentFamilies.size >= 1) s -= 1;
    switch (p.a.kind) {
      case 'bag':
        s += 0.5;
        break;
      case 'earrings':
        s += profile.evening ? 0.6 : 0.1;
        break;
      case 'necklace':
        s += 0.3;
        break;
      case 'watch':
        s += 0.4;
        break;
      case 'belt':
        s += c.bottom && c.bottom.a.kind !== 'skirt' ? 0.3 : -5;
        break;
      case 'scarf': {
        // A silk scarf is a touch of color. A wool one is for warmth, so it waits for cold days.
        const silky = /silk|satin/.test(`${p.item.name} ${(p.item.tags ?? []).join(' ')}`.toLowerCase());
        if (c.top?.a.kind === 'turtleneck') s -= 2;
        if (hatInPlay && w?.chill !== 'freezing') s -= 2;
        if (w?.chill === 'cold' || w?.chill === 'freezing') s += 1;
        else if (w?.chill === 'hot') s -= 2.5;
        else if (!silky) s -= 2;
        else s -= accentFamilies.size === 0 ? 0.2 : 0.6;
        break;
      }
      case 'hat':
        s += sunny || w?.chill === 'freezing' ? 0.9 : 0.5;
        break;
      case 'sunglasses':
        s += sunny && !profile.evening ? 0.5 : -1;
        break;
      case 'tie':
        s += c.top?.a.kind === 'shirt' ? 0.3 : -5;
        break;
      default:
        break;
    }
    return { p, s };
  });

  scored.sort((x, y) => y.s - x.s || x.p.item.id.localeCompare(y.p.item.id));
  const max = o.occasionId === 'party' ? 3 : 2;
  const picked: Piece[] = [];
  const groups = new Set<string>();
  // Pieces the user asked for go in first, whatever they score.
  for (const { p } of scored) {
    if (required.has(p.item.id)) {
      picked.push(p);
      groups.add(accessoryGroup(p.a.kind));
    }
  }
  for (const { p, s } of scored) {
    if (picked.length >= max) break;
    if (s <= 0 || picked.includes(p)) continue;
    const group = accessoryGroup(p.a.kind);
    if (groups.has(group)) continue;
    picked.push(p);
    groups.add(group);
  }
  return picked;
}

function titleFor(c: Candidate): string {
  if (c.dress) {
    const partner = c.outer ?? c.mid ?? c.shoes;
    return partner ? `${c.dress.item.name} + ${partner.item.name}` : c.dress.item.name;
  }
  return `${c.top!.item.name} + ${c.bottom!.item.name}`;
}

function lower(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function reasonsFor(c: Candidate, o: EngineOptions, profile: OccasionProfile, w: WeatherRead | null): string[] {
  const reasons: string[] = [];
  const fmt = o.formatTemp ?? ((celsius: number) => `${Math.round(celsius)}°C`);
  const pieces = allPieces(c);

  const byIdle = (list: Piece[]) => list.filter((p) => p.idle >= RARELY_WORN_DAYS).sort((x, y) => y.idle - x.idle)[0];
  const stalest = byIdle(mainPieces(c)) ?? byIdle(c.acc);
  if (stalest) {
    reasons.push(
      stalest.item.lastWornDaysAgo < 0
        ? `Gives your ${stalest.item.name} its first wear`
        : `Brings back your ${stalest.item.name}, last worn ${stalest.idle} days ago`
    );
  }

  if (w && o.weather) {
    const when = profile.evening ? 'night' : 'day';
    const rainGear = [c.outer, c.shoes].filter((p): p is Piece => !!p && p.a.rainOk).map((p) => p.item.name);
    if (w.rain && rainGear.length) {
      reasons.push(`${rainGear.join(' and ')} for the rain`);
    } else if ((w.chill === 'cold' || w.chill === 'freezing') && c.outer) {
      reasons.push(`${c.outer.item.name} for a ${fmt(profile.evening ? o.weather.lowC : o.weather.highC)} ${when}`);
    } else if (w.chill === 'cool' && (c.outer || c.mid)) {
      reasons.push(`${(c.outer ?? c.mid)!.item.name} as a layer for a ${fmt(w.feelC)} ${when}`);
    } else if (w.chill === 'hot') {
      reasons.push(`Light enough for ${fmt(o.weather.highC)}`);
    }
  }

  if (reasons.length < 2) reasons.push(profile.phrase);

  if (reasons.length < 2) {
    const accents = pieces.filter((p) => !p.a.color.neutral && !isDenim(p));
    reasons.push(accents.length === 0 ? 'All neutrals, so everything goes together' : `One pop of ${lower(accents[0].item.color)}`);
  }
  return reasons;
}

function toOutfit(c: Candidate, index: number, o: EngineOptions, profile: OccasionProfile, w: WeatherRead | null): Outfit {
  const ordered = [c.top, c.dress, c.mid, c.bottom, c.outer, c.shoes, ...c.acc].filter((p): p is Piece => !!p);
  const used = new Map<string, number>();
  const slots: OutfitSlot[] = ordered.map((p) => {
    const role = roleFor(p.item);
    const n = (used.get(role) ?? 0) + 1;
    used.set(role, n);
    return { role: n === 1 ? role : `${role} ${n}`, itemId: p.item.id };
  });
  const reasons = reasonsFor(c, o, profile, w);
  return {
    id: `gen-${o.occasionId}-${ordered.map((p) => p.item.id).join('_')}`,
    occasionId: o.occasionId,
    name: titleFor(c),
    description: reasons.slice(0, 2).join('. ') + '.',
    slots,
    featured: index === 0,
    reasons,
  };
}

// What is missing before any look can be built, or null when the closet is ready.
export function closetGap(items: ClothingItem[]): string | null {
  const has = (category: string) => items.some((i) => i.category === category);
  if (has('Dresses') || (has('Tops') && has('Bottoms'))) return null;
  if (items.length === 0) return 'Your closet is empty. Add a few pieces you already own and FitCheck will start building looks.';
  if (has('Tops')) return 'You have tops but no bottoms yet. Add a pair of pants or a skirt you own to get full looks.';
  if (has('Bottoms')) return 'You have bottoms but no tops yet. Add a top you own to get full looks.';
  return 'Add a top and a bottom, or a dress, that you already own to get full looks.';
}

export function generateOutfits(o: EngineOptions): Outfit[] {
  const count = o.count ?? 4;
  const today = o.today;
  const avoid = new Set(o.avoidItemIds ?? []);
  const required = new Set(o.requireItemIds ?? []);
  const shift = o.formalityShift ?? 0;
  const base = OCCASION_PROFILES[o.occasionId];
  const profile: OccasionProfile = { ...base, lo: Math.max(1, base.lo + shift), hi: Math.min(5, base.hi + shift) };
  const w = o.weather ? readWeather(o.weather, profile.evening) : null;

  const pieces: Piece[] = o.items
    .filter((item) => !avoid.has(item.id) || required.has(item.id))
    .map((item) => ({ item, a: attrsOf(item), idle: idleDays(item, today) }));

  const of = (category: string) => pieces.filter((p) => p.item.category === category);
  const need = (group: Piece[]) => {
    const wanted = group.filter((p) => required.has(p.item.id));
    return wanted.length ? wanted : group;
  };

  // On a big closet, trying every combination would freeze the screen. Only the most promising
  // few of each kind go into the combinations; anything the user asked for always stays in.
  // Small closets (like the starter ones) are under every limit, so nothing is left out.
  const keep = (group: Piece[], limit: number, weatherFit: (p: Piece) => number = () => 0): Piece[] => {
    if (group.length <= limit) return group;
    const worth = (p: Piece) =>
      (required.has(p.item.id) ? 100 : 0) -
      occasionPenalty(p, profile.lo, profile.hi) -
      recencyPenalty(p) +
      rediscoverBonus(p) +
      (STYLE_NUDGE[o.occasionId][p.a.kind] ?? 0) +
      weatherFit(p);
    return [...group].sort((x, y) => worth(y) - worth(x) || x.item.id.localeCompare(y.item.id)).slice(0, limit);
  };
  const cold = w?.chill === 'cold' || w?.chill === 'freezing';
  const warmthFit = (p: Piece) => (w?.chill === 'hot' ? -p.a.warmth : cold ? p.a.warmth * 0.5 : 0);
  const shoeFit = (p: Piece) =>
    (w?.rain ? (p.a.rainOk ? 1.5 : p.a.open ? -3 : -1.5) : 0) + (cold && p.a.open ? -2 : 0);
  const outerFit = (p: Piece) => (w?.rain && p.a.rainOk ? 1.2 : 0) + (cold ? p.a.warmth : 0);

  const allTops = of('Tops');
  const cardigans = keep(allTops.filter((p) => p.a.kind === 'cardigan'), 2);
  const baseTops = allTops.some((p) => p.a.kind !== 'cardigan') ? allTops.filter((p) => p.a.kind !== 'cardigan') : allTops;
  const tops = keep(need(baseTops), 12, warmthFit);
  const bottoms = keep(need(of('Bottoms')), 10);
  const dresses = keep(need(of('Dresses')), 8);
  const shoes = keep(need(of('Shoes')), 6, shoeFit);
  const outers = keep(of('Outerwear'), 6, outerFit);
  // Hats belong to days off (unless the user asked for one).
  const accessories = of('Accessories').filter(
    (p) => p.a.kind !== 'hat' || o.occasionId === 'casual' || required.has(p.item.id)
  );

  const wantsDress = dresses.some((p) => required.has(p.item.id));
  const wantsSeparates = [...tops, ...bottoms].some((p) => required.has(p.item.id));

  const bases: Candidate[] = [];
  if (!wantsDress) {
    for (const top of tops) for (const bottom of bottoms) bases.push({ top, bottom, acc: [], score: 0 });
  }
  if (!wantsSeparates) {
    for (const dress of dresses) bases.push({ dress, acc: [], score: 0 });
  }
  if (bases.length === 0) return [];

  const requiredOuter = outers.filter((p) => required.has(p.item.id));
  const requiredMid = cardigans.filter((p) => required.has(p.item.id));
  const veryCold = w?.chill === 'cold' || w?.chill === 'freezing';

  const candidates: Candidate[] = [];
  for (const b of bases) {
    // A cardigan goes over a light top, or over anything if the user asked for it.
    const mids = cardigans.filter((m) => m !== b.top && ((b.top?.a.warmth ?? 0) < 2 || requiredMid.includes(m)));
    const layerings: Array<{ mid?: Piece; outer?: Piece }> = [{}];
    for (const mid of mids) layerings.push({ mid });
    for (const outer of outers) layerings.push({ outer });
    // Both layers together when it is very cold, or when the user asked for one of each.
    if (veryCold || (requiredMid.length && requiredOuter.length)) {
      for (const mid of mids) for (const outer of outers) layerings.push({ mid, outer });
    }

    const usable = layerings.filter(
      (l) =>
        (requiredOuter.length === 0 || (l.outer && requiredOuter.includes(l.outer))) &&
        (requiredMid.length === 0 || (l.mid && requiredMid.includes(l.mid)))
    );
    for (const layering of usable) {
      for (const shoe of shoes.length ? shoes : [undefined]) {
        const c: Candidate = { ...b, ...layering, shoes: shoe, acc: [], score: 0 };
        c.score = scoreMain(c, o, profile, w);
        candidates.push(c);
      }
    }
  }
  if (candidates.length === 0) return [];

  const keyOf = (c: Candidate) => mainPieces(c).map((p) => p.item.id).join('_');
  candidates.sort((x, y) => y.score - x.score || keyOf(x).localeCompare(keyOf(y)));

  const shortlist = candidates.slice(0, 200);

  // Pick looks that differ from each other: a second look with the same top is rarely useful.
  const chosen: Candidate[] = [];
  const remaining = [...shortlist];
  while (chosen.length < count && remaining.length) {
    let bestIndex = -1;
    let bestAdjusted = -Infinity;
    remaining.forEach((c, i) => {
      let penalty = 0;
      for (const picked of chosen) {
        const hero = c.top ?? c.dress;
        const pickedHero = picked.top ?? picked.dress;
        if (hero === pickedHero) penalty += 3;
        if (c.bottom && c.bottom === picked.bottom) penalty += 1.5;
        if (c.shoes && c.shoes === picked.shoes) penalty += 1.2;
        if (c.outer && c.outer === picked.outer) penalty += 0.8;
      }
      const adjusted = c.score - penalty;
      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIndex = i;
      }
    });
    const [pick] = remaining.splice(bestIndex, 1);
    if (!chosen.some((c) => keyOf(c) === keyOf(pick))) chosen.push(pick);
  }

  // Rediscovery is the product. If none of the first three looks brings back a rarely-worn
  // piece, and a look that does is nearly as good, swap it in.
  const hasStale = (c: Candidate) => mainPieces(c).some((p) => p.idle >= RARELY_WORN_DAYS);
  const firstThree = chosen.slice(0, 3);
  if (firstThree.length && !firstThree.some(hasStale)) {
    const alt = shortlist.find((c) => hasStale(c) && !chosen.includes(c) && c.score >= chosen[0].score - 4);
    if (alt) chosen[Math.min(2, chosen.length - 1)] = alt;
  }

  // Accessories go on last, look by look, so each look gets different ones where the closet allows.
  const usedBefore = new Map<string, number>();
  for (const c of chosen) {
    c.acc = pickAccessories(c, accessories, o, profile, w, required, usedBefore);
    for (const p of c.acc) usedBefore.set(p.item.id, (usedBefore.get(p.item.id) ?? 0) + 1);
  }

  return chosen.map((c, i) => toOutfit(c, i, o, profile, w));
}

export interface WeatherCheck {
  ok: boolean;
  note: string;
}

// Does a finished look suit the forecast? Any fix it suggests names a piece already in the closet.
export function checkOutfitForWeather(
  outfitItems: ClothingItem[],
  closet: ClothingItem[],
  weather: DayWeather,
  occasionId: OccasionId,
  formatTemp: (celsius: number) => string
): WeatherCheck {
  const evening = OCCASION_PROFILES[occasionId].evening;
  const w = readWeather(weather, evening);
  const worn = outfitItems.map((item) => ({ item, a: attrsOf(item) }));
  const wornIds = new Set(outfitItems.map((i) => i.id));
  const spare = closet.filter((i) => !wornIds.has(i.id)).map((item) => ({ item, a: attrsOf(item) }));

  const outer = worn.find((p) => p.item.category === 'Outerwear');
  const shoes = worn.find((p) => p.item.category === 'Shoes');
  const warmLayer = worn.some((p) => p.item.category === 'Tops' && p.a.warmth >= 2);
  const low = formatTemp(weather.lowC);
  const high = formatTemp(weather.highC);

  if (w.rain) {
    if (shoes && !shoes.a.rainOk) {
      const better = spare.find((p) => p.item.category === 'Shoes' && p.a.rainOk);
      return {
        ok: false,
        note: `Rain is likely (${Math.round(weather.rainChance)}%). ${shoes.item.name} may not cope${better ? `; your ${better.item.name} would` : ''}.`,
      };
    }
    if (!outer && w.chill !== 'hot') {
      const coat = spare.find((p) => p.item.category === 'Outerwear' && p.a.rainOk);
      return {
        ok: false,
        note: `Rain is likely (${Math.round(weather.rainChance)}%) and this look has no outer layer${coat ? `. Your ${coat.item.name} would keep you dry` : ''}.`,
      };
    }
  }
  if ((w.chill === 'cold' || w.chill === 'freezing') && !outer) {
    const coat = spare
      .filter((p) => p.item.category === 'Outerwear')
      .sort((x, y) => y.a.warmth - x.a.warmth)[0];
    return {
      ok: false,
      note: `It gets down to ${low} and this look has no outer layer${coat ? `. Your ${coat.item.name} would help` : ''}.`,
    };
  }
  if (w.chill === 'cool' && !outer && !warmLayer) {
    const layer = spare.find((p) => p.item.category === 'Outerwear' || p.a.kind === 'cardigan');
    return {
      ok: false,
      note: `A cool ${evening ? 'evening' : 'day'} (${high} / ${low}). A light layer would help${layer ? `, such as your ${layer.item.name}` : ''}.`,
    };
  }
  if (w.chill === 'hot' && (outer || warmLayer)) {
    return { ok: false, note: `It reaches ${high}. This look may feel warm; you could drop a layer.` };
  }
  return { ok: true, note: `This look suits the forecast: ${weather.condition.toLowerCase()}, ${high} / ${low}.` };
}
