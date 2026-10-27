import { ArrowRight, Clock, Sparkles, CalendarDays } from 'lucide-react';
import type { ClothingItem, OccasionId, CalendarEntry } from '../types';
import { OCCASIONS } from '../data';
import { getOccasionIcon } from '../components/icons';
import { getRarelyWornItems, formatLastWorn, getWornUrgency, getItemById } from '../store';
import type { Screen } from '../App';

interface Props {
  items: ClothingItem[];
  onSelectOccasion: (id: OccasionId) => void;
  onNavigate: (s: Screen) => void;
  todaysEntries: CalendarEntry[];
}

const OCCASION_EMOJI_MAP: Record<string, string> = {
  work: 'briefcase',
  dinner: 'utensils-crossed',
  date: 'heart',
  casual: 'coffee',
  party: 'sparkles',
};

export default function HomeScreen({ items, onSelectOccasion, onNavigate, todaysEntries }: Props) {
  const rarelyWorn = getRarelyWornItems(items, 30).slice(0, 6);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-300 font-medium">
              Good morning
            </p>
            <h1 className="text-2xl font-serif font-medium text-ink-900 mt-1">Khushi</h1>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="w-11 h-11 rounded-full bg-cream-200 flex items-center justify-center border border-cream-300 hover:scale-105 transition-transform"
          >
            <span className="font-serif text-base text-ink-700">K</span>
          </button>
        </div>
      </div>

      {/* Today's Outfit banner */}
      {todaysEntries.length > 0 && (
        <div className="px-6 pt-3 pb-1">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-ink-500" />
            <h3 className="text-sm font-serif text-ink-900">Today's Outfit</h3>
            {todaysEntries.length > 1 && (
              <span className="text-xs text-ink-300">
                · {todaysEntries.length} planned
              </span>
            )}
          </div>
          <div className="space-y-3">
            {todaysEntries.map((entry) => {
              const OccasionIcon = getOccasionIcon(OCCASION_EMOJI_MAP[entry.occasionId] ?? 'sparkles');
              const firstItems = entry.slots.slice(0, 3);
              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl overflow-hidden border border-cream-200/60"
                >
                  <div className="flex gap-1 h-28 bg-cream-200">
                    {firstItems.map((slot) => {
                      const item = getItemById(items, slot.itemId);
                      if (!item) return null;
                      return (
                        <div key={slot.role} className="flex-1 overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <OccasionIcon size={14} className="text-ink-400" />
                      <span className="text-sm font-serif text-ink-800">{entry.outfitName}</span>
                    </div>
                    {entry.worn ? (
                      <span className="px-2 py-0.5 rounded-full bg-sage-100 text-[10px] font-medium text-sage-500 flex items-center gap-0.5">
                        <Sparkles size={9} /> Worn
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-clay-100 text-[10px] font-medium text-clay-600">
                        Planned
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero question */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-[28px] leading-[1.2] font-serif text-ink-900 text-balance">
          What are we dressing for?
        </h2>
        <p className="text-sm text-ink-400 mt-2 leading-relaxed">
          Pick an occasion and we'll curate outfits from your wardrobe.
        </p>
      </div>

      {/* Occasions */}
      <div className="px-6 pt-2 space-y-3">
        {OCCASIONS.map((occasion, i) => {
          const Icon = getOccasionIcon(occasion.emoji);
          return (
            <button
              key={occasion.id}
              onClick={() => onSelectOccasion(occasion.id)}
              className="w-full group flex items-center gap-4 p-4 bg-white rounded-3xl border border-cream-300/60 hover:border-ink-200 hover:shadow-lg hover:shadow-ink-900/5 transition-all duration-300 text-left"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-12 h-12 rounded-2xl bg-cream-200 flex items-center justify-center group-hover:bg-ink-900 transition-colors duration-300 flex-shrink-0">
                <Icon
                  size={22}
                  className="text-ink-700 group-hover:text-cream-50 transition-colors duration-300"
                  strokeWidth={1.6}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-ink-900">{occasion.label}</h3>
                <p className="text-xs text-ink-300 mt-0.5 truncate">{occasion.description}</p>
              </div>
              <ArrowRight
                size={18}
                className="text-ink-200 group-hover:text-ink-500 group-hover:translate-x-1 transition-all duration-300"
              />
            </button>
          );
        })}
      </div>

      {/* Rarely worn section */}
      <div className="pt-10 pb-6">
        <div className="px-6 flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-clay-400" />
              <h3 className="text-lg font-serif text-ink-900">Bring something back into rotation</h3>
            </div>
            <p className="text-xs text-ink-300 mt-1">
              {rarelyWorn.length} pieces you haven't worn in a while
            </p>
          </div>
          <button
            onClick={() => onNavigate('wardrobe')}
            className="text-xs font-medium text-ink-500 hover:text-ink-900 transition-colors flex items-center gap-1"
          >
            View all
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar px-6 pb-2">
          {rarelyWorn.map((item) => {
            const urgency = getWornUrgency(item.lastWornDaysAgo);
            return (
              <button
                key={item.id}
                onClick={() => onNavigate('wardrobe')}
                className="flex-shrink-0 w-36 group text-left"
              >
                <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-cream-200">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-cream-50/90 backdrop-blur-sm">
                    <span
                      className={`text-[10px] font-medium ${
                        urgency === 'rarely' ? 'text-clay-500' : 'text-ink-500'
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>
                </div>
                <h4 className="text-sm font-medium text-ink-800 mt-2 truncate">{item.name}</h4>
                <p className="text-xs text-clay-400 mt-0.5">{formatLastWorn(item.lastWornDaysAgo)}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-6 pt-2 pb-8">
        <button
          onClick={() => onNavigate('wardrobe')}
          className="w-full p-5 bg-gradient-to-br from-ink-900 to-ink-700 rounded-3xl text-left group hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-gold-300" />
                <span className="text-xs uppercase tracking-wider text-gold-300 font-medium">
                  Your Wardrobe
                </span>
              </div>
              <p className="text-2xl font-serif text-cream-50">{items.length} pieces</p>
              <p className="text-xs text-cream-300 mt-1">Tap to browse your full collection</p>
            </div>
            <ArrowRight className="text-cream-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}
