// Turns a free-text color ("Oxford Navy corduroy", "Floral Blue") into something the
// outfit engine and the 3D figure can use: a hex value, a color family, and whether it
// behaves as a neutral (goes with anything) or carries a pattern.

export interface ColorInfo {
  hex: string;
  family: string;
  neutral: boolean;
  pattern: boolean;
  known: boolean; // false when no color word was recognised
}

// Longer phrases first, so "light blue" wins over "blue".
const COLORS: Array<[string, string, string, boolean]> = [
  // phrase, hex, family, neutral
  ['off-white', '#F1ECE2', 'white', true],
  ['off white', '#F1ECE2', 'white', true],
  ['light blue', '#A9C4DE', 'blue', false],
  ['sky blue', '#A9C4DE', 'blue', false],
  ['mid-blue', '#4F6F97', 'blue', false],
  ['mid blue', '#4F6F97', 'blue', false],
  ['dark blue', '#27375A', 'navy', true],
  ['indigo', '#2E3F63', 'navy', true],
  ['navy', '#1F2A44', 'navy', true],
  ['denim', '#4F6F97', 'blue', false],
  ['chambray', '#8EA9C6', 'blue', false],
  ['charcoal', '#3B3B3F', 'grey', true],
  ['heather', '#A3A3A6', 'grey', true],
  ['grey', '#8E8E91', 'grey', true],
  ['gray', '#8E8E91', 'grey', true],
  ['silver', '#C0C0C4', 'metal', true],
  ['steel', '#A9ADB3', 'metal', true],
  ['black', '#1F1D1B', 'black', true],
  ['white', '#F6F4EF', 'white', true],
  ['ivory', '#F3ECDD', 'white', true],
  ['cream', '#EFE6D3', 'cream', true],
  ['ecru', '#EDE3CC', 'cream', true],
  ['oatmeal', '#D9CDB8', 'cream', true],
  ['champagne', '#E6D3B1', 'cream', true],
  ['beige', '#D6C3A5', 'beige', true],
  ['sand', '#D6C3A5', 'beige', true],
  ['stone', '#CFC6B4', 'beige', true],
  ['khaki', '#B9A47C', 'beige', true],
  ['taupe', '#9C8B7A', 'beige', true],
  ['camel', '#B5834F', 'brown', true],
  ['tan', '#B98B5E', 'brown', true],
  ['cognac', '#8B4A26', 'brown', true],
  ['chocolate', '#4E3324', 'brown', true],
  ['brown', '#6B4630', 'brown', true],
  ['burgundy', '#6E1F2B', 'red', false],
  ['maroon', '#6E1F2B', 'red', false],
  ['wine', '#6E1F2B', 'red', false],
  ['rust', '#A8502A', 'orange', false],
  ['terracotta', '#B8623F', 'orange', false],
  ['orange', '#D9702E', 'orange', false],
  ['red', '#B3262C', 'red', false],
  ['blush', '#E8BFC0', 'pink', false],
  ['rose', '#D98C99', 'pink', false],
  ['pink', '#E3A6B1', 'pink', false],
  ['mustard', '#C99A2E', 'yellow', false],
  ['yellow', '#E3C545', 'yellow', false],
  ['gold', '#C9A24A', 'metal', true],
  ['olive', '#5B6236', 'green', false],
  ['sage', '#9AA888', 'green', false],
  ['forest', '#2F5236', 'green', false],
  ['emerald', '#1F7A55', 'green', false],
  ['green', '#3E7A4E', 'green', false],
  ['teal', '#2F7A78', 'teal', false],
  ['turquoise', '#3FA7A3', 'teal', false],
  ['lavender', '#B9A6D6', 'purple', false],
  ['lilac', '#B9A6D6', 'purple', false],
  ['purple', '#6B4A8C', 'purple', false],
  ['plum', '#5A2F4E', 'purple', false],
  ['blue', '#3F6AA8', 'blue', false],
  // Last, so any real color word wins: "dark jeans", "dark coat".
  ['dark', '#2E3440', 'grey', true],
];

const PATTERN_WORDS = ['floral', 'stripe', 'striped', 'plaid', 'check', 'gingham', 'print', 'leopard', 'polka', 'paisley', 'tartan'];

// Whole words only: "tan" must not match inside "tartan", or "red" inside "colored".
const RE_CACHE = new Map<string, RegExp>();
function wordRe(phrase: string): RegExp {
  let re = RE_CACHE.get(phrase);
  if (!re) {
    re = new RegExp(`\\b${phrase}\\b`);
    RE_CACHE.set(phrase, re);
  }
  return re;
}

export function colorInfo(color: string): ColorInfo {
  const text = (color || '').toLowerCase();
  const pattern = PATTERN_WORDS.some((w) => text.includes(w));
  for (const [phrase, hex, family, neutral] of COLORS) {
    if (wordRe(phrase).test(text)) return { hex, family, neutral, pattern, known: true };
  }
  if (pattern) return { hex: '#C9879A', family: 'pink', neutral: false, pattern, known: true };
  return { hex: '#B8AFA3', family: 'unknown', neutral: true, pattern: false, known: false };
}

// The first color word in a phrase, in title case, or '' when there is none.
export function findColorWord(text: string): string {
  const lower = text.toLowerCase();
  for (const [phrase] of COLORS) {
    const at = lower.search(wordRe(phrase));
    if (at >= 0) return text.slice(at, at + phrase.length).replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return '';
}

export function isLightHex(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}
