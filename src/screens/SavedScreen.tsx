import { useState } from 'react';
import {
  Bookmark,
  Trash2,
  X,
  ArrowRight,
  Calendar,
  Clock,
  CalendarDays,
  Check,
} from 'lucide-react';
import type { ClothingItem, SavedOutfit, CalendarEntry } from '../types';
import { getItemById, todayISO } from '../store';
import { getOccasionIcon, getWeatherIcon } from '../components/icons';
import type { Screen } from '../App';

interface Props {
  savedOutfits: SavedOutfit[];
  items: ClothingItem[];
  calendarEntries: CalendarEntry[];
  onRemove: (id: string) => void;
  onAddToCalendar: (entry: Omit<CalendarEntry, 'id'>) => void;
  onViewOutfit: (id: string) => void;
  viewingId: string | null;
  onNavigate: (s: Screen) => void;
}

export default function SavedScreen({
  savedOutfits,
  items,
  calendarEntries,
  onRemove,
  onAddToCalendar,
  onViewOutfit,
  viewingId,
  onNavigate,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const viewingOutfit = viewingId ? savedOutfits.find((o) => o.id === viewingId) : null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Detail view for a saved outfit
  if (viewingOutfit) {
    const OccasionIcon = getOccasionIcon(
      { work: 'briefcase', dinner: 'utensils-crossed', date: 'heart', casual: 'coffee', party: 'sparkles' }[
        viewingOutfit.occasionId
      ] ?? 'sparkles'
    );
    const WeatherIcon = getWeatherIcon(viewingOutfit.weather.emoji);

    return (
      <div className="animate-fade-in">
        <div className="px-6 pt-14 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => onViewOutfit('')}
              className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors"
            >
              <X size={18} className="text-ink-700" />
            </button>
            <span className="text-sm text-ink-400">Saved Look</span>
          </div>
          <div className="flex items-center gap-2">
            <OccasionIcon size={20} className="text-ink-500" />
            <h1 className="text-2xl font-serif font-medium text-ink-900">{viewingOutfit.name}</h1>
          </div>
          <p className="text-sm text-ink-400 mt-1 flex items-center gap-1.5">
            <Calendar size={14} />
            Saved {formatDate(viewingOutfit.savedAt)} · {viewingOutfit.occasionLabel}
          </p>
        </div>

        {/* Weather when saved */}
        <div className="px-6 pt-2">
          <div className="p-4 bg-cream-200/60 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-ink-900 flex items-center justify-center flex-shrink-0">
              <WeatherIcon size={22} className="text-gold-300" />
            </div>
            <div>
              <p className="text-xs text-ink-300 uppercase tracking-wider">Weather when saved</p>
              <p className="text-sm text-ink-800 mt-0.5">
                {viewingOutfit.weather.condition} · {viewingOutfit.weather.tempHigh}° / {viewingOutfit.weather.tempLow}°
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 pt-5">
          <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">
            Outfit pieces
          </h3>
          <div className="space-y-3">
            {viewingOutfit.slots.map((slot) => {
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
          {/* Calendar status */}
          {(() => {
            const calEntries = calendarEntries.filter((e) => e.savedOutfitId === viewingOutfit.id);
            if (calEntries.length > 0) {
              return (
                <div className="p-3 bg-sage-50 border border-sage-100 rounded-2xl flex items-center gap-2">
                  <CalendarDays size={16} className="text-sage-500 flex-shrink-0" />
                  <p className="text-xs text-sage-600">
                    Planned for {calEntries.length} date{calEntries.length > 1 ? 's' : ''} on your calendar
                  </p>
                </div>
              );
            }
            return null;
          })()}

          {/* Add to calendar */}
          <button
            onClick={() => {
              onAddToCalendar({
                savedOutfitId: viewingOutfit.id,
                date: todayISO(),
                occasionId: viewingOutfit.occasionId,
                occasionLabel: viewingOutfit.occasionLabel,
                outfitName: viewingOutfit.name,
                slots: viewingOutfit.slots,
                addedAt: Date.now(),
                worn: false,
              });
            }}
            className="w-full py-3.5 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2"
          >
            <CalendarDays size={18} />
            Add to today's calendar
          </button>

          <button
            onClick={() => {
              onRemove(viewingOutfit.id);
              onViewOutfit('');
            }}
            className="w-full py-3.5 rounded-2xl border border-error-400/30 text-error-500 text-sm font-medium hover:bg-error-400/5 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Remove from saved
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="animate-fade-in">
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-serif font-medium text-ink-900">Saved Looks</h1>
        <p className="text-sm text-ink-400 mt-1">
          {savedOutfits.length === 0
            ? 'Your saved outfits will appear here'
            : `${savedOutfits.length} saved outfit${savedOutfits.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {savedOutfits.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-cream-200 mx-auto mb-5 flex items-center justify-center">
            <Bookmark size={32} className="text-ink-300" />
          </div>
          <h3 className="text-lg font-serif text-ink-700">No saved looks yet</h3>
          <p className="text-sm text-ink-300 mt-2 max-w-[240px] mx-auto leading-relaxed">
            Pick an occasion, find an outfit you love, and save it here for easy access.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="mt-6 px-5 py-3 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors inline-flex items-center gap-2"
          >
            Find an outfit
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="px-6 pt-2 pb-8 space-y-4">
          {savedOutfits.map((outfit) => {
            const OccasionIcon = getOccasionIcon(
              { work: 'briefcase', dinner: 'utensils-crossed', date: 'heart', casual: 'coffee', party: 'sparkles' }[
                outfit.occasionId
              ] ?? 'sparkles'
            );
            const firstItems = outfit.slots.slice(0, 3);
            const remainingCount = outfit.slots.length - 3;

            return (
              <div
                key={outfit.id}
                className="bg-white rounded-3xl overflow-hidden border border-cream-200/60 hover:shadow-lg hover:shadow-ink-900/5 transition-shadow"
              >
                {/* Image strip */}
                <button
                  onClick={() => onViewOutfit(outfit.id)}
                  className="block w-full text-left"
                >
                  <div className="flex gap-1 h-32 bg-cream-200">
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
                </button>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <OccasionIcon size={14} className="text-ink-400" />
                        <span className="text-xs text-ink-400">{outfit.occasionLabel}</span>
                      </div>
                      <h3 className="text-base font-serif text-ink-900 truncate">{outfit.name}</h3>
                      <p className="text-xs text-ink-300 mt-1 flex items-center gap-1.5">
                        <Clock size={12} />
                        {formatDate(outfit.savedAt)}
                        {remainingCount > 0 && (
                          <span className="ml-1">· {outfit.slots.length} pieces</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmDelete(outfit.id)}
                      className="w-9 h-9 rounded-full bg-cream-200/60 flex items-center justify-center text-ink-300 hover:text-error-500 hover:bg-error-400/10 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => onViewOutfit(outfit.id)}
                    className="mt-3 w-full py-2.5 rounded-xl bg-cream-200/60 text-ink-600 text-xs font-medium hover:bg-cream-300 transition-colors flex items-center justify-center gap-1.5"
                  >
                    View details
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
            <h3 className="text-lg font-serif text-ink-900">Remove this look?</h3>
            <p className="text-sm text-ink-400 mt-2">
              This will remove the outfit from your saved looks. You can always save it again.
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
                  onRemove(confirmDelete);
                  setConfirmDelete(null);
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
