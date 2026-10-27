import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  RefreshCw,
  Bookmark,
  Sparkles,
  Sun,
  Droplets,
  Wind,
  CalendarDays,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { ClothingItem, SavedOutfit, CalendarEntry } from '../types';
import { SAMPLE_WEATHER } from '../data';
import { getItemById, todayISO, formatLongDate } from '../store';
import { getWeatherIcon } from '../components/icons';
import type { ConfirmationContext, Screen } from '../App';

interface Props {
  ctx: ConfirmationContext;
  items: ClothingItem[];
  savedOutfits: SavedOutfit[];
  onBack: () => void;
  onSaveOutfit: (outfit: SavedOutfit) => void;
  onAddToCalendar: (entry: Omit<CalendarEntry, 'id'>) => void;
  onNavigate: (s: Screen) => void;
}

type Phase = 'weather' | 'kept' | 'saved' | 'savedWithCalendar';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function ConfirmationScreen({
  ctx,
  items,
  savedOutfits,
  onBack,
  onSaveOutfit,
  onAddToCalendar,
  onNavigate,
}: Props) {
  const weather = SAMPLE_WEATHER[ctx.occasionId];
  const WeatherIcon = getWeatherIcon(weather.emoji);
  const [phase, setPhase] = useState<Phase>('weather');
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<string>(todayISO());

  // Date picker state
  const today = todayISO();
  const todayDate = new Date(today + 'T00:00:00');
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());

  const calendarDays: Array<{ date: string | null; dayNum: number }> = [];
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  for (let i = 0; i < firstDay.getDay(); i++) calendarDays.push({ date: null, dayNum: 0 });
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ date, dayNum: d });
  }

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  // Keep Outfit: adds to calendar for today, does NOT mark as worn
  const handleKeepOutfit = () => {
    onAddToCalendar({
      savedOutfitId: ctx.outfitId,
      date: today,
      occasionId: ctx.occasionId,
      occasionLabel: ctx.occasionLabel,
      outfitName: ctx.outfitName,
      slots: ctx.slots,
      addedAt: Date.now(),
      worn: false,
    });
    setShowToast('kept');
    setPhase('kept');
    setTimeout(() => setShowToast(null), 1600);
  };

  // Save Outfit: saves to Saved section immediately
  const handleSaveOutfit = () => {
    const savedOutfit: SavedOutfit = {
      id: `saved-${Date.now()}`,
      outfitId: ctx.outfitId,
      occasionId: ctx.occasionId,
      occasionLabel: ctx.occasionLabel,
      name: ctx.outfitName,
      slots: ctx.slots,
      weather,
      savedAt: Date.now(),
    };
    onSaveOutfit(savedOutfit);
    setShowToast('saved');
    setPhase('saved');
    setTimeout(() => setShowToast(null), 1600);
  };

  // After saving, optionally add to calendar with a chosen date
  const handleAddToCalendar = () => {
    onAddToCalendar({
      savedOutfitId: ctx.outfitId,
      date: pickerDate,
      occasionId: ctx.occasionId,
      occasionLabel: ctx.occasionLabel,
      outfitName: ctx.outfitName,
      slots: ctx.slots,
      addedAt: Date.now(),
      worn: false,
    });
    setShowDatePicker(false);
    setShowToast('calendar');
    setPhase('savedWithCalendar');
    setTimeout(() => {
      setShowToast(null);
      onNavigate('calendar');
    }, 1600);
  };

  const handleSkipCalendar = () => {
    setShowDatePicker(false);
    onNavigate('saved');
  };

  return (
    <div className="animate-fade-in min-h-screen">
      {/* Header */}
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors"
          >
            <ArrowLeft size={18} className="text-ink-700" />
          </button>
          <span className="text-sm text-ink-400">{ctx.occasionLabel}</span>
        </div>
        <h1 className="text-[26px] font-serif text-ink-900 leading-tight text-balance">
          {ctx.outfitName}
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Here's your outfit — let's check the weather.
        </p>
      </div>

      {/* Weather card */}
      <div className="px-6 pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-800 to-ink-600 p-6">
          <div className="absolute -right-4 -top-4 opacity-10">
            <WeatherIcon size={120} className="text-cream-50" strokeWidth={1} />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <WeatherIcon size={18} className="text-gold-300" />
              <span className="text-xs uppercase tracking-wider text-gold-300 font-medium">
                Today's Weather
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-5xl font-serif text-cream-50">{weather.tempHigh}°</span>
              <span className="text-lg text-cream-300">/ {weather.tempLow}°</span>
            </div>
            <p className="text-sm text-cream-200 mt-1">{weather.condition}</p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <Sun size={14} className="text-gold-300" />
                <span className="text-xs text-cream-300">High {weather.tempHigh}°</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplets size={14} className="text-cream-300" />
                <span className="text-xs text-cream-300">Low {weather.tempLow}°</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind size={14} className="text-cream-300" />
                <span className="text-xs text-cream-300">Light breeze</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-cream-50/10 backdrop-blur-sm rounded-2xl">
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-gold-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-cream-200 leading-relaxed">{weather.note}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outfit items preview */}
      <div className="px-6 pt-6">
        <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">
          Your outfit
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {ctx.slots.map((slot) => {
            const item = getItemById(items, slot.itemId);
            if (!item) return null;
            return (
              <div key={slot.role} className="bg-white rounded-2xl overflow-hidden border border-cream-200/60">
                <div className="aspect-square bg-cream-200 overflow-hidden">
                  <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-ink-300 font-medium">{slot.role}</p>
                  <h4 className="text-xs font-medium text-ink-800 mt-0.5 truncate">{item.name}</h4>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions — changes based on phase */}
      <div className="px-6 pt-6 pb-8 space-y-3">
        {phase === 'weather' && (
          <>
            <p className="text-sm text-ink-400 text-center">
              Does this outfit work for the weather?
            </p>
            <button
              onClick={handleKeepOutfit}
              className="w-full py-4 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 bg-ink-900 text-cream-50 hover:bg-ink-800"
            >
              <CalendarDays size={18} />
              Keep outfit — add to today
            </button>
            <button
              onClick={handleSaveOutfit}
              className="w-full py-4 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 bg-clay-500 text-cream-50 hover:bg-clay-600"
            >
              <Bookmark size={18} fill="currentColor" />
              Save outfit
            </button>
            <button
              onClick={onBack}
              className="w-full py-4 rounded-2xl border border-cream-300 text-ink-600 text-sm font-medium hover:bg-cream-200/60 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Make a change
            </button>
          </>
        )}

        {phase === 'kept' && (
          <>
            <div className="p-4 bg-sage-50 border border-sage-100 rounded-2xl flex items-center gap-3">
              <Check size={20} className="text-sage-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-sage-500">Added to your calendar</p>
                <p className="text-xs text-sage-500/70 mt-0.5">
                  Outfit planned for {formatLongDate(today)}
                </p>
              </div>
            </div>
            <button
              onClick={handleSaveOutfit}
              className="w-full py-4 bg-clay-500 text-cream-50 rounded-2xl text-sm font-medium hover:bg-clay-600 transition-colors flex items-center justify-center gap-2"
            >
              <Bookmark size={18} fill="currentColor" />
              Also save outfit
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="w-full py-4 rounded-2xl border border-cream-300 text-ink-600 text-sm font-medium hover:bg-cream-200/60 transition-colors flex items-center justify-center gap-2"
            >
              View calendar
            </button>
          </>
        )}

        {phase === 'saved' && !showDatePicker && (
          <>
            <div className="p-4 bg-clay-50 border border-clay-200 rounded-2xl flex items-center gap-3">
              <Check size={20} className="text-clay-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-clay-600">Outfit saved</p>
                <p className="text-xs text-clay-600/70 mt-0.5">
                  Find it anytime in your Saved Looks
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDatePicker(true)}
              className="w-full py-4 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2"
            >
              <CalendarDays size={18} />
              Add to calendar?
            </button>
            <button
              onClick={() => onNavigate('saved')}
              className="w-full py-4 rounded-2xl border border-cream-300 text-ink-600 text-sm font-medium hover:bg-cream-200/60 transition-colors flex items-center justify-center gap-2"
            >
              No thanks — view saved
            </button>
          </>
        )}

        {phase === 'saved' && showDatePicker && (
          <div className="animate-slide-up">
            <div className="bg-white rounded-3xl border border-cream-200/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-serif text-ink-900">Choose a date</h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center"
                >
                  <X size={16} className="text-ink-600" />
                </button>
              </div>

              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={goPrevMonth} className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors">
                  <ChevronLeft size={18} className="text-ink-600" />
                </button>
                <span className="text-sm font-medium text-ink-700">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <button onClick={goNextMonth} className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors">
                  <ChevronRight size={18} className="text-ink-600" />
                </button>
              </div>

              {/* DOW header */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DOW.map((d, i) => (
                  <div key={i} className="text-center text-[9px] font-medium text-ink-300 uppercase py-1">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (!day.date) return <div key={i} className="aspect-square" />;
                  const isToday = day.date === today;
                  const isSelected = day.date === pickerDate;
                  return (
                    <button
                      key={i}
                      onClick={() => { if (day.date) setPickerDate(day.date); }}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-ink-900 text-cream-50'
                          : isToday
                          ? 'bg-cream-300 text-ink-900'
                          : 'text-ink-500 hover:bg-cream-200'
                      }`}
                    >
                      {day.dayNum}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-cream-200">
                <p className="text-xs text-ink-400 mb-3">
                  Outfit will be planned for <span className="font-medium text-ink-700">{formatLongDate(pickerDate)}</span>
                </p>
                <button
                  onClick={handleAddToCalendar}
                  className="w-full py-3.5 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarDays size={18} />
                  Add to calendar
                </button>
                <button
                  onClick={handleSkipCalendar}
                  className="w-full mt-2 py-3 text-ink-400 text-sm font-medium hover:text-ink-600 transition-colors"
                >
                  Skip — just save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast overlays */}
      {showToast === 'kept' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-50/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-sage-500 flex items-center justify-center mx-auto mb-4">
              <CalendarDays size={32} className="text-cream-50" />
            </div>
            <h2 className="text-xl font-serif text-ink-900">Planned for today!</h2>
            <p className="text-sm text-ink-400 mt-1">See it on your calendar</p>
          </div>
        </div>
      )}
      {showToast === 'saved' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-50/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-clay-500 flex items-center justify-center mx-auto mb-4">
              <Bookmark size={32} className="text-cream-50" fill="currentColor" />
            </div>
            <h2 className="text-xl font-serif text-ink-900">Outfit saved!</h2>
            <p className="text-sm text-ink-400 mt-1">Find it anytime in your Saved Looks</p>
          </div>
        </div>
      )}
      {showToast === 'calendar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-50/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-sage-500 flex items-center justify-center mx-auto mb-4">
              <CalendarDays size={32} className="text-cream-50" />
            </div>
            <h2 className="text-xl font-serif text-ink-900">Added to calendar!</h2>
            <p className="text-sm text-ink-400 mt-1">
              Planned for {formatLongDate(pickerDate)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
