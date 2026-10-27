import { useState, useCallback } from 'react';
import { Home, Shirt, Plus, Bookmark, CalendarDays, User } from 'lucide-react';
import { useWardrobeStore } from './store';
import type { OccasionId } from './types';
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
  | 'import';

export interface ConfirmationContext {
  occasionId: OccasionId;
  occasionLabel: string;
  outfitId: string;
  outfitName: string;
  slots: Array<{ role: string; itemId: string }>;
}

const NAV_ITEMS: Array<{ id: Screen; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
  { id: 'add', label: 'Add', icon: Plus },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
];

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionId | null>(null);
  const [confirmationCtx, setConfirmationCtx] = useState<ConfirmationContext | null>(null);
  const [viewingSavedId, setViewingSavedId] = useState<string | null>(null);

  const store = useWardrobeStore();

  const navigate = useCallback((s: Screen) => {
    setScreen(s);
    setViewingSavedId(null);
  }, []);

  const handleSelectOccasion = useCallback((id: OccasionId) => {
    setSelectedOccasion(id);
    setScreen('recommendations');
  }, []);

  const handleConfirmOutfit = useCallback((ctx: ConfirmationContext) => {
    setConfirmationCtx(ctx);
    setScreen('confirmation');
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
    <div className="min-h-screen bg-cream-100 text-ink-800 flex flex-col">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col relative bg-cream-50 min-h-screen shadow-sm">
        <div className="flex-1 pb-20">
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
            />
          )}
          {screen === 'calendar' && (
            <CalendarScreen
              entries={store.calendarEntries}
              items={store.items}
              onRemoveEntry={store.removeCalendarEntry}
              onMarkWorn={(entryId, itemIds) => {
                store.markCalendarEntryWorn(entryId);
                store.markItemsWorn(itemIds);
              }}
              onNavigate={navigate}
            />
          )}
          {screen === 'profile' && (
            <ProfileScreen
              items={store.items}
              savedOutfits={store.savedOutfits}
              calendarEntries={store.calendarEntries}
              onNavigate={navigate}
            />
          )}
          {screen === 'recommendations' && selectedOccasion && (
            <RecommendationsScreen
              occasionId={selectedOccasion}
              items={store.items}
              onBack={() => navigate('home')}
              onConfirmOutfit={handleConfirmOutfit}
            />
          )}
          {screen === 'confirmation' && confirmationCtx && (
            <ConfirmationScreen
              ctx={confirmationCtx}
              items={store.items}
              savedOutfits={store.savedOutfits}
              onBack={() => setScreen('recommendations')}
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
                          isActive
                            ? 'bg-ink-900 scale-105'
                            : 'bg-ink-900 hover:scale-105'
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
                        isActive
                          ? 'text-ink-900 scale-110'
                          : 'text-ink-300 group-hover:text-ink-500'
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
  );
}

export default App;
