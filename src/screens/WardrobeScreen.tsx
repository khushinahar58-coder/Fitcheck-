import { useState, useMemo } from 'react';
import { Search, X, Clock, Trash2 } from 'lucide-react';
import type { ClothingItem } from '../types';
import { CATEGORIES } from '../data';
import { getItemsByCategory, formatLastWorn, getWornUrgency } from '../store';

interface Props {
  items: ClothingItem[];
  onRemoveItem: (id: string) => void;
}

// Pinterest-style masonry columns
const COLUMN_COUNT = 2;

export default function WardrobeScreen({ items, onRemoveItem }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [notWornRecently, setNotWornRecently] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  const filteredItems = useMemo(() => {
    let result = getItemsByCategory(items, activeCategory);
    if (notWornRecently) {
      result = result.filter((i) => i.lastWornDaysAgo >= 30);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.brand.toLowerCase().includes(q) ||
          i.color.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeCategory, notWornRecently, searchQuery]);

  const columns: ClothingItem[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  filteredItems.forEach((item, i) => {
    columns[i % COLUMN_COUNT].push(item);
  });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    for (const cat of CATEGORIES) {
      if (cat === 'All') continue;
      counts[cat] = items.filter((i) => i.category === cat).length;
    }
    return counts;
  }, [items]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 sticky top-0 bg-cream-50/95 backdrop-blur-xl z-40 border-b border-cream-200/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-serif font-medium text-ink-900">Wardrobe</h1>
            <p className="text-xs text-ink-300 mt-0.5">{items.length} pieces in your collection</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, brand, color..."
            className="w-full pl-10 pr-10 py-3 bg-cream-200/70 rounded-2xl text-sm text-ink-800 placeholder:text-ink-300 border border-transparent focus:border-ink-200 focus:bg-cream-50 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-ink-900 text-cream-50'
                    : 'bg-cream-200/70 text-ink-500 hover:bg-cream-300'
                }`}
              >
                {cat}
                <span className={`ml-1.5 ${isActive ? 'text-cream-300' : 'text-ink-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Not worn recently filter */}
        <button
          onClick={() => setNotWornRecently((v) => !v)}
          className={`mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
            notWornRecently
              ? 'bg-clay-100 text-clay-600 border border-clay-200'
              : 'bg-cream-200/50 text-ink-400 border border-transparent hover:border-cream-300'
          }`}
        >
          <Clock size={14} className={notWornRecently ? 'text-clay-500' : 'text-ink-300'} />
          Not worn recently
          {notWornRecently && <X size={12} />}
        </button>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="px-6 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-cream-200 mx-auto mb-4 flex items-center justify-center">
            <Search size={24} className="text-ink-300" />
          </div>
          <h3 className="text-lg font-serif text-ink-700">No pieces found</h3>
          <p className="text-sm text-ink-300 mt-1 max-w-[220px] mx-auto">
            Try a different category or clear your filters.
          </p>
          {(notWornRecently || searchQuery) && (
            <button
              onClick={() => {
                setNotWornRecently(false);
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="mt-4 px-4 py-2 bg-ink-900 text-cream-50 rounded-full text-xs font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 pt-4 pb-8 flex gap-3">
          {columns.map((col, ci) => (
            <div key={ci} className="flex-1 space-y-3">
              {col.map((item) => {
                const urgency = getWornUrgency(item.lastWornDaysAgo);
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="block w-full text-left group"
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-cream-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ aspectRatio: '3 / 4' }}
                      />
                      {urgency === 'rarely' && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-clay-500/90 backdrop-blur-sm">
                          <span className="text-[10px] font-medium text-cream-50">
                            {formatLastWorn(item.lastWornDaysAgo)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="pt-2 px-1">
                      <h3 className="text-sm font-medium text-ink-800 truncate">{item.name}</h3>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-ink-300">{item.brand}</span>
                        <span className="text-[10px] text-ink-300">{item.color}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Item detail bottom sheet */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setSelectedItem(null)}
        >
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative w-full max-w-md bg-cream-50 rounded-t-4xl overflow-hidden animate-slide-up max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="w-full aspect-[4/5] object-cover"
              />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-cream-50/90 backdrop-blur-sm flex items-center justify-center"
              >
                <X size={18} className="text-ink-700" />
              </button>
              <div className="absolute bottom-3 left-3 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-cream-50/90 backdrop-blur-sm text-xs font-medium text-ink-700">
                  {selectedItem.category}
                </span>
                {getWornUrgency(selectedItem.lastWornDaysAgo) === 'rarely' && (
                  <span className="px-3 py-1 rounded-full bg-clay-500/90 backdrop-blur-sm text-xs font-medium text-cream-50">
                    Rarely worn
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-serif text-ink-900">{selectedItem.name}</h2>
              <p className="text-sm text-ink-400 mt-1">{selectedItem.brand}</p>

              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="p-3 bg-cream-200/60 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wider text-ink-300 font-medium">Color</p>
                  <p className="text-sm text-ink-800 mt-1">{selectedItem.color}</p>
                </div>
                <div className="p-3 bg-cream-200/60 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wider text-ink-300 font-medium">Last worn</p>
                  <p
                    className={`text-sm mt-1 ${
                      getWornUrgency(selectedItem.lastWornDaysAgo) === 'rarely'
                        ? 'text-clay-500'
                        : 'text-ink-800'
                    }`}
                  >
                    {formatLastWorn(selectedItem.lastWornDaysAgo)}
                  </p>
                </div>
              </div>

              {selectedItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-cream-200 text-xs text-ink-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    onRemoveItem(selectedItem.id);
                    setSelectedItem(null);
                  }}
                  className="flex-1 py-3 rounded-2xl border border-error-400/30 text-error-500 text-sm font-medium hover:bg-error-400/5 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Remove from wardrobe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
