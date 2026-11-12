// Reads what a piece *is* from its name and tags: the kind of garment, how dressy it is,
// how warm it is, and whether it copes with rain. The outfit engine, the 3D figure and
// "type what you own" all use this, so a piece added by hand works the same as a starter piece.

import type { Category, ClothingItem } from '../types';
import { colorInfo, type ColorInfo } from './color';

export type Kind =
  // Tops
  | 'tee' | 'polo' | 'shirt' | 'blouse' | 'camisole' | 'sweater' | 'turtleneck' | 'cardigan' | 'hoodie' | 'top'
  // Bottoms
  | 'jeans' | 'trousers' | 'wide-leg' | 'chinos' | 'shorts' | 'skirt' | 'joggers' | 'pants'
  // Dresses
  | 'slip-dress' | 'dress'
  // Outerwear
  | 'blazer' | 'trench' | 'coat' | 'puffer' | 'leather-jacket' | 'denim-jacket' | 'rain-jacket' | 'jacket'
  // Shoes
  | 'heels' | 'boots' | 'sneakers' | 'loafers' | 'dress-shoes' | 'flats' | 'sandals' | 'shoes'
  // Accessories
  | 'bag' | 'necklace' | 'earrings' | 'scarf' | 'hat' | 'belt' | 'watch' | 'sunglasses' | 'tie' | 'accessory';

export interface Attrs {
  kind: Kind;
  formality: number; // 1 (gym) to 5 (black tie)
  warmth: number; // 0 (bare) to 3 (winter coat)
  flex: boolean; // goes with most levels of dress (bags, belts, watches, trench coats)
  rainOk: boolean; // fine to wear in the rain
  open: boolean; // leaves feet or shoulders exposed
  color: ColorInfo;
}

interface Rule {
  re: RegExp;
  kind: Kind;
  formality: number;
  warmth: number;
  flex?: boolean;
  rainOk?: boolean;
  open?: boolean;
}

// First match wins, so the specific patterns sit above the general ones.
const RULES: Record<Category, Rule[]> = {
  Tops: [
    { re: /camisole|\bcami\b|tank|bralette|halter/, kind: 'camisole', formality: 3, warmth: 0, open: true },
    { re: /turtleneck|mock[- ]?neck|roll[- ]?neck/, kind: 'turtleneck', formality: 3.5, warmth: 2 },
    { re: /cardigan/, kind: 'cardigan', formality: 3, warmth: 2 },
    { re: /hoodie|sweatshirt/, kind: 'hoodie', formality: 1.5, warmth: 2 },
    { re: /sweater|jumper|crewneck|pullover|cashmere|quarter[- ]?zip|knit/, kind: 'sweater', formality: 3.3, warmth: 2 },
    { re: /t-?shirt|\btee\b|graphic/, kind: 'tee', formality: 1.6, warmth: 1 },
    { re: /polo/, kind: 'polo', formality: 2.8, warmth: 1 },
    { re: /blouse/, kind: 'blouse', formality: 4, warmth: 1 },
    { re: /shirt|oxford|button[- ]?(down|up)|chambray|flannel/, kind: 'shirt', formality: 3.7, warmth: 1 },
    { re: /./, kind: 'top', formality: 3, warmth: 1 },
  ],
  Bottoms: [
    { re: /shorts/, kind: 'shorts', formality: 1.5, warmth: 0 },
    { re: /legging|jogger|sweatpant|track/, kind: 'joggers', formality: 1.2, warmth: 1 },
    { re: /skirt/, kind: 'skirt', formality: 3.5, warmth: 0 },
    { re: /jeans|denim/, kind: 'jeans', formality: 2.2, warmth: 1 },
    { re: /wide[- ]?leg|palazzo|culotte/, kind: 'wide-leg', formality: 3.5, warmth: 1 },
    { re: /tailored|trouser|slacks|suit|dress pants/, kind: 'trousers', formality: 4.3, warmth: 1 },
    { re: /chino|khaki/, kind: 'chinos', formality: 3, warmth: 1 },
    { re: /./, kind: 'pants', formality: 3, warmth: 1 },
  ],
  Dresses: [
    { re: /slip|satin|silk/, kind: 'slip-dress', formality: 4, warmth: 0, open: true },
    { re: /gown|cocktail|evening/, kind: 'dress', formality: 4.8, warmth: 0 },
    { re: /sundress|t-?shirt dress|beach/, kind: 'dress', formality: 2.4, warmth: 0 },
    { re: /sweater dress|knit dress/, kind: 'dress', formality: 3.3, warmth: 2 },
    { re: /./, kind: 'dress', formality: 3.4, warmth: 1 },
  ],
  Outerwear: [
    { re: /blazer|sport ?coat|suit jacket/, kind: 'blazer', formality: 4.5, warmth: 2 },
    { re: /trench|mac\b/, kind: 'trench', formality: 3.6, warmth: 2, flex: true, rainOk: true },
    { re: /rain|shell|windbreaker|anorak/, kind: 'rain-jacket', formality: 2, warmth: 1, flex: true, rainOk: true },
    { re: /puffer|parka|down\b/, kind: 'puffer', formality: 2, warmth: 3, flex: true, rainOk: true },
    { re: /overcoat|topcoat|peacoat|coat/, kind: 'coat', formality: 3.8, warmth: 3, flex: true, rainOk: true },
    { re: /leather|moto|biker/, kind: 'leather-jacket', formality: 2.6, warmth: 2 },
    { re: /denim|jean/, kind: 'denim-jacket', formality: 1.6, warmth: 1 },
    { re: /./, kind: 'jacket', formality: 2.6, warmth: 2 },
  ],
  Shoes: [
    { re: /heel|pump|stiletto/, kind: 'heels', formality: 4.5, warmth: 0, open: true },
    { re: /boot/, kind: 'boots', formality: 3, warmth: 1, rainOk: true },
    { re: /sneaker|trainer|runner|running/, kind: 'sneakers', formality: 1.6, warmth: 1, rainOk: true },
    { re: /loafer|moccasin/, kind: 'loafers', formality: 3.8, warmth: 1 },
    { re: /oxford|derby|brogue|dress shoe|wingtip/, kind: 'dress-shoes', formality: 4.5, warmth: 1 },
    { re: /flat|ballet|mule/, kind: 'flats', formality: 3.5, warmth: 0 },
    { re: /sandal|slide|flip/, kind: 'sandals', formality: 1.6, warmth: 0, open: true },
    { re: /./, kind: 'shoes', formality: 3, warmth: 1 },
  ],
  Accessories: [
    { re: /clutch/, kind: 'bag', formality: 4.2, warmth: 0 },
    { re: /backpack/, kind: 'bag', formality: 1.8, warmth: 0 },
    { re: /bag|handbag|tote|purse|crossbody|satchel|briefcase/, kind: 'bag', formality: 3, warmth: 0, flex: true },
    { re: /earring/, kind: 'earrings', formality: 4, warmth: 0 },
    { re: /necklace|pendant|chain/, kind: 'necklace', formality: 3.5, warmth: 0, flex: true },
    { re: /scarf|shawl|wrap/, kind: 'scarf', formality: 3.3, warmth: 1, flex: true },
    { re: /beanie/, kind: 'hat', formality: 1.4, warmth: 1 },
    { re: /\bhat\b|\bcap\b|fedora|bucket/, kind: 'hat', formality: 1.3, warmth: 0 },
    { re: /belt/, kind: 'belt', formality: 3, warmth: 0, flex: true },
    { re: /watch/, kind: 'watch', formality: 3.5, warmth: 0, flex: true },
    { re: /sunglass|shades/, kind: 'sunglasses', formality: 2.5, warmth: 0, flex: true },
    { re: /\btie\b|bow ?tie/, kind: 'tie', formality: 4.8, warmth: 0 },
    { re: /./, kind: 'accessory', formality: 3, warmth: 0, flex: true },
  ],
};

export function attrsOf(item: Pick<ClothingItem, 'name' | 'category' | 'color' | 'tags'>): Attrs {
  const text = `${item.name} ${(item.tags ?? []).join(' ')}`.toLowerCase();
  const rule = RULES[item.category].find((r) => r.re.test(text))!;
  let formality = rule.formality;
  if (/silk|satin|cashmere|merino|tailored/.test(text) && rule.kind !== 'trousers') formality += 0.3;
  if (/graphic|distressed|ripped|gym|athletic/.test(text)) formality -= 0.5;
  if (/suede|canvas/.test(text) && item.category === 'Shoes') formality -= 0.3;
  return {
    kind: rule.kind,
    formality: Math.min(5, Math.max(1, formality)),
    warmth: rule.warmth,
    flex: rule.flex ?? false,
    rainOk: (rule.rainOk ?? false) && !/suede|canvas|white/.test(text + ' ' + item.color.toLowerCase()),
    open: rule.open ?? false,
    color: colorInfo(item.color),
  };
}

// Which shelf a typed phrase belongs on ("navy blazer" -> Outerwear). Used by "type what you own".
// Order matters: "denim jacket" must reach Outerwear before Bottoms sees "denim".
const CATEGORY_HINTS: Array<[Category, RegExp]> = [
  ['Dresses', /dress(?! (shirt|shoe|pant))|gown|jumpsuit|romper/],
  ['Outerwear', /blazer|coat|jacket|trench|parka|puffer|windbreaker|anorak|shell\b|vest|gilet/],
  ['Shoes', /shoe|sneaker|trainer|boot|heel|pump|loafer|sandal|flat\b|flats|oxfords|derb(y|ies)|brogue|slide|mule|runner/],
  ['Accessories', /\bbag\b|handbag|tote|purse|crossbody|clutch|backpack|necklace|earring|bracelet|ring\b|scarf|\bhat\b|\bcap\b|beanie|belt|watch|sunglass|\btie\b|glove|sock/],
  ['Bottoms', /jeans|pants|trouser|slacks|chino|khakis|shorts|skirt|legging|jogger|sweatpant|denim/],
  ['Tops', /./],
];

export function guessCategory(phrase: string): Category {
  const text = phrase.toLowerCase();
  return CATEGORY_HINTS.find(([, re]) => re.test(text))![0];
}

// The label an outfit slot shows for this piece ("Top", "Layer", "Bag").
export function roleFor(item: ClothingItem): string {
  const { kind } = attrsOf(item);
  switch (item.category) {
    case 'Tops':
      return kind === 'cardigan' ? 'Layer' : 'Top';
    case 'Bottoms':
      return 'Bottom';
    case 'Dresses':
      return 'Dress';
    case 'Outerwear':
      return 'Outerwear';
    case 'Shoes':
      return 'Shoes';
    case 'Accessories': {
      const labels: Partial<Record<Kind, string>> = {
        bag: 'Bag',
        necklace: 'Necklace',
        earrings: 'Earrings',
        scarf: 'Scarf',
        hat: 'Hat',
        belt: 'Belt',
        watch: 'Watch',
        sunglasses: 'Sunglasses',
        tie: 'Tie',
      };
      return labels[kind] ?? 'Accessory';
    }
  }
}
