import { useMemo, useState } from 'react';
import {
  Shirt,
  Bookmark,
  Clock,
  Sparkles,
  ArrowRight,
  CalendarDays,
  Check,
  LocateFixed,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { ClothingItem, SavedOutfit, CalendarEntry } from '../types';
import { CATEGORIES } from '../data';
import { getItemById, getRarelyWornItems, todayISO } from '../store';
import FigureCard from '../components/FigureCard';
import { generateOutfits } from '../lib/engine';
import { useApp } from '../lib/appContext';
import {
  HAIR_COLORS,
  SKIN_TONES,
  type AppSettings,
  type AvatarConfig,
  type Build,
  type HairStyle,
  type Profile,
} from '../lib/profiles';
import { searchCities, type City } from '../lib/weather';
import type { Screen } from '../App';

interface Props {
  items: ClothingItem[];
  savedOutfits: SavedOutfit[];
  calendarEntries: CalendarEntry[];
  profiles: Profile[];
  onNavigate: (s: Screen) => void;
  onSwitchProfile: (id: string) => void;
  onAddProfile: (name: string) => void;
  onRemoveProfile: (id: string) => void;
  onUpdateProfile: (id: string, changes: Partial<Profile>) => void;
  onUpdateSettings: (changes: Partial<AppSettings>) => void;
  onResetCloset: () => void;
  onEraseAll: () => void;
}

const BUILDS: Array<[Build, string]> = [
  ['slim', 'Slim'],
  ['regular', 'Regular'],
  ['broad', 'Broad'],
  ['curvy', 'Curvy'],
];
const HAIR: Array<[HairStyle, string]> = [
  ['none', 'None'],
  ['short', 'Short'],
  ['medium', 'Medium'],
  ['long', 'Long'],
  ['bun', 'Bun'],
];

type Confirm = 'reset' | 'remove' | 'erase' | null;

export default function ProfileScreen({
  items,
  savedOutfits,
  calendarEntries,
  profiles,
  onNavigate,
  onSwitchProfile,
  onAddProfile,
  onRemoveProfile,
  onUpdateProfile,
  onUpdateSettings,
  onResetCloset,
  onEraseAll,
}: Props) {
  const { profile, settings, weatherFor, forecastStatus, fmt } = useApp();
  const avatar = profile.avatar;
  const rarelyWorn = getRarelyWornItems(items, 30);
  const freshItems = items.filter((i) => i.lastWornDaysAgo >= 0 && i.lastWornDaysAgo < 14);
  const wornCount = calendarEntries.filter((e) => e.worn).length;

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<City[] | null>(null);
  const [cityStatus, setCityStatus] = useState<'idle' | 'searching' | 'error' | 'locating' | 'denied'>('idle');
  const [confirm, setConfirm] = useState<Confirm>(null);

  const categoryCounts = CATEGORIES.filter((c) => c !== 'All').map((cat) => ({
    category: cat,
    count: items.filter((i) => i.category === cat).length,
  }));
  const maxCount = Math.max(...categoryCounts.map((c) => c.count), 1);

  // The figure wears today's planned look if there is one, otherwise a look for a day off.
  const today = todayISO();
  const weather = weatherFor(today);
  const figureItems = useMemo(() => {
    const planned = calendarEntries.find((e) => e.date === today);
    const slots = planned?.slots ?? generateOutfits({ items, occasionId: 'casual', weather, today, count: 1 })[0]?.slots ?? [];
    return slots.map((s) => getItemById(items, s.itemId)).filter((i): i is ClothingItem => !!i);
  }, [calendarEntries, items, weather, today]);

  const setAvatar = (changes: Partial<AvatarConfig>) =>
    onUpdateProfile(profile.id, { avatar: { ...avatar, ...changes } });

  const saveName = () => {
    const name = nameDraft.trim().slice(0, 24);
    if (name) onUpdateProfile(profile.id, { name });
    setEditingName(false);
  };

  const findCity = async () => {
    if (cityQuery.trim().length < 2) return;
    setCityStatus('searching');
    try {
      setCityResults(await searchCities(cityQuery));
      setCityStatus('idle');
    } catch {
      setCityResults(null);
      setCityStatus('error');
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setCityStatus('denied');
      return;
    }
    setCityStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onUpdateSettings({
          city: { name: 'My location', lat: position.coords.latitude, lon: position.coords.longitude },
        });
        setCityResults(null);
        setCityStatus('idle');
      },
      () => setCityStatus('denied'),
      { timeout: 10_000 }
    );
  };

  const confirmCopy: Record<Exclude<Confirm, null>, { title: string; body: string; action: string; run: () => void }> = {
    reset: {
      title: 'Reset this closet?',
      body: `${profile.name}'s closet goes back to its starter pieces. Pieces you added, saved looks and the calendar for this profile are removed. This cannot be undone.`,
      action: 'Reset closet',
      run: onResetCloset,
    },
    remove: {
      title: `Delete ${profile.name}'s profile?`,
      body: 'The profile, its closet, saved looks and calendar are removed from this browser. This cannot be undone.',
      action: 'Delete profile',
      run: () => onRemoveProfile(profile.id),
    },
    erase: {
      title: 'Erase everything?',
      body: 'Every profile, closet, photo, saved look, calendar entry and setting FitCheck has stored in this browser is removed. This cannot be undone.',
      action: 'Erase everything',
      run: onEraseAll,
    },
  };

  return (
    <div className="animate-fade-in">
      {/* Header with profile */}
      <div className="px-6 pt-14 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-clay-300 to-clay-500 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-serif text-cream-50">{profile.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveName();
                }}
                className="flex items-center gap-2"
              >
                <label htmlFor="profile-name" className="sr-only">
                  Profile name
                </label>
                <input
                  id="profile-name"
                  autoFocus
                  value={nameDraft}
                  maxLength={24}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-white border border-cream-300 text-base text-ink-900 focus:outline-none focus:border-ink-400"
                />
                <button type="submit" aria-label="Save name" className="w-9 h-9 rounded-full bg-ink-900 text-cream-50 flex items-center justify-center flex-shrink-0">
                  <Check size={16} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setNameDraft(profile.name);
                  setEditingName(true);
                }}
                className="flex items-center gap-2 group text-left"
                aria-label={`Rename profile ${profile.name}`}
              >
                <h1 className="text-xl font-serif text-ink-900 truncate">{profile.name}</h1>
                <Pencil size={14} className="text-ink-300 group-hover:text-ink-500 flex-shrink-0" />
              </button>
            )}
            <p className="text-sm text-ink-400 truncate">{profile.tagline}</p>
          </div>
        </div>
      </div>

      {/* Profiles */}
      <div className="px-6 pb-6">
        <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-1">Whose closet</h3>
        <p className="text-xs text-ink-400 mb-3">Each profile has its own closet, saved looks and calendar.</p>
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => {
            const active = p.id === profile.id;
            return (
              <button
                key={p.id}
                onClick={() => !active && onSwitchProfile(p.id)}
                aria-pressed={active}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                  active ? 'bg-ink-900 text-cream-50' : 'bg-cream-200/70 text-ink-600 hover:bg-cream-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-serif ${
                    active ? 'bg-cream-50/20' : 'bg-cream-50'
                  }`}
                >
                  {p.name.charAt(0).toUpperCase()}
                </span>
                {p.name}
              </button>
            );
          })}
          {!addingProfile && (
            <button
              onClick={() => setAddingProfile(true)}
              className="px-4 py-2 rounded-full text-sm font-medium border border-dashed border-cream-400 text-ink-500 hover:border-ink-300 flex items-center gap-1.5"
            >
              <Plus size={14} /> New profile
            </button>
          )}
        </div>
        {addingProfile && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) onAddProfile(newName);
            }}
            className="flex items-center gap-2 mt-3"
          >
            <label htmlFor="new-profile" className="sr-only">
              Name for the new profile
            </label>
            <input
              id="new-profile"
              autoFocus
              value={newName}
              maxLength={24}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-cream-300 text-base text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-ink-400"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-4 py-2.5 rounded-2xl bg-ink-900 text-cream-50 text-sm font-medium disabled:opacity-40"
            >
              Create
            </button>
            <button type="button" onClick={() => setAddingProfile(false)} className="px-2 py-2.5 text-sm text-ink-400">
              Cancel
            </button>
          </form>
        )}
        {addingProfile && (
          <p className="text-xs text-ink-400 mt-2">A new profile starts with an empty closet.</p>
        )}
      </div>

      {/* Figure */}
      <div className="px-6 pb-6">
        <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-1">Your figure</h3>
        <p className="text-xs text-ink-400 mb-3">
          Looks can be shown on this figure. It starts as a plain dress form; make it yours.
        </p>
        <FigureCard
          items={figureItems}
          avatar={avatar}
          heightClass="h-72"
          caption={figureItems.length ? 'Wearing a look from this closet. Drag to turn.' : 'Drag to turn.'}
        />
        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-xs font-medium text-ink-500 mb-2">Build</legend>
            <div className="grid grid-cols-4 gap-2">
              {BUILDS.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setAvatar({ build: id })}
                  aria-pressed={avatar.build === id}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                    avatar.build === id ? 'bg-ink-900 text-cream-50' : 'bg-cream-200/70 text-ink-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-xs font-medium text-ink-500 mb-2">Skin</legend>
            <div className="flex gap-2.5">
              {SKIN_TONES.map((hex, i) => (
                <button
                  key={hex}
                  onClick={() => setAvatar({ skin: hex })}
                  aria-pressed={avatar.skin === hex}
                  aria-label={i === 0 ? 'Plain dress form' : `Skin tone ${i}`}
                  className={`w-9 h-9 rounded-full border-2 transition-transform ${
                    avatar.skin === hex ? 'border-ink-900 scale-110' : 'border-cream-300'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-xs font-medium text-ink-500 mb-2">Hair</legend>
            <div className="grid grid-cols-5 gap-2">
              {HAIR.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setAvatar({ hair: id })}
                  aria-pressed={avatar.hair === id}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                    avatar.hair === id ? 'bg-ink-900 text-cream-50' : 'bg-cream-200/70 text-ink-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              {HAIR_COLORS.map((hex, i) => (
                <button
                  key={hex}
                  onClick={() => setAvatar({ hairColor: hex })}
                  aria-pressed={avatar.hairColor === hex}
                  aria-label={`Hair color ${i + 1}`}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    avatar.hairColor === hex ? 'border-ink-900 scale-110' : 'border-cream-300'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <label className="ml-auto flex items-center gap-2 text-xs font-medium text-ink-600">
                <input
                  type="checkbox"
                  checked={avatar.beard}
                  onChange={(e) => setAvatar({ beard: e.target.checked })}
                  className="w-4 h-4 accent-ink-900"
                />
                Beard
              </label>
            </div>
          </fieldset>
        </div>
      </div>

      {/* Stats overview */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              [Shirt, items.length, 'Pieces'],
              [Bookmark, savedOutfits.length, 'Saved'],
              [CalendarDays, calendarEntries.length, 'Planned'],
              [Clock, wornCount, 'Worn'],
            ] as const
          ).map(([Icon, value, label]) => (
            <div key={label} className="py-3 bg-white rounded-2xl border border-cream-200/60 text-center">
              <Icon size={18} className="text-ink-400 mx-auto mb-1" />
              <p className="text-xl font-serif text-ink-900">{value}</p>
              <p className="text-[10px] uppercase tracking-wider text-ink-300 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wardrobe breakdown */}
      <div className="px-6 pb-6">
        <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">Wardrobe breakdown</h3>
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
        <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">Wardrobe insights</h3>
        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-br from-sage-50 to-cream-100 rounded-2xl border border-sage-100">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-sage-500" />
              <span className="text-sm font-medium text-sage-500">In regular rotation</span>
            </div>
            <p className="text-sm text-ink-600">
              {freshItems.length} of {items.length} pieces worn in the last 2 weeks.
            </p>
          </div>

          {rarelyWorn.length > 0 && (
            <button
              onClick={() => onNavigate('wardrobe')}
              className="w-full p-4 bg-gradient-to-br from-clay-50 to-cream-100 rounded-2xl border border-clay-100/60 text-left group hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-clay-500" />
                <span className="text-sm font-medium text-clay-600">
                  {rarelyWorn.length} {rarelyWorn.length === 1 ? 'piece' : 'pieces'} waiting to be worn
                </span>
              </div>
              <p className="text-sm text-clay-600/80">Not worn in 30 days or more. FitCheck works them into its looks.</p>
              <span className="text-xs text-clay-500 mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Browse them <ArrowRight size={12} />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="px-6 pb-6" id="settings">
        <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">Weather settings</h3>
        <div className="bg-white rounded-3xl border border-cream-200/60 p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink-800">Temperature</p>
              <p className="text-xs text-ink-400 mt-0.5">
                {weather ? `Today: ${fmt(weather.highC)} / ${fmt(weather.lowC)}` : 'Shown on every forecast'}
              </p>
            </div>
            <div className="flex p-1 rounded-xl bg-cream-200/70" role="group" aria-label="Temperature unit">
              {(['F', 'C'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => onUpdateSettings({ unit })}
                  aria-pressed={settings.unit === unit}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    settings.unit === unit ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'
                  }`}
                >
                  °{unit}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-clay-500 flex-shrink-0" />
              <p className="text-sm font-medium text-ink-800 truncate" data-testid="city-name">{settings.city.name}</p>
            </div>
            <p className="text-xs text-ink-400 mt-0.5">
              {forecastStatus === 'unavailable'
                ? 'The forecast could not be loaded right now.'
                : 'Looks and the weather check use this forecast.'}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void findCity();
              }}
              className="flex items-center gap-2 mt-3"
            >
              <label htmlFor="city-search" className="sr-only">
                Search for a city
              </label>
              <input
                id="city-search"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Search for a city"
                autoComplete="off"
                className="flex-1 min-w-0 px-4 py-2.5 rounded-2xl bg-cream-100 border border-cream-300 text-base text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-ink-400"
              />
              <button
                type="submit"
                aria-label="Search"
                disabled={cityQuery.trim().length < 2 || cityStatus === 'searching'}
                className="w-11 h-11 rounded-2xl bg-ink-900 text-cream-50 flex items-center justify-center disabled:opacity-40 flex-shrink-0"
              >
                <Search size={17} />
              </button>
            </form>
            {cityResults && (
              <div className="mt-2 rounded-2xl border border-cream-300 overflow-hidden divide-y divide-cream-200">
                {cityResults.length === 0 && <p className="px-4 py-3 text-xs text-ink-400">No city found with that name.</p>}
                {cityResults.map((city) => (
                  <button
                    key={`${city.lat},${city.lon}`}
                    onClick={() => {
                      onUpdateSettings({ city });
                      setCityResults(null);
                      setCityQuery('');
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-ink-700 hover:bg-cream-100"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            )}
            {cityStatus === 'error' && <p className="text-xs text-error-500 mt-2">City search is not reachable right now.</p>}
            <button
              onClick={useMyLocation}
              disabled={cityStatus === 'locating'}
              className="mt-3 text-xs font-medium text-clay-600 flex items-center gap-1.5 disabled:opacity-50"
            >
              <LocateFixed size={14} />
              {cityStatus === 'locating' ? 'Finding you…' : 'Use my location'}
            </button>
            {cityStatus === 'denied' && (
              <p className="text-xs text-ink-400 mt-1.5">Location is off for this site. Search for your city instead.</p>
            )}
          </div>
        </div>
      </div>

      {/* Your data */}
      <div className="px-6 pb-8">
        <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">Your data</h3>
        <div className="bg-white rounded-3xl border border-cream-200/60 p-5">
          <p className="text-xs text-ink-500 leading-relaxed">
            Your closets, photos, saved looks and calendar are stored only in this browser. They are never uploaded
            and there is no account. The app does contact three outside services: Open-Meteo for the forecast (it
            receives your city's coordinates, any city name you search for, and your location if you tap "Use my
            location"), Google Fonts for the typefaces, and Pexels for the first starter closet's photos.
          </p>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => setConfirm('reset')}
              className="w-full py-3 rounded-2xl border border-cream-300 text-ink-600 text-sm font-medium hover:bg-cream-200/60 transition-colors"
            >
              Reset this closet
            </button>
            {profiles.length > 1 && (
              <button
                onClick={() => setConfirm('remove')}
                className="w-full py-3 rounded-2xl border border-cream-300 text-ink-600 text-sm font-medium hover:bg-cream-200/60 transition-colors"
              >
                Delete this profile
              </button>
            )}
            <button
              onClick={() => setConfirm('erase')}
              className="w-full py-3 rounded-2xl border border-error-400/30 text-error-500 text-sm font-medium hover:bg-error-400/5 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={15} />
              Erase everything
            </button>
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="px-6 pb-10 text-center">
        <p className="text-xs text-ink-300">FitCheck · More outfits. Same closet.</p>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" onClick={() => setConfirm(null)}>
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" />
          <div
            role="alertdialog"
            aria-labelledby="confirm-title"
            className="relative w-full max-w-sm bg-cream-50 rounded-3xl p-6 animate-scale-in text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-title" className="text-lg font-serif text-ink-900">
              {confirmCopy[confirm].title}
            </h3>
            <p className="text-sm text-ink-400 mt-2 leading-relaxed">{confirmCopy[confirm].body}</p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-2xl border border-cream-300 text-ink-600 text-sm font-medium hover:bg-cream-200/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmCopy[confirm].run();
                  setConfirm(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-error-500 text-cream-50 text-sm font-medium hover:bg-error-400 transition-colors"
              >
                {confirmCopy[confirm].action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
