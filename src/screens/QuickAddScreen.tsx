import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Keyboard, X } from 'lucide-react';
import type { Category, ClothingItem } from '../types';
import { CATEGORIES } from '../data';
import { draftToItem, parseQuickAdd } from '../lib/quickAdd';
import type { Screen } from '../App';

interface Props {
  onAddItems: (items: Array<Omit<ClothingItem, 'id'>>) => void;
  onNavigate: (s: Screen) => void;
  onBack: () => void;
  currentCount: number;
}

const EDITABLE_CATEGORIES = CATEGORIES.filter((c): c is Category => c !== 'All');
const EXAMPLE = 'white oxford shirt, dark jeans, grey crewneck sweater, navy blazer, brown chelsea boots, black belt';

export default function QuickAddScreen({ onAddItems, onNavigate, onBack, currentCount }: Props) {
  const [text, setText] = useState('');
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [categoryFix, setCategoryFix] = useState<Record<string, Category>>({});
  const [added, setAdded] = useState<number | null>(null);

  const drafts = useMemo(
    () =>
      parseQuickAdd(text)
        .filter((d) => !removed.has(d.key))
        .map((d) => ({ ...d, category: categoryFix[d.key] ?? d.category })),
    [text, removed, categoryFix]
  );

  const addAll = () => {
    if (!drafts.length) return;
    onAddItems(drafts.map(draftToItem));
    setAdded(drafts.length);
    setTimeout(() => onNavigate('wardrobe'), 1400);
  };

  return (
    <div className="animate-fade-in min-h-screen">
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors"
          >
            <ArrowLeft size={18} className="text-ink-700" />
          </button>
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-ink-500" />
            <span className="text-sm text-ink-400">Type what you own</span>
          </div>
        </div>
        <h1 className="text-[26px] font-serif text-ink-900 leading-tight">List your clothes</h1>
        <p className="text-sm text-ink-400 mt-1 leading-relaxed">
          One piece per line, or separated by commas. Say the color and what it is. FitCheck sorts each one and draws
          it; you can add a photo later.
        </p>
      </div>

      <div className="px-6">
        <label htmlFor="quick-add" className="sr-only">
          Your clothes
        </label>
        <textarea
          id="quick-add"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={EXAMPLE}
          className="w-full px-4 py-3 rounded-2xl bg-white border border-cream-300 text-base text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-ink-400 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-ink-300">Tip: the microphone on your keyboard works too.</p>
          {!text && (
            <button onClick={() => setText(EXAMPLE)} className="text-xs font-medium text-clay-600">
              Fill in an example
            </button>
          )}
        </div>
      </div>

      {drafts.length > 0 && (
        <div className="px-6 pt-6 pb-32">
          <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">
            {drafts.length} {drafts.length === 1 ? 'piece' : 'pieces'} ready
          </h3>
          <div className="space-y-2.5">
            {drafts.map((draft) => (
              <div
                key={draft.key}
                className="flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-cream-200/60"
                data-testid="draft-piece"
              >
                <img
                  src={draftToItem(draft).image}
                  alt=""
                  className="w-14 h-[74px] rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-ink-800 truncate">{draft.name}</h4>
                  <p className="text-xs text-ink-300 truncate">{draft.color}</p>
                  <label className="sr-only" htmlFor={`cat-${draft.key}`}>
                    Category for {draft.name}
                  </label>
                  <select
                    id={`cat-${draft.key}`}
                    value={draft.category}
                    onChange={(e) => setCategoryFix((prev) => ({ ...prev, [draft.key]: e.target.value as Category }))}
                    className="mt-1 text-xs text-ink-600 bg-cream-200/70 rounded-lg px-2 py-1 border-0 focus:outline-none"
                  >
                    {EDITABLE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setRemoved((prev) => new Set([...prev, draft.key]))}
                  aria-label={`Leave out ${draft.name}`}
                  className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0"
                >
                  <X size={14} className="text-ink-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-6 pt-3 pb-6 bg-cream-50/95 backdrop-blur-xl border-t border-cream-300 z-50 safe-bottom">
          <button
            onClick={addAll}
            className="w-full py-4 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Add {drafts.length} {drafts.length === 1 ? 'piece' : 'pieces'} to my closet
          </button>
          <p className="text-[11px] text-ink-300 text-center mt-2">
            You have {currentCount} {currentCount === 1 ? 'piece' : 'pieces'} now
          </p>
        </div>
      )}

      {added !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-cream-50/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-sage-500 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-cream-50" />
            </div>
            <h2 className="text-xl font-serif text-ink-900">
              {added} {added === 1 ? 'piece' : 'pieces'} added
            </h2>
            <p className="text-sm text-ink-400 mt-1">Opening your wardrobe</p>
          </div>
        </div>
      )}
    </div>
  );
}
