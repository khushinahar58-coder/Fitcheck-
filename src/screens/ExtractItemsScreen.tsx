import { useState, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  X,
  Sparkles,
  Check,
  Trash2,
  Edit3,
  Loader2,
  Wand2,
  ArrowRight,
  ImagePlus,
} from 'lucide-react';
import type { ClothingItem, Category } from '../types';
import { CATEGORIES, OUTFIT_PHOTO_SAMPLES, simulateExtraction, type DetectedItem } from '../data';
import type { Screen } from '../App';

interface Props {
  onAddItem: (item: Omit<ClothingItem, 'id'>) => void;
  onNavigate: (s: Screen) => void;
  onBack: () => void;
}

type Phase = 'upload' | 'analyzing' | 'results' | 'success';

export default function ExtractItemsScreen({ onAddItem, onNavigate, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('upload');
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setOutfitImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSampleSelect = (image: string) => {
    setOutfitImage(image);
  };

  const handleAnalyze = () => {
    if (!outfitImage) return;
    setPhase('analyzing');
    setTimeout(() => {
      const results = simulateExtraction(outfitImage);
      setDetectedItems(results);
      setPhase('results');
    }, 2200);
  };

  const handleRemoveDetected = (id: string) => {
    setDetectedItems((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateDetected = (id: string, updates: Partial<DetectedItem>) => {
    setDetectedItems((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    setEditingId(null);
  };

  const handleConfirmAdd = () => {
    detectedItems.forEach((item) => {
      onAddItem({
        name: item.name,
        category: item.category,
        image: item.image,
        color: item.color,
        brand: 'Unknown',
        lastWornDaysAgo: -1,
        tags: ['extracted', 'newly-added'],
      });
    });
    setAddedCount(detectedItems.length);
    setPhase('success');
    setTimeout(() => {
      onNavigate('wardrobe');
    }, 1600);
  };

  const handleReset = () => {
    setOutfitImage(null);
    setDetectedItems([]);
    setPhase('upload');
  };

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
            <Wand2 size={18} className="text-ink-500" />
            <h1 className="text-lg font-serif font-medium text-ink-900">Extract from Photo</h1>
          </div>
        </div>
      </div>

      {/* Phase: Upload */}
      {phase === 'upload' && (
        <div className="px-6 pb-8 space-y-5">
          <div className="p-4 bg-cream-200/50 rounded-2xl">
            <p className="text-sm text-ink-500 leading-relaxed">
              Upload a photo of yourself wearing an outfit. FitCheck will identify each clothing
              item and extract it as a standalone piece — background removed.
            </p>
          </div>

          {/* Upload zone */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-cream-400 bg-cream-200/40 flex flex-col items-center justify-center gap-3 hover:border-ink-300 hover:bg-cream-200/60 transition-all duration-300 group"
          >
            <div className="w-16 h-16 rounded-full bg-cream-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera size={28} className="text-ink-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink-600">Upload an outfit photo</p>
              <p className="text-xs text-ink-300 mt-0.5">Full-body photos work best</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Sample outfit photos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ImagePlus size={16} className="text-ink-400" />
              <h3 className="text-sm font-medium text-ink-600">Or try a sample outfit</h3>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {OUTFIT_PHOTO_SAMPLES.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => handleSampleSelect(sample.image)}
                  className={`aspect-[3/4] rounded-xl overflow-hidden bg-cream-200 group relative border-2 transition-all ${
                    outfitImage === sample.image
                      ? 'border-ink-900 ring-2 ring-ink-900/10'
                      : 'border-transparent'
                  }`}
                >
                  <img
                    src={sample.image}
                    alt={sample.label}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {outfitImage === sample.image && (
                    <div className="absolute inset-0 bg-ink-900/20 flex items-center justify-center">
                      <Check size={20} className="text-cream-50" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze button */}
          {outfitImage && (
            <div className="animate-slide-up">
              <div className="relative rounded-2xl overflow-hidden mb-4">
                <img src={outfitImage} alt="Outfit" className="w-full aspect-[4/5] object-cover" />
                <button
                  onClick={handleReset}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-cream-50/90 backdrop-blur-sm flex items-center justify-center"
                >
                  <X size={18} className="text-ink-700" />
                </button>
              </div>
              <button
                onClick={handleAnalyze}
                className="w-full py-3.5 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Analyze outfit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Phase: Analyzing */}
      {phase === 'analyzing' && outfitImage && (
        <div className="px-6 pb-8">
          <div className="relative rounded-3xl overflow-hidden mb-6">
            <img src={outfitImage} alt="Analyzing" className="w-full aspect-[4/5] object-cover" />
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Scanning animation */}
              <div className="relative w-48 h-48 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-cream-50/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cream-50 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={32} className="text-cream-50 animate-spin" />
                </div>
              </div>
              <p className="text-sm font-medium text-cream-50">Analyzing your outfit...</p>
              <p className="text-xs text-cream-300 mt-1">Detecting clothing items</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="space-y-2.5">
            {[
              { label: 'Identifying person & background', done: true },
              { label: 'Detecting clothing items', done: true },
              { label: 'Extracting individual pieces', done: false },
              { label: 'Removing backgrounds', done: false },
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-cream-200/40 rounded-xl animate-slide-up"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.done ? 'bg-success-500' : 'bg-cream-300'
                  }`}
                >
                  {step.done ? (
                    <Check size={14} className="text-cream-50" />
                  ) : (
                    <Loader2 size={14} className="text-ink-400 animate-spin" />
                  )}
                </div>
                <span
                  className={`text-sm ${step.done ? 'text-ink-700' : 'text-ink-400'}`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase: Results */}
      {phase === 'results' && (
        <div className="px-6 pb-8 animate-fade-in">
          {detectedItems.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-cream-200 mx-auto mb-4 flex items-center justify-center">
                <Sparkles size={24} className="text-ink-300" />
              </div>
              <h3 className="text-lg font-serif text-ink-700">No items left</h3>
              <p className="text-sm text-ink-300 mt-1">
                You removed all detected items. Try uploading a different photo.
              </p>
              <button
                onClick={handleReset}
                className="mt-5 px-5 py-3 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium"
              >
                Start over
              </button>
            </div>
          ) : (
            <>
              {/* Results header */}
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-clay-500" />
                <h2 className="text-xl font-serif text-ink-900">
                  We found {detectedItems.length} item{detectedItems.length > 1 ? 's' : ''}
                </h2>
              </div>
              <p className="text-sm text-ink-400 mb-5">
                Review each piece, edit details, or remove incorrect detections.
              </p>

              {/* Original photo reference */}
              {outfitImage && (
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-wider text-ink-300 font-medium mb-2">
                    Source photo
                  </p>
                  <div className="flex gap-3">
                    <div className="w-20 h-24 rounded-xl overflow-hidden bg-cream-200 flex-shrink-0">
                      <img src={outfitImage} alt="Source" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex items-center">
                      <p className="text-xs text-ink-400 leading-relaxed">
                        Items extracted from this photo with backgrounds removed. Each piece is
                        ready to add to your wardrobe.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detected items */}
              <div className="space-y-4">
                {detectedItems.map((item) => (
                  <DetectedItemCard
                    key={item.id}
                    item={item}
                    onRemove={() => handleRemoveDetected(item.id)}
                    onEdit={() => setEditingId(item.id)}
                  />
                ))}
              </div>

              {/* Confirm button */}
              <button
                onClick={handleConfirmAdd}
                className="w-full mt-6 py-4 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2 group"
              >
                <Check size={18} />
                Add {detectedItems.length} item{detectedItems.length > 1 ? 's' : ''} to wardrobe
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleReset}
                className="w-full mt-3 py-3 text-ink-400 text-sm font-medium hover:text-ink-600 transition-colors"
              >
                Try a different photo
              </button>
            </>
          )}
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
        <EditItemModal
          item={detectedItems.find((d) => d.id === editingId)!}
          onSave={(updates) => handleUpdateDetected(editingId, updates)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function DetectedItemCard({
  item,
  onRemove,
  onEdit,
}: {
  item: DetectedItem;
  onRemove: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-cream-200/60 overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="w-24 h-28 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0 relative">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-cream-50/90 backdrop-blur-sm">
            <span className="text-[9px] font-medium text-ink-600">
              {item.confidence}% match
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-ink-300 font-medium">
                {item.category}
              </span>
              <h3 className="text-sm font-medium text-ink-800 mt-0.5 truncate">{item.name}</h3>
              <p className="text-xs text-ink-300 mt-0.5">{item.color}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg bg-cream-200/70 text-ink-600 text-xs font-medium hover:bg-cream-300 transition-colors flex items-center gap-1.5"
            >
              <Edit3 size={13} />
              Edit
            </button>
            <button
              onClick={onRemove}
              className="px-3 py-1.5 rounded-lg bg-error-400/10 text-error-500 text-xs font-medium hover:bg-error-400/20 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditItemModal({
  item,
  onSave,
  onClose,
}: {
  item: DetectedItem;
  onSave: (updates: Partial<DetectedItem>) => void;
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
          <div className="flex justify-center">
            <div className="w-32 h-36 rounded-2xl overflow-hidden bg-cream-200">
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
