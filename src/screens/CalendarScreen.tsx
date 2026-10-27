import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  X,
  CalendarDays,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import type { ClothingItem, CalendarEntry } from '../types';
import { getItemById, formatLongDate, todayISO } from '../store';
import { getOccasionIcon } from '../components/icons';
import type { Screen } from '../App';

interface Props {
  entries: CalendarEntry[];
  items: ClothingItem[];
  onRemoveEntry: (id: string) => void;
  onMarkWorn: (entryId: string, itemIds: string[]) => void;
  onNavigate: (s: Screen) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const OCCASION_EMOJI_MAP: Record<string, string> = {
  work: 'briefcase',
  dinner: 'utensils-crossed',
  date: 'heart',
  casual: 'coffee',
  party: 'sparkles',
};

export default function CalendarScreen({
  entries,
  items,
  onRemoveEntry,
  onMarkWorn,
  onNavigate,
}: Props) {
  const today = todayISO();
  const todayDate = new Date(today + 'T00:00:00');
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [viewingEntry, setViewingEntry] = useState<CalendarEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const entriesByDate = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {};
    for (const e of entries) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [entries]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: string | null; dayNum: number }> = [];
    for (let i = 0; i < startDow; i++) days.push({ date: null, dayNum: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date, dayNum: d });
    }
    return days;
  }, [viewYear, viewMonth]);

  const selectedEntries = entriesByDate[selectedDate] ?? [];

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleMarkWorn = (entry: CalendarEntry) => {
    if (entry.worn) return;
    const itemIds = entry.slots.map((s) => s.itemId);
    onMarkWorn(entry.id, itemIds);
    setViewingEntry((prev) => prev ? { ...prev, worn: true, wornAt: Date.now() } : null);
  };

  // Detail view for a calendar entry
  if (viewingEntry) {
    const entry = viewingEntry;
    const OccasionIcon = getOccasionIcon(OCCASION_EMOJI_MAP[entry.occasionId] ?? 'sparkles');

    return (
      <div className="animate-fade-in">
        <div className="px-6 pt-14 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setViewingEntry(null)}
              className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors"
            >
              <X size={18} className="text-ink-700" />
            </button>
            <span className="text-sm text-ink-400">Planned outfit</span>
          </div>
          <div className="flex items-center gap-2">
            <OccasionIcon size={20} className="text-ink-500" />
            <h1 className="text-2xl font-serif font-medium text-ink-900">{entry.outfitName}</h1>
          </div>
          <p className="text-sm text-ink-400 mt-1 flex items-center gap-1.5">
            <CalendarDays size={14} />
            {formatLongDate(entry.date)} · {entry.occasionLabel}
          </p>
        </div>

        {/* Worn status banner */}
        <div className="px-6 pt-2">
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 ${
              entry.worn ? 'bg-sage-50 border border-sage-100' : 'bg-cream-200/60 border border-cream-300'
            }`}
          >
            {entry.worn ? (
              <>
                <CheckCircle2 size={22} className="text-sage-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-sage-500">Marked as worn</p>
                  <p className="text-xs text-sage-500/70 mt-0.5">
                    {entry.wornAt
                      ? new Date(entry.wornAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })
                      : ''}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Circle size={22} className="text-ink-300 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-ink-600">Planned — not yet worn</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Mark as worn when you wear this outfit
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="px-6 pt-5">
          <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">
            Outfit pieces
          </h3>
          <div className="space-y-3">
            {entry.slots.map((slot) => {
              const item = getItemById(items, slot.itemId);
              if (!item) return null;
              return (
                <div key={slot.role} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-cream-200/60">
                  <div className="w-14 h-16 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                    <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-ink-300 font-medium">
                      {slot.role}
                    </span>
                    <h4 className="text-sm font-medium text-ink-800 mt-0.5 truncate">{item.name}</h4>
                    <p className="text-xs text-ink-300">{item.brand} · {item.color}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pt-6 pb-8 space-y-3">
          {!entry.worn && (
            <button
              onClick={() => handleMarkWorn(entry)}
              className="w-full py-3.5 bg-sage-500 text-cream-50 rounded-2xl text-sm font-medium hover:bg-sage-400 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Mark as worn
            </button>
          )}
          <button
            onClick={() => {
              setConfirmDelete(entry.id);
            }}
            className="w-full py-3.5 rounded-2xl border border-error-400/30 text-error-500 text-sm font-medium hover:bg-error-400/5 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Remove from calendar
          </button>
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={() => setConfirmDelete(null)}>
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" />
            <div
              className="relative w-full max-w-sm bg-cream-50 rounded-3xl p-6 animate-scale-in text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-error-400/15 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-error-500" />
              </div>
              <h3 className="text-lg font-serif text-ink-900">Remove from calendar?</h3>
              <p className="text-sm text-ink-400 mt-2">
                This outfit will no longer be planned for this date. The saved look will remain in your Saved section.
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-2xl border border-cream-300 text-ink-600 text-sm font-medium hover:bg-cream-200/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onRemoveEntry(entry.id);
                    setConfirmDelete(null);
                    setViewingEntry(null);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-error-500 text-cream-50 text-sm font-medium hover:bg-error-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Calendar view
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-serif font-medium text-ink-900">Calendar</h1>
        <p className="text-sm text-ink-400 mt-1">
          Plan outfits for upcoming dates and track what you wear.
        </p>
      </div>

      {/* Month navigation */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goPrevMonth}
            className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors"
          >
            <ChevronLeft size={20} className="text-ink-600" />
          </button>
          <h2 className="text-lg font-serif text-ink-900">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={goNextMonth}
            className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors"
          >
            <ChevronRight size={20} className="text-ink-600" />
          </button>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DOW.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-ink-300 uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (!day.date) {
              return <div key={i} className="aspect-square" />;
            }
            const dayEntries = entriesByDate[day.date] ?? [];
            const hasEntries = dayEntries.length > 0;
            const isToday = day.date === today;
            const isSelected = day.date === selectedDate;
            const hasWorn = dayEntries.some((e) => e.worn);
            const hasPlanned = dayEntries.some((e) => !e.worn);

            return (
              <button
                key={i}
                onClick={() => { if (day.date) setSelectedDate(day.date); }}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                  isSelected
                    ? 'bg-ink-900 text-cream-50'
                    : isToday
                    ? 'bg-cream-300 text-ink-700'
                    : hasEntries
                    ? 'bg-cream-200/70 text-ink-700 hover:bg-cream-300'
                    : 'text-ink-400 hover:bg-cream-200/50'
                }`}
              >
                <span className={`text-xs font-medium ${isToday && !isSelected ? 'text-ink-900' : ''}`}>
                  {day.dayNum}
                </span>
                {hasEntries && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasPlanned && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-gold-300' : 'bg-clay-400'}`} />
                    )}
                    {hasWorn && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-success-400' : 'bg-sage-400'}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-clay-400" />
            <span className="text-[10px] text-ink-300">Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sage-400" />
            <span className="text-[10px] text-ink-300">Worn</span>
          </div>
        </div>
      </div>

      {/* Selected date entries */}
      <div className="px-6 pt-2 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider">
            {formatLongDate(selectedDate)}
          </h3>
          {selectedEntries.length > 0 && (
            <span className="text-xs text-ink-300">
              {selectedEntries.length} outfit{selectedEntries.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {selectedEntries.length === 0 ? (
          <div className="py-12 text-center bg-cream-200/40 rounded-2xl">
            <CalendarDays size={32} className="text-ink-300 mx-auto mb-3" />
            <p className="text-sm text-ink-400">No outfits planned for this date</p>
            <button
              onClick={() => onNavigate('home')}
              className="mt-4 px-4 py-2 bg-ink-900 text-cream-50 rounded-xl text-xs font-medium hover:bg-ink-800 transition-colors"
            >
              Plan an outfit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedEntries.map((entry) => {
              const OccasionIcon = getOccasionIcon(OCCASION_EMOJI_MAP[entry.occasionId] ?? 'sparkles');
              const firstItems = entry.slots.slice(0, 3);
              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl overflow-hidden border border-cream-200/60"
                >
                  <button
                    onClick={() => setViewingEntry(entry)}
                    className="block w-full text-left"
                  >
                    <div className="flex gap-1 h-24 bg-cream-200">
                      {firstItems.map((slot) => {
                        const item = getItemById(items, slot.itemId);
                        if (!item) return null;
                        return (
                          <div key={slot.role} className="flex-1 overflow-hidden">
                            <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                          </div>
                        );
                      })}
                    </div>
                  </button>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <OccasionIcon size={14} className="text-ink-400" />
                          <span className="text-xs text-ink-400">{entry.occasionLabel}</span>
                          {entry.worn ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-sage-100 text-[9px] font-medium text-sage-500 flex items-center gap-0.5">
                              <Check size={9} /> Worn
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-full bg-clay-100 text-[9px] font-medium text-clay-600">
                              Planned
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-serif text-ink-900 truncate">{entry.outfitName}</h4>
                        <p className="text-xs text-ink-300 mt-0.5">{entry.slots.length} pieces</p>
                      </div>
                      <button
                        onClick={() => setViewingEntry(entry)}
                        className="px-3 py-1.5 rounded-lg bg-cream-200/70 text-ink-500 text-xs font-medium hover:bg-cream-300 transition-colors"
                      >
                        Details
                      </button>
                    </div>
                    {!entry.worn && (
                      <button
                        onClick={() => handleMarkWorn(entry)}
                        className="w-full mt-3 py-2.5 bg-sage-500/10 text-sage-500 rounded-xl text-xs font-medium hover:bg-sage-500/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} />
                        Mark as worn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
