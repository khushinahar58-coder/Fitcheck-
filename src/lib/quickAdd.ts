// "Type what you own": turns a typed or dictated list ("white oxford shirt, dark jeans,
// brown boots") into pieces, each with a category, a color and a drawn picture.
// It is the quick way to fill a closet without photographing every item.

import type { Category, ClothingItem } from '../types';
import { garmentArt } from './art';
import { guessCategory } from './attributes';
import { findColorWord } from './color';

export interface DraftPiece {
  key: string;
  name: string;
  category: Category;
  color: string;
}

const LEADING = /^(?:and\s+)?(?:a|an|my|the|some|one|two|three|a pair of|pair of|pairs of)\s+/i;
const PATTERNS = ['floral', 'striped', 'plaid', 'checked', 'gingham', 'printed', 'leopard', 'polka dot', 'paisley', 'tartan'];

const titleCase = (text: string) => text.replace(/\b[a-z]/g, (c) => c.toUpperCase());

export function parseQuickAdd(text: string): DraftPiece[] {
  const drafts: DraftPiece[] = [];
  const phrases = text
    .split(/[\n,;]+|\s+and\s+(?=(?:a|an|my|the|two|some)\s)/i)
    .map((p) => p.trim().replace(/[.!]+$/, ''))
    .filter(Boolean);

  phrases.forEach((raw, index) => {
    let phrase = raw.replace(/\s+/g, ' ');
    while (LEADING.test(phrase)) phrase = phrase.replace(LEADING, '');
    if (phrase.length < 2 || phrase.length > 60) return;

    const colorWord = findColorWord(phrase);
    const pattern = PATTERNS.find((p) => phrase.toLowerCase().includes(p));
    const color = [pattern ? titleCase(pattern) : '', colorWord].filter(Boolean).join(' ') || 'Not specified';

    // "navy blazer" becomes a Blazer whose color is Navy, like the starter pieces.
    let name = phrase;
    if (colorWord) {
      const stripped = phrase.replace(new RegExp(`\\b${colorWord}\\b\\s*`, 'i'), '').trim();
      if (stripped.length >= 3) name = stripped;
    }
    drafts.push({ key: `${index}-${raw}`, name: titleCase(name.toLowerCase()), category: guessCategory(phrase), color });
  });
  return drafts;
}

export function draftToItem(draft: DraftPiece): Omit<ClothingItem, 'id'> {
  const tags = ['typed'];
  return {
    name: draft.name,
    category: draft.category,
    color: draft.color,
    brand: 'Unknown',
    lastWornDaysAgo: -1,
    tags,
    image: garmentArt({ name: draft.name, category: draft.category, color: draft.color, tags }),
  };
}
