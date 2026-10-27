import { useState, useMemo } from 'react';
import { ArrowLeft, Heart, RefreshCw, Check, Sparkles, ArrowRight, X, Plus, Trash2 } from 'lucide-react';
import type { ClothingItem, OccasionId, Outfit, OutfitSlot, Category } from '../types';
import { OUTFITS, OCCASIONS, CATEGORIES } from '../data';
import { getItemById, getRarelyWornItems, formatLastWorn } from '../store';
import { getOccasionIcon } from '../components/icons';
import type { ConfirmationContext } from '../App';

interface Props {
  occasionId: OccasionId;
  items: ClothingItem[];
  onBack: () => void;
  onConfirmOutfit: (ctx: ConfirmationContext) => void;
}

export default function RecommendationsScreen({ occasionId, items, onBack, onConfirmOutfit }: Props) {
  const occasion = OCCASIONS.find((o) => o.id === occasionId)!;
  const OccasionIcon = getOccasionIcon(occasion.emoji);

  const occasionOutfits = useMemo(
    () => OUTFITS.filter((o) => o.occasionId === occasionId),
    [occasionId]
  );

  const [selectedOutfitId, setSelectedOutfitId] = useState<string>(
    occasionOutfits[0]?.id ?? ''
  );
  const [swapState, setSwapState] = useState<{ role: string; currentItemId: string } | null>(null);
  const [addState, setAddState] = useState(false);
  const [likedOutfits, setLikedOutfits] = useState<Set<string>>(new Set());

  const selectedOutfit = occasionOutfits.find((o) => o.id === selectedOutfitId);
  const rarelyWorn = useMemo(() => getRarelyWornItems(items, 30), [items]);

  // Track modifications: swapOverrides maps role->newItemId, removedRoles is a set of removed roles, addedSlots is extra slots
  const [swapOverrides, setSwapOverrides] = useState<Record<string, string>>({});
  const [removedRoles, setRemovedRoles] = useState<Set<string>>(new Set());
  const [addedSlots, setAddedSlots] = useState<OutfitSlot[]>([]);

  const handleSwap = (role: string, _currentItemId: string, newItemId: string) => {
    setSwapState(null);
    if (selectedOutfit) {
      setSwapOverrides((prev) => ({
        ...prev,
        [`${selectedOutfit.id}-${role}`]: newItemId,
      }));
    }
  };

  const handleRemove = (role: string) => {
    if (selectedOutfit) {
      setRemovedRoles((prev) => new Set([...prev, `${selectedOutfit.id}-${role}`]));
    }
  };

  const handleAddItem = (item: ClothingItem, role: string) => {
    if (selectedOutfit) {
      const newSlot: OutfitSlot = { role: role || item.category, itemId: item.id };
      setAddedSlots((prev) => [...prev, newSlot]);
    }
    setAddState(false);
  };

  const getEffectiveSlots = (outfit: Outfit): OutfitSlot[] => {
    const baseSlots = outfit.slots
      .filter((slot) => !removedRoles.has(`${outfit.id}-${slot.role}`))
      .map((slot) => {
        const overrideKey = `${outfit.id}-${slot.role}`;
        const override = swapOverrides[overrideKey];
        return override ? { ...slot, itemId: override } : slot;
      });
    return [...baseSlots, ...addedSlots];
  };

  const toggleLike = (outfitId: string) => {
    setLikedOutfits((prev) => {
      const next = new Set(prev);
      if (next.has(outfitId)) next.delete(outfitId);
      else next.add(outfitId);
      return next;
    });
  };

  const effectiveSlots = selectedOutfit ? getEffectiveSlots(selectedOutfit) : [];
  const usedItemIds = new Set(effectiveSlots.map((s) => s.itemId));

  return (
    <div className="animate-fade-in min-h-screen">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 sticky top-0 bg-cream-50/95 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors"
          >
            <ArrowLeft size={18} className="text-ink-700" />
          </button>
          <div className="flex items-center gap-2">
            <OccasionIcon size={18} className="text-ink-500" />
            <span className="text-sm text-ink-400">{occasion.label}</span>
          </div>
        </div>
        <h1 className="text-[26px] font-serif text-ink-900 leading-tight">
          Your {occasion.label} looks
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          {occasionOutfits.length} outfits curated from your wardrobe
        </p>
      </div>

      {/* Outfit selector tabs */}
      <div className="px-6 pt-2 pb-4">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-6 px-6">
          {occasionOutfits.map((outfit) => {
            const isLiked = likedOutfits.has(outfit.id);
            const isSelected = outfit.id === selectedOutfitId;
            return (
              <button
                key={outfit.id}
                onClick={() => {
                  setSelectedOutfitId(outfit.id);
                  setRemovedRoles(new Set());
                  setAddedSlots([]);
                  setSwapOverrides({});
                }}
                className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-ink-900 text-cream-50'
                    : 'bg-cream-200/60 text-ink-500 hover:bg-cream-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {outfit.featured && (
                    <Sparkles
                      size={12}
                      className={isSelected ? 'text-gold-300' : 'text-clay-400'}
                    />
                  )}
                  {outfit.name}
                  {isLiked && (
                    <Heart size={12} className={isSelected ? 'text-clay-300' : 'text-clay-400'} fill="currentColor" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured outfit display */}
      {selectedOutfit && (
        <div className="px-6 pb-8 animate-scale-in" key={selectedOutfit.id}>
          {/* Outfit name & description */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-xl font-serif text-ink-900">{selectedOutfit.name}</h2>
                <p className="text-sm text-ink-400 mt-1 leading-relaxed">
                  {selectedOutfit.description}
                </p>
              </div>
              <button
                onClick={() => toggleLike(selectedOutfit.id)}
                className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
              >
                <Heart
                  size={18}
                  className={
                    likedOutfits.has(selectedOutfit.id)
                      ? 'text-clay-500'
                      : 'text-ink-300'
                  }
                  fill={likedOutfits.has(selectedOutfit.id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>
          </div>

          {/* Outfit items - stacked layout */}
          <div className="space-y-3">
            {effectiveSlots.map((slot) => {
              const item = getItemById(items, slot.itemId);
              if (!item) return null;
              const isRarelyWorn = item.lastWornDaysAgo >= 30;
              const isOverridden = swapOverrides[`${selectedOutfit.id}-${slot.role}`] !== undefined;
              const isAdded = addedSlots.some((s) => s.role === slot.role && s.itemId === slot.itemId);

              return (
                <div
                  key={slot.role}
                  className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-cream-200/60 group"
                >
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-cream-200 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-ink-300 font-medium">
                        {slot.role}
                      </span>
                      {isRarelyWorn && (
                        <span className="px-1.5 py-0.5 rounded-full bg-clay-100 text-[9px] font-medium text-clay-600">
                          Rarely worn
                        </span>
                      )}
                      {isOverridden && (
                        <span className="px-1.5 py-0.5 rounded-full bg-sage-100 text-[9px] font-medium text-sage-500">
                          Swapped
                        </span>
                      )}
                      {isAdded && (
                        <span className="px-1.5 py-0.5 rounded-full bg-sage-100 text-[9px] font-medium text-sage-500">
                          Added
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-ink-800 mt-0.5 truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-ink-300">
                      {item.brand} · {item.color}
                    </p>
                    {isRarelyWorn && (
                      <p className="text-[10px] text-clay-400 mt-0.5">
                        {formatLastWorn(item.lastWornDaysAgo)}
                      </p>
                    )}
                  </div>
                  {/* Swap + Remove buttons */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setSwapState({ role: slot.role, currentItemId: item.id })}
                      className="px-3 py-1.5 rounded-xl bg-cream-200/70 text-ink-500 text-xs font-medium hover:bg-cream-300 transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} />
                      Swap
                    </button>
                    <button
                      onClick={() => handleRemove(slot.role)}
                      className="px-3 py-1.5 rounded-xl bg-error-400/10 text-error-500 text-xs font-medium hover:bg-error-400/20 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add item button */}
          <button
            onClick={() => setAddState(true)}
            className="w-full mt-3 py-3 rounded-2xl border-2 border-dashed border-cream-400 text-ink-400 text-sm font-medium hover:border-ink-300 hover:text-ink-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add an item to this outfit
          </button>

          {/* Action button */}
          <button
            onClick={() => {
              onConfirmOutfit({
                occasionId: occasion.id,
                occasionLabel: occasion.label,
                outfitId: selectedOutfit.id,
                outfitName: selectedOutfit.name,
                slots: effectiveSlots,
              });
            }}
            disabled={effectiveSlots.length === 0}
            className="w-full mt-6 py-4 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            <Heart size={18} fill="currentColor" />
            I'd wear this
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Swap bottom sheet */}
      {swapState && selectedOutfit && (
        <SwapSheet
          role={swapState.role}
          currentItem={getItemById(items, swapState.currentItemId)!}
          allItems={items}
          rarelyWornItemIds={new Set(rarelyWorn.map((i) => i.id))}
          onSelect={(newItemId) => handleSwap(swapState.role, swapState.currentItemId, newItemId)}
          onClose={() => setSwapState(null)}
        />
      )}

      {/* Add item bottom sheet */}
      {addState && selectedOutfit && (
        <AddItemSheet
          allItems={items}
          usedItemIds={usedItemIds}
          rarelyWornItemIds={new Set(rarelyWorn.map((i) => i.id))}
          onSelect={handleAddItem}
          onClose={() => setAddState(false)}
        />
      )}
    </div>
  );
}

function SwapSheet({
  role,
  currentItem,
  allItems,
  rarelyWornItemIds,
  onSelect,
  onClose,
}: {
  role: string;
  currentItem: ClothingItem;
  allItems: ClothingItem[];
  rarelyWornItemIds: Set<string>;
  onSelect: (itemId: string) => void;
  onClose: () => void;
}) {
  const options = allItems.filter(
    (i) => i.category === currentItem.category && i.id !== currentItem.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-md bg-cream-50 rounded-t-4xl overflow-hidden animate-slide-up max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-cream-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-300 font-medium">Swap {role}</p>
            <h3 className="text-lg font-serif text-ink-900 mt-0.5">Choose an alternative</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center"
          >
            <X size={18} className="text-ink-600" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="mb-4">
            <p className="text-xs text-ink-300 mb-2">Currently wearing</p>
            <div className="flex items-center gap-3 p-3 bg-cream-200/50 rounded-2xl border-2 border-cream-300">
              <div className="w-14 h-16 rounded-lg overflow-hidden bg-cream-300 flex-shrink-0">
                <img src={currentItem.image} alt={currentItem.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-ink-800">{currentItem.name}</h4>
                <p className="text-xs text-ink-300">{currentItem.brand}</p>
              </div>
              <Check size={18} className="text-ink-400" />
            </div>
          </div>
          {options.length === 0 ? (
            <p className="text-sm text-ink-300 text-center py-8">
              No other {currentItem.category.toLowerCase()} in your wardrobe. Try adding more pieces!
            </p>
          ) : (
            <>
              <p className="text-xs text-ink-300 mb-2">{options.length} alternative{options.length > 1 ? 's' : ''}</p>
              <div className="grid grid-cols-2 gap-3">
                {options.map((item) => {
                  const isRarelyWorn = rarelyWornItemIds.has(item.id);
                  return (
                    <button key={item.id} onClick={() => onSelect(item.id)} className="text-left group">
                      <div className="relative rounded-xl overflow-hidden bg-cream-200 aspect-[3/4]">
                        <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {isRarelyWorn && (
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-clay-500/90 backdrop-blur-sm">
                            <span className="text-[9px] font-medium text-cream-50">Rarely worn</span>
                          </div>
                        )}
                      </div>
                      <h4 className="text-xs font-medium text-ink-800 mt-1.5 truncate">{item.name}</h4>
                      <p className="text-[10px] text-ink-300">{item.color}</p>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddItemSheet({
  allItems,
  usedItemIds,
  rarelyWornItemIds,
  onSelect,
  onClose,
}: {
  allItems: ClothingItem[];
  usedItemIds: Set<string>;
  rarelyWornItemIds: Set<string>;
  onSelect: (item: ClothingItem, role: string) => void;
  onClose: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const availableItems = allItems.filter(
    (i) => !usedItemIds.has(i.id) && (selectedCategory === 'All' || i.category === selectedCategory)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-md bg-cream-50 rounded-t-4xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-cream-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-300 font-medium">Add to outfit</p>
            <h3 className="text-lg font-serif text-ink-900 mt-0.5">Choose a piece to add</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center">
            <X size={18} className="text-ink-600" />
          </button>
        </div>

        {/* Category filter */}
        <div className="px-5 pt-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-ink-900 text-cream-50'
                  : 'bg-cream-200/60 text-ink-500 hover:bg-cream-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-5">
          {availableItems.length === 0 ? (
            <p className="text-sm text-ink-300 text-center py-8">
              No more items available in this category.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableItems.map((item) => {
                const isRarelyWorn = rarelyWornItemIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item, item.category)}
                    className="text-left group"
                  >
                    <div className="relative rounded-xl overflow-hidden bg-cream-200 aspect-[3/4]">
                      <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {isRarelyWorn && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-clay-500/90 backdrop-blur-sm">
                          <span className="text-[9px] font-medium text-cream-50">Rarely worn</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/10 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-cream-50/90 items-center justify-center hidden group-hover:flex">
                          <Plus size={16} className="text-ink-700" />
                        </div>
                      </div>
                    </div>
                    <h4 className="text-xs font-medium text-ink-800 mt-1.5 truncate">{item.name}</h4>
                    <p className="text-[10px] text-ink-300">{item.category} · {item.color}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
