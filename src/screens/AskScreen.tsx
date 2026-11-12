import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Heart, Info, MessageCircle, Plus } from 'lucide-react';
import type { CalendarEntry, ClothingItem, Outfit } from '../types';
import { OCCASIONS } from '../data';
import { getItemById } from '../store';
import { answerAsk, EXAMPLE_ASKS, type AskTurn } from '../lib/ask';
import { useApp } from '../lib/appContext';
import FigureCard from '../components/FigureCard';
import type { AvatarConfig } from '../lib/profiles';
import type { ConfirmationContext, Screen } from '../App';

interface Props {
  items: ClothingItem[];
  calendarEntries: CalendarEntry[];
  turns: AskTurn[];
  onTurnsChange: (update: (prev: AskTurn[]) => AskTurn[]) => void;
  onBack: () => void;
  onConfirmOutfit: (ctx: ConfirmationContext) => void;
  onNavigate: (s: Screen) => void;
}

// The 3D view is only created when someone opens it, so a long conversation does not
// pile up WebGL canvases.
function FigureToggle({ items, avatar }: { items: ClothingItem[]; avatar: AvatarConfig }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-xs font-medium text-clay-600">
        {open ? 'Hide the figure' : 'See it on a figure'}
      </button>
      {open && (
        <div className="mt-3">
          <FigureCard items={items} avatar={avatar} heightClass="h-72" />
        </div>
      )}
    </div>
  );
}

type Turn = AskTurn;

export default function AskScreen({ items, calendarEntries, turns, onTurnsChange, onBack, onConfirmOutfit, onNavigate }: Props) {
  const { forecast, fmt, fmtShort, profile } = useApp();
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const ask = (text: string) => {
    const question = text.trim();
    if (question.length < 2) return;
    const answer = answerAsk(question, { items, forecast, entries: calendarEntries, formatTemp: fmt });
    onTurnsChange((prev) => [...prev, { id: Date.now(), question, answer }]);
    setDraft('');
  };

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [turns.length]);

  const wear = (turn: Turn, outfit: Outfit) => {
    const occasion = OCCASIONS.find((o) => o.id === turn.answer.parse.occasionId)!;
    onConfirmOutfit({
      occasionId: occasion.id,
      occasionLabel: occasion.label,
      outfitId: outfit.id,
      outfitName: outfit.name,
      slots: outfit.slots,
      planDate: turn.answer.parse.date,
      weather: turn.answer.weather,
      backTo: 'ask',
    });
  };

  return (
    <div className="animate-fade-in min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 sticky top-0 bg-cream-50/95 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors"
          >
            <ArrowLeft size={18} className="text-ink-700" />
          </button>
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-ink-500" />
            <span className="text-sm text-ink-400">Ask FitCheck</span>
          </div>
        </div>
        <h1 className="text-[26px] font-serif text-ink-900 leading-tight">What's the plan?</h1>
        <p className="text-sm text-ink-400 mt-1">Say where you're going and when. The answer comes from your closet.</p>
      </div>

      <div className="flex-1 px-6 pb-40 space-y-6">
        {turns.length === 0 && (
          <>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-ink-300 font-medium">Try one</p>
              {EXAMPLE_ASKS.map((example) => (
                <button
                  key={example}
                  onClick={() => ask(example)}
                  className="w-full text-left p-4 bg-white rounded-2xl border border-cream-300/60 text-sm text-ink-700 hover:border-ink-200 transition-colors flex items-center justify-between gap-3"
                >
                  <span>{example}</span>
                  <ArrowRight size={16} className="text-ink-200 flex-shrink-0" />
                </button>
              ))}
            </div>
            <div className="p-4 rounded-2xl bg-cream-200/60 flex items-start gap-2.5">
              <Info size={15} className="text-ink-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ink-500 leading-relaxed">
                How this works: FitCheck reads the occasion, the day, any weather you mention and a few preferences
                (more relaxed, no heels, don't repeat, with my trench coat), then builds looks with the same rules as
                the occasion screens. It is not a chatbot and it never suggests buying anything.
              </p>
            </div>
          </>
        )}

        {turns.map((turn) => {
          const { answer } = turn;
          const occasion = OCCASIONS.find((o) => o.id === answer.parse.occasionId)!;
          const [first, ...others] = answer.outfits;
          const firstItems = first
            ? first.slots.map((s) => getItemById(items, s.itemId)).filter((i): i is ClothingItem => !!i)
            : [];
          return (
            <div key={turn.id} className="space-y-3" data-testid="ask-turn">
              <div className="flex justify-end">
                <p className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-ink-900 text-cream-50 text-sm">
                  {turn.question}
                </p>
              </div>

              {/* What FitCheck understood */}
              <div className="flex flex-wrap gap-1.5" data-testid="ask-understood">
                <span className="px-2.5 py-1 rounded-full bg-cream-200 text-[11px] font-medium text-ink-600">
                  {occasion.label}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-cream-200 text-[11px] font-medium text-ink-600 capitalize">
                  {answer.parse.dateLabel}
                </span>
                {answer.weather && (
                  <span className="px-2.5 py-1 rounded-full bg-cream-200 text-[11px] font-medium text-ink-600">
                    {answer.weather.stated ? 'You said: ' : ''}
                    {answer.weather.condition}, {fmt(answer.weather.highC)} / {fmtShort(answer.weather.lowC)}
                  </span>
                )}
                {answer.parse.formalityShift !== 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-cream-200 text-[11px] font-medium text-ink-600">
                    {answer.parse.formalityShift < 0 ? 'More relaxed' : 'Dressier'}
                  </span>
                )}
                {answer.parse.comfortShoes && (
                  <span className="px-2.5 py-1 rounded-full bg-cream-200 text-[11px] font-medium text-ink-600">
                    Comfortable shoes
                  </span>
                )}
              </div>

              <div className="max-w-[92%] px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-cream-300/60">
                <p className="text-sm text-ink-800 leading-relaxed" data-testid="ask-message">{answer.message}</p>
                {answer.notes.map((note) => (
                  <p key={note} className="text-xs text-clay-600 leading-relaxed mt-2">
                    {note}
                  </p>
                ))}
              </div>

              {!first && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate('quickadd')}
                    className="flex-1 py-3 rounded-xl bg-ink-900 text-cream-50 text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Type what you own
                  </button>
                  <button
                    onClick={() => onNavigate('add')}
                    className="flex-1 py-3 rounded-xl border border-cream-300 text-ink-600 text-xs font-medium"
                  >
                    Add with a photo
                  </button>
                </div>
              )}

              {first && (
                <div className="bg-white rounded-3xl border border-cream-300/60 overflow-hidden">
                  <div className="flex gap-0.5 h-32 bg-cream-200">
                    {firstItems.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex-1 overflow-hidden">
                        <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-serif text-ink-900">{first.name}</h3>
                    <p className="text-xs text-ink-400 mt-1">
                      {firstItems.map((i) => i.name).join(' · ')}
                    </p>
                    <FigureToggle items={firstItems} avatar={profile.avatar} />
                    <button
                      onClick={() => wear(turn, first)}
                      className="w-full mt-4 py-3.5 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2 group/btn"
                    >
                      <Heart size={16} fill="currentColor" />
                      I'd wear this
                      <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {others.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-ink-300 font-medium">Or</p>
                  {others.map((outfit) => {
                    const pieces = outfit.slots
                      .map((s) => getItemById(items, s.itemId))
                      .filter((i): i is ClothingItem => !!i);
                    return (
                      <button
                        key={outfit.id}
                        onClick={() => wear(turn, outfit)}
                        className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-cream-300/60 text-left hover:border-ink-200 transition-colors"
                      >
                        <div className="flex -space-x-3 flex-shrink-0">
                          {pieces.slice(0, 3).map((item) => (
                            <img
                              key={item.id}
                              src={item.image}
                              alt=""
                              className="w-11 h-11 rounded-full object-cover border-2 border-white"
                            />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-ink-800 truncate">{outfit.name}</h4>
                          <p className="text-xs text-ink-400 truncate">{outfit.reasons?.[0]}</p>
                        </div>
                        <ArrowRight size={16} className="text-ink-200 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pt-3 pb-5 bg-cream-50/95 backdrop-blur-xl border-t border-cream-300 z-50 safe-bottom"
      >
        <div className="flex items-end gap-2">
          <label htmlFor="ask-input" className="sr-only">
            Ask what to wear
          </label>
          <input
            id="ask-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Dinner on Friday, no heels…"
            autoComplete="off"
            enterKeyHint="send"
            className="flex-1 px-4 py-3 rounded-2xl bg-white border border-cream-300 text-base text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-ink-400"
          />
          <button
            type="submit"
            disabled={draft.trim().length < 2}
            aria-label="Ask"
            className="w-12 h-12 rounded-2xl bg-ink-900 text-cream-50 flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
