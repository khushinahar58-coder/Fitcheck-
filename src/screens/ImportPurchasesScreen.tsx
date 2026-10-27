import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  Check,
  X,
  Sparkles,
  Edit3,
  ChevronRight,
  Loader2,
  ArrowRight,
  Search,
} from 'lucide-react';
import type { ClothingItem, Category } from '../types';
import {
  CATEGORIES,
  RETAILERS,
  MOCK_PURCHASES,
  type PurchaseItem,
  type Retailer,
} from '../data';
import type { Screen } from '../App';

interface Props {
  onAddItem: (item: Omit<ClothingItem, 'id'>) => void;
  onNavigate: (s: Screen) => void;
  onBack: () => void;
}

type Phase = 'retailers' | 'connecting' | 'purchases' | 'success';

export default function ImportPurchasesScreen({ onAddItem, onNavigate, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('retailers');
  const [connectedRetailers, setConnectedRetailers] = useState<Set<string>>(new Set());
  const [connectingRetailer, setConnectingRetailer] = useState<Retailer | null>(null);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedCount, setAddedCount] = useState(0);

  const handleConnect = (retailer: Retailer) => {
    setConnectingRetailer(retailer);
    setPhase('connecting');
    setTimeout(() => {
      setConnectedRetailers((prev) => new Set([...prev, retailer.id]));
      // Load purchases for this retailer
      const newPurchases = MOCK_PURCHASES.filter((p) => p.retailerId === retailer.id);
      setPurchases((prev) => {
        const existing = prev.filter((p) => p.retailerId !== retailer.id);
        return [...existing, ...newPurchases];
      });
      // Auto-select all new purchases
      setSelectedIds((prev) => new Set([...prev, ...newPurchases.map((p) => p.id)]));
      setConnectingRetailer(null);
      setPhase('retailers');
    }, 2000);
  };

  const handleViewPurchases = () => {
    setPhase('purchases');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpdatePurchase = (id: string, updates: Partial<PurchaseItem>) => {
    setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    setEditingId(null);
  };

  const handleAddSelected = () => {
    const selected = purchases.filter((p) => selectedIds.has(p.id));
    selected.forEach((item) => {
      onAddItem({
        name: item.name,
        category: item.category,
        image: item.image,
        color: item.color,
        brand: item.retailerName,
        lastWornDaysAgo: -1,
        tags: ['imported', 'newly-added'],
      });
    });
    setAddedCount(selected.length);
    setPhase('success');
    setTimeout(() => {
      onNavigate('wardrobe');
    }, 1600);
  };

  const filteredPurchases = useMemo(() => {
    if (!searchQuery.trim()) return purchases;
    const q = searchQuery.toLowerCase();
    return purchases.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.retailerName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [purchases, searchQuery]);

  const connectedCount = connectedRetailers.size;
  const totalPurchases = purchases.length;

  return (
    <div className="animate-fade-in min-h-screen">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 sticky top-0 bg-cream-50/95 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors"
          >
            <ArrowLeft size={18} className="text-ink-700" />
          </button>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-ink-500" />
            <h1 className="text-lg font-serif font-medium text-ink-900">Import Purchases</h1>
          </div>
        </div>
      </div>

      {/* Phase: Retailers */}
      {phase === 'retailers' && (
        <div className="px-6 pb-8 space-y-5">
          <div className="p-4 bg-cream-200/50 rounded-2xl">
            <p className="text-sm text-ink-500 leading-relaxed">
              Connect your shopping accounts to import past fashion purchases. We'll find
              clothing items and add them to your wardrobe in seconds.
            </p>
          </div>

          {/* Connected summary */}
          {connectedCount > 0 && (
            <div className="p-4 bg-gradient-to-br from-sage-50 to-cream-100 rounded-2xl border border-sage-100 animate-slide-up">
              <div className="flex items-center gap-2 mb-1">
                <Check size={16} className="text-sage-500" />
                <span className="text-sm font-medium text-sage-500">
                  {connectedCount} account{connectedCount > 1 ? 's' : ''} connected
                </span>
              </div>
              <p className="text-sm text-ink-600">
                {totalPurchases} fashion purchases found across your connected retailers.
              </p>
            </div>
          )}

          {/* Retailer list */}
          <div>
            <h3 className="text-sm font-medium text-ink-500 uppercase tracking-wider mb-3">
              Shopping accounts
            </h3>
            <div className="space-y-2.5">
              {RETAILERS.map((retailer) => {
                const isConnected = connectedRetailers.has(retailer.id);
                return (
                  <div
                    key={retailer.id}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                      isConnected
                        ? 'bg-white border-sage-200/60'
                        : 'bg-white border-cream-200/60 hover:border-ink-200'
                    }`}
                  >
                    {/* Retailer logo */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: retailer.color }}
                    >
                      <span className="text-sm font-serif font-medium text-cream-50">
                        {retailer.initial}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-ink-800">{retailer.name}</h4>
                      <p className="text-xs text-ink-300">
                        {isConnected
                          ? `${retailer.purchaseCount} fashion purchases found`
                          : `${retailer.purchaseCount} purchases available`}
                      </p>
                    </div>

                    {/* Action */}
                    {isConnected ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sage-100 text-sage-500 text-xs font-medium">
                        <Check size={14} />
                        Connected
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(retailer)}
                        className="px-3.5 py-2 rounded-xl bg-ink-900 text-cream-50 text-xs font-medium hover:bg-ink-800 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* View purchases button */}
          {totalPurchases > 0 && (
            <button
              onClick={handleViewPurchases}
              className="w-full py-4 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2 group animate-slide-up"
            >
              <Sparkles size={18} />
              Review {totalPurchases} fashion purchases
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      )}

      {/* Phase: Connecting (overlay) */}
      {phase === 'connecting' && connectingRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-50/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: connectingRetailer.color }}
            >
              <span className="text-2xl font-serif font-medium text-cream-50">
                {connectingRetailer.initial}
              </span>
            </div>
            <h2 className="text-xl font-serif text-ink-900">
              Connecting to {connectingRetailer.name}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Loader2 size={16} className="text-ink-400 animate-spin" />
              <p className="text-sm text-ink-400">Fetching your purchase history...</p>
            </div>
          </div>
        </div>
      )}

      {/* Phase: Purchases */}
      {phase === 'purchases' && (
        <div className="px-6 pb-8 animate-fade-in">
          {/* Results header */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-clay-500" />
            <h2 className="text-xl font-serif text-ink-900">
              We found {totalPurchases} fashion purchase{totalPurchases > 1 ? 's' : ''}
            </h2>
          </div>
          <p className="text-sm text-ink-400 mb-4">
            Select items to add to your wardrobe. Non-fashion purchases have been filtered out.
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search purchases..."
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

          {/* Select all / deselect all */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-ink-400">
              {selectedIds.size} of {totalPurchases} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedIds(new Set(purchases.map((p) => p.id)))}
                className="text-xs font-medium text-ink-500 hover:text-ink-900 transition-colors"
              >
                Select all
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-medium text-ink-400 hover:text-ink-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Purchase list */}
          <div className="space-y-3">
            {filteredPurchases.map((item) => (
              <PurchaseCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onToggle={() => toggleSelect(item.id)}
                onEdit={() => setEditingId(item.id)}
              />
            ))}
          </div>

          {filteredPurchases.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-ink-300">No purchases match your search.</p>
            </div>
          )}

          {/* Add button */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleAddSelected}
              className="w-full mt-6 py-4 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2 group sticky bottom-4"
            >
              <Check size={18} />
              Add {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} to my wardrobe
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <button
            onClick={() => setPhase('retailers')}
            className="w-full mt-3 py-3 text-ink-400 text-sm font-medium hover:text-ink-600 transition-colors"
          >
            Back to retailers
          </button>
        </div>
      )}

      {/* Phase: Success */}
      {phase === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-50/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-success-500 flex items-center justify-center mx-auto mb-4">
              <Check size={36} className="text-cream-50" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-serif text-ink-900">
              {addedCount} item{addedCount > 1 ? 's' : ''} added!
            </h2>
            <p className="text-sm text-ink-400 mt-1 flex items-center justify-center gap-1">
              Taking you to your collection <ArrowRight size={14} />
            </p>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <EditPurchaseModal
          item={purchases.find((p) => p.id === editingId)!}
          onSave={(updates) => handleUpdatePurchase(editingId, updates)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function PurchaseCard({
  item,
  selected,
  onToggle,
  onEdit,
}: {
  item: PurchaseItem;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const retailer = RETAILERS.find((r) => r.id === item.retailerId);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all ${
        selected ? 'border-ink-900/30 ring-1 ring-ink-900/10' : 'border-cream-200/60'
      }`}
    >
      <div className="flex gap-3 p-3">
        {/* Checkbox + image */}
        <button onClick={onToggle} className="flex-shrink-0">
          <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-cream-200">
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div
              className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                selected ? 'bg-ink-900' : 'bg-cream-50/80 backdrop-blur-sm'
              }`}
            >
              {selected && <Check size={12} className="text-cream-50" strokeWidth={3} />}
            </div>
          </div>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {retailer && (
              <div
                className="w-4 h-4 rounded flex items-center justify-center"
                style={{ backgroundColor: retailer.color }}
              >
                <span className="text-[7px] font-serif font-medium text-cream-50">
                  {retailer.initial}
                </span>
              </div>
            )}
            <span className="text-[10px] text-ink-300 font-medium">{item.retailerName}</span>
          </div>
          <h3 className="text-sm font-medium text-ink-800 truncate">{item.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-ink-400">{item.category}</span>
            <span className="text-xs text-ink-300">·</span>
            <span className="text-xs text-ink-400">{item.color}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink-700">{item.price}</span>
              <span className="text-[10px] text-ink-300">{item.purchaseDate}</span>
            </div>
            <button
              onClick={onEdit}
              className="px-2.5 py-1.5 rounded-lg bg-cream-200/70 text-ink-500 text-[11px] font-medium hover:bg-cream-300 transition-colors flex items-center gap-1"
            >
              <Edit3 size={12} />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditPurchaseModal({
  item,
  onSave,
  onClose,
}: {
  item: PurchaseItem;
  onSave: (updates: Partial<PurchaseItem>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<Category>(item.category);
  const [color, setColor] = useState(item.color);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-md bg-cream-50 rounded-t-4xl overflow-hidden animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-cream-200 flex items-center justify-between">
          <h3 className="text-lg font-serif text-ink-900">Edit item</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center"
          >
            <X size={18} className="text-ink-600" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex justify-center gap-3">
            <div className="w-28 h-32 rounded-2xl overflow-hidden bg-cream-200">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-400 uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 bg-cream-200/60 rounded-2xl text-sm text-ink-800 border border-transparent focus:border-ink-200 focus:bg-cream-50 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-400 uppercase tracking-wider">
              Category
            </label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat as Category)}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                    category === cat
                      ? 'bg-ink-900 text-cream-50'
                      : 'bg-cream-200/60 text-ink-500 hover:bg-cream-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-400 uppercase tracking-wider">
              Color
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 bg-cream-200/60 rounded-2xl text-sm text-ink-800 border border-transparent focus:border-ink-200 focus:bg-cream-50 outline-none transition-all"
            />
          </div>

          {/* Purchase info */}
          <div className="p-3 bg-cream-200/40 rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-400">Retailer</span>
              <span className="text-ink-600 font-medium">{item.retailerName}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-ink-400">Purchase date</span>
              <span className="text-ink-600">{item.purchaseDate}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-ink-400">Price</span>
              <span className="text-ink-600 font-medium">{item.price}</span>
            </div>
          </div>

          <button
            onClick={() => onSave({ name, category, color })}
            className="w-full py-3.5 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
