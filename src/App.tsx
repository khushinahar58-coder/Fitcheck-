import { useState, useCallback, useEffect } from 'react';
import { Home, Shirt, Plus, Bookmark, CalendarDays } from 'lucide-react';
import { useWardrobeStore } from './store';
import type { DayWeather, OccasionId } from './types';
import type { AskTurn } from './lib/ask';
import { AppProvider, useAppValue } from './lib/appContext';
import {
  eraseEverything,
  eraseProfileData,
  loadProfiles,
  loadSettings,
  makeProfile,
  saveProfiles,
  saveSettings,
  type AppSettings,
  type Profile,
  type ProfileState,
} from './lib/profiles';
import HomeScreen from './screens/HomeScreen';
import WardrobeScreen from './screens/WardrobeScreen';
import AddScreen from './screens/AddScreen';
import SavedScreen from './screens/SavedScreen';
import CalendarScreen from './screens/CalendarScreen';
import ProfileScreen from './screens/ProfileScreen';
import RecommendationsScreen from './screens/RecommendationsScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import ExtractItemsScreen from './screens/ExtractItemsScreen';
import ImportPurchasesScreen from './screens/ImportPurchasesScreen';
import AskScreen from './screens/AskScreen';
import QuickAddScreen from './screens/QuickAddScreen';

export type Screen =
  | 'home'
  | 'wardrobe'
  | 'add'
  | 'saved'
  | 'calendar'
  | 'profile'
  | 'recommendations'
  | 'confirmation'
  | 'extract'
  | 'import'
  | 'ask'
  | 'quickadd';

export interface ConfirmationContext {
  occasionId: OccasionId;
  occasionLabel: string;
  outfitId: string;
  outfitName: string;
  slots: Array<{ role: string; itemId: string }>;
  planDate?: string; // the day the look is for, when it is not today
  weather?: DayWeather | null; // set when the look came from Ask FitCheck (which may use weather the user described)
  backTo?: Screen;
}

const NAV_ITEMS: Array<{ id: Screen; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
  { id: 'add', label: 'Add', icon: Plus },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
];

function App() {
  const [profileState, setProfileState] = useState<ProfileState>(loadProfiles);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  // Bumped when everything is erased, so the closet is rebuilt from the starter pieces.
  const [generation, setGeneration] = useState(0);

  useEffect(() => saveProfiles(profileState), [profileState]);
  useEffect(() => saveSettings(settings), [settings]);

  const profile = profileState.profiles.find((p) => p.id === profileState.activeId) ?? profileState.profiles[0];

  const updateProfile = useCallback((id: string, changes: Partial<Profile>) => {
    setProfileState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    }));
  }, []);

  const addProfile = useCallback((name: string) => {
    setProfileState((prev) => {
      const created = makeProfile(name, prev.profiles);
      return { activeId: created.id, profiles: [...prev.profiles, created] };
    });
  }, []);

  const removeProfile = useCallback((id: string) => {
    eraseProfileData(id);
    setProfileState((prev) => {
      const profiles = prev.profiles.filter((p) => p.id !== id);
      if (!profiles.length) return prev;
      return { activeId: prev.activeId === id ? profiles[0].id : prev.activeId, profiles };
    });
  }, []);

  const eraseAll = useCallback(() => {
    eraseEverything();
    setProfileState(loadProfiles());
    setSettings(loadSettings());
    setGeneration((n) => n + 1);
  }, []);

  return (
    <Shell
      // A different person means a different closet: start the screens and the store afresh.
      key={`${profile.id}-${generation}`}
      profile={profile}
      profiles={profileState.profiles}
      settings={settings}
      onSwitchProfile={(id) => setProfileState((prev) => ({ ...prev, activeId: id }))}
      onAddProfile={addProfile}
      onRemoveProfile={removeProfile}
      onUpdateProfile={updateProfile}
      onUpdateSettings={(changes) => setSettings((prev) => ({ ...prev, ...changes }))}
      onEraseAll={eraseAll}
    />
  );
}

interface ShellProps {
  profile: Profile;
  profiles: Profile[];
  settings: AppSettings;
  onSwitchProfile: (id: string) => void;
  onAddProfile: (name: string) => void;
  onRemoveProfile: (id: string) => void;
  onUpdateProfile: (id: string, changes: Partial<Profile>) => void;
  onUpdateSettings: (changes: Partial<AppSettings>) => void;
  onEraseAll: () => void;
}

function Shell({
  profile,
  profiles,
  settings,
  onSwitchProfile,
  onAddProfile,
  onRemoveProfile,
  onUpdateProfile,
  onUpdateSettings,
  onEraseAll,
}: ShellProps) {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionId | null>(null);
  const [confirmationCtx, setConfirmationCtx] = useState<ConfirmationContext | null>(null);
  const [viewingSavedId, setViewingSavedId] = useState<string | null>(null);
  const [askTurns, setAskTurns] = useState<AskTurn[]>([]);

  const store = useWardrobeStore({ id: profile.id, starter: profile.starter });
  const app = useAppValue(profile, settings);

  const navigate = useCallback((s: Screen) => {
    setScreen(s);
    setViewingSavedId(null);
    window.scrollTo(0, 0);
  }, []);

  const handleSelectOccasion = useCallback((id: OccasionId) => {
    setSelectedOccasion(id);
    setScreen('recommendations');
    window.scrollTo(0, 0);
  }, []);

  const handleConfirmOutfit = useCallback((ctx: ConfirmationContext) => {
    setConfirmationCtx(ctx);
    setScreen('confirmation');
    window.scrollTo(0, 0);
  }, []);

  const handleNavigateFromSaved = useCallback((s: Screen) => {
    setScreen(s);
  }, []);

  const handleViewSaved = useCallback((id: string) => {
    setViewingSavedId(id);
    setScreen('saved');
  }, []);

  const isMainScreen = ['home', 'wardrobe', 'add', 'saved', 'calendar', 'profile'].includes(screen);

  return (
    <AppProvider value={app}>
      <div className="min-h-screen bg-cream-100 text-ink-800 flex flex-col">
        <div className="mx-auto w-full max-w-md flex-1 flex flex-col relative bg-cream-50 min-h-screen shadow-sm">
          <div className="flex-1 pb-20">
            {store.storageFull && (
              <div role="alert" className="px-6 py-3 bg-clay-100 text-xs text-clay-700 leading-relaxed">
                This browser's storage is full, so new changes may not be saved. Removing a few photos from the
                wardrobe frees space.
              </div>
            )}
            {screen === 'home' && (
              <HomeScreen
                items={store.items}
                onSelectOccasion={handleSelectOccasion}
                onNavigate={navigate}
                todaysEntries={store.getTodaysEntries()}
              />
            )}
            {screen === 'wardrobe' && (
              <WardrobeScreen
                items={store.items}
                onUpdateItem={store.updateItem}
                onRemoveItem={store.removeItem}
              />
            )}
            {screen === 'add' && (
              <AddScreen
                onAddItem={store.addItem}
                onNavigate={navigate}
                currentCount={store.items.length}
              />
            )}
            {screen === 'quickadd' && (
              <QuickAddScreen
                onAddItems={store.addItems}
                onNavigate={navigate}
                onBack={() => navigate('add')}
                currentCount={store.items.length}
              />
            )}
            {screen === 'saved' && (
              <SavedScreen
                savedOutfits={store.savedOutfits}
                items={store.items}
                calendarEntries={store.calendarEntries}
                onRemove={store.removeSavedOutfit}
                onAddToCalendar={store.addOutfitToCalendar}
                onViewOutfit={handleViewSaved}
                viewingId={viewingSavedId}
                onNavigate={handleNavigateFromSaved}
                onSaveOutfit={store.saveOutfit}
              />
            )}
            {screen === 'calendar' && (
              <CalendarScreen
                entries={store.calendarEntries}
                items={store.items}
                onRemoveEntry={store.removeCalendarEntry}
                onMarkWorn={(entryId, itemIds) => {
                  const entry = store.calendarEntries.find((e) => e.id === entryId);
                  store.markCalendarEntryWorn(entryId);
                  store.markItemsWorn(itemIds, entry?.date);
                }}
                onUnmarkWorn={store.unmarkCalendarEntryWorn}
                onNavigate={navigate}
              />
            )}
            {screen === 'profile' && (
              <ProfileScreen
                items={store.items}
                savedOutfits={store.savedOutfits}
                calendarEntries={store.calendarEntries}
                profiles={profiles}
                onNavigate={navigate}
                onSwitchProfile={onSwitchProfile}
                onAddProfile={onAddProfile}
                onRemoveProfile={onRemoveProfile}
                onUpdateProfile={onUpdateProfile}
                onUpdateSettings={onUpdateSettings}
                onResetCloset={store.resetCloset}
                onEraseAll={onEraseAll}
              />
            )}
            {screen === 'recommendations' && selectedOccasion && (
              <RecommendationsScreen
                occasionId={selectedOccasion}
                items={store.items}
                calendarEntries={store.calendarEntries}
                onBack={() => navigate('home')}
                onConfirmOutfit={handleConfirmOutfit}
                onNavigate={navigate}
              />
            )}
            {screen === 'ask' && (
              <AskScreen
                items={store.items}
                calendarEntries={store.calendarEntries}
                turns={askTurns}
                onTurnsChange={setAskTurns}
                onBack={() => navigate('home')}
                onConfirmOutfit={handleConfirmOutfit}
                onNavigate={navigate}
              />
            )}
            {screen === 'confirmation' && confirmationCtx && (
              <ConfirmationScreen
                ctx={confirmationCtx}
                items={store.items}
                onBack={() => setScreen(confirmationCtx.backTo ?? 'recommendations')}
                onSaveOutfit={store.saveOutfit}
                onAddToCalendar={store.addOutfitToCalendar}
                onNavigate={navigate}
              />
            )}
            {screen === 'extract' && (
              <ExtractItemsScreen
                onAddItem={store.addItem}
                onNavigate={navigate}
                onBack={() => navigate('add')}
              />
            )}
            {screen === 'import' && (
              <ImportPurchasesScreen
                onAddItem={store.addItem}
                onNavigate={navigate}
                onBack={() => navigate('add')}
              />
            )}
          </div>

          {isMainScreen && (
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-cream-50/95 backdrop-blur-xl border-t border-cream-300 z-50 safe-bottom">
              <div className="flex items-stretch justify-around px-2 pt-2 pb-3">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = screen === item.id;
                  const isAdd = item.id === 'add';
                  if (isAdd) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className="flex flex-col items-center gap-1 px-3"
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isActive ? 'bg-ink-900 scale-105' : 'bg-ink-900 hover:scale-105'
                          } shadow-lg shadow-ink-900/20`}
                        >
                          <Icon size={22} className="text-cream-50" strokeWidth={2} />
                        </div>
                        <span className="text-[10px] font-medium text-ink-400">{item.label}</span>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className="flex flex-col items-center gap-1 px-3 pt-1.5 group"
                    >
                      <Icon
                        size={22}
                        className={`transition-all duration-200 ${
                          isActive ? 'text-ink-900 scale-110' : 'text-ink-300 group-hover:text-ink-500'
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      <span
                        className={`text-[10px] font-medium transition-colors duration-200 ${
                          isActive ? 'text-ink-900' : 'text-ink-300'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
