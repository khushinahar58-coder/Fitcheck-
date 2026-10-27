import { Shirt, Bookmark, Clock, Sparkles, ArrowRight, Settings, CalendarDays } from 'lucide-react';
import type { ClothingItem, SavedOutfit, CalendarEntry } from '../types';
import { CATEGORIES } from '../data';
import { getRarelyWornItems } from '../store';
import { getOccasionIcon } from '../components/icons';
import type { Screen } from '../App';

interface Props {
  items: ClothingItem[];
  savedOutfits: SavedOutfit[];
  calendarEntries: CalendarEntry[];
  onNavigate: (s: Screen) => void;
}

export default function ProfileScreen({ items, savedOutfits, calendarEntries, onNavigate }: Props) {
  const rarelyWorn = getRarelyWornItems(items, 30);
  const freshItems = items.filter((i) => i.lastWornDaysAgo < 14);
  const wornCount = calendarEntries.filter((e) => e.worn).length;

  const categoryCounts = CATEGORIES.filter((c) => c !== 'All').map((cat) => ({
    category: cat,
    count: items.filter((i) => i.category === cat).length,
  }));
  const maxCount = Math.max(...categoryCounts.map((c) => c.count), 1);

  return (
    <div className="animate-fade-in">
      {/* Header with profile */}
      <div className="px-6 pt-14 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-clay-300 to-clay-500 flex items-center justify-center">
            <span className="text-2xl font-serif text-cream-50">K</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-serif text-ink-900">Khushi</h1>
            <p className="text-sm text-ink-400">Working professional · Fashion lover</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors">
            <Settings size={18} className="text-ink-500" />
          </button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-cream-200/60 text-center">
            <Shirt size={20} className="text-ink-400 mx-auto mb-1.5" />
            <p className="text-2xl font-serif text-ink-900">{items.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-300 font-medium mt-0.5">
              Total pieces
            </p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-cream-200/60 text-center">
            <Bookmark size={20} className="text-ink-400 mx-auto mb-1.5" />
            <p className="text-2xl font-serif text-ink-900">{savedOutfits.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-300 font-medium mt-0.5">
              Saved looks
            </p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-cream-200/60 text-center">
            <CalendarDays size={20} className="text-ink-400 mx-auto mb-1.5" />
            <p className="text-2xl font-serif text-ink-900">{calendarEntries.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-300 font-medium mt-0.5">
              Planned
            </p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-cream-200/60 text-center">
            <Clock size={20} className="text-clay-400 mx-auto mb-1.5" />
            <p className="text-2xl font-serif text-ink-900">{wornCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-300 font-medium mt-0.5">
              Worn
            </p>
          </div>
        </div>
      </div>

      {/* Wardrobe breakdown */}
      <div className="px-6 pb-6">
        <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">
          Wardrobe breakdown
        </h3>
        <div className="bg-white rounded-3xl border border-cream-200/60 p-5 space-y-3">
          {categoryCounts.map(({ category, count }) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-ink-600">{category}</span>
                <span className="text-xs text-ink-300">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-clay-300 to-clay-500 transition-all duration-500"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="px-6 pb-6">
        <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">
          Wardrobe insights
        </h3>
        <div className="space-y-3">
          {/* Freshly worn */}
          <div className="p-4 bg-gradient-to-br from-sage-50 to-cream-100 rounded-2xl border border-sage-100">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-sage-500" />
              <span className="text-sm font-medium text-sage-500">In regular rotation</span>
            </div>
            <p className="text-sm text-ink-600">
              {freshItems.length} pieces worn in the last 2 weeks — great wardrobe utilization!
            </p>
          </div>

          {/* Rarely worn */}
          {rarelyWorn.length > 0 && (
            <button
              onClick={() => onNavigate('wardrobe')}
              className="w-full p-4 bg-gradient-to-br from-clay-50 to-cream-100 rounded-2xl border border-clay-100/60 text-left group hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-clay-500" />
                <span className="text-sm font-medium text-clay-600">
                  {rarelyWorn.length} pieces waiting to be worn
                </span>
              </div>
              <p className="text-sm text-clay-600/80">
                These items haven't been worn in 30+ days. Let's bring them back!
              </p>
              <span className="text-xs text-clay-500 mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Browse rarely worn <ArrowRight size={12} />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-6 pb-8">
        <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">
          Quick actions
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => onNavigate('home')}
            className="w-full p-4 bg-white rounded-2xl border border-cream-200/60 flex items-center justify-between hover:border-ink-200 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = getOccasionIcon('sparkles');
                return <Icon size={20} className="text-ink-500" />;
              })()}
              <span className="text-sm font-medium text-ink-700">Find an outfit for today</span>
            </div>
            <ArrowRight size={16} className="text-ink-300 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate('add')}
            className="w-full p-4 bg-white rounded-2xl border border-cream-200/60 flex items-center justify-between hover:border-ink-200 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Shirt size={20} className="text-ink-500" />
              <span className="text-sm font-medium text-ink-700">Add a new piece</span>
            </div>
            <ArrowRight size={16} className="text-ink-300 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate('saved')}
            className="w-full p-4 bg-white rounded-2xl border border-cream-200/60 flex items-center justify-between hover:border-ink-200 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Bookmark size={20} className="text-ink-500" />
              <span className="text-sm font-medium text-ink-700">View saved looks</span>
            </div>
            <ArrowRight size={16} className="text-ink-300 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate('calendar')}
            className="w-full p-4 bg-white rounded-2xl border border-cream-200/60 flex items-center justify-between hover:border-ink-200 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <CalendarDays size={20} className="text-ink-500" />
              <span className="text-sm font-medium text-ink-700">View calendar</span>
            </div>
            <ArrowRight size={16} className="text-ink-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* App info */}
      <div className="px-6 pb-10 text-center">
        <p className="text-xs text-ink-300">FitCheck · v1.0</p>
        <p className="text-[10px] text-ink-200 mt-1">Rediscover your wardrobe</p>
      </div>
    </div>
  );
}
