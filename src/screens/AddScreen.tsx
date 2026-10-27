import { useState, useRef } from 'react';
import { Camera, ImagePlus, Check, X, Sparkles, ArrowRight, Wand2, ShoppingBag } from 'lucide-react';
import type { ClothingItem, Category } from '../types';
import { CATEGORIES, SAMPLE_GALLERY } from '../data';
import type { Screen } from '../App';

interface Props {
  onAddItem: (item: Omit<ClothingItem, 'id'>) => void;
  onNavigate: (s: Screen) => void;
  currentCount: number;
}

const SAMPLE_LABELS = [
  'Floral Blouse',
  'Pinstripe Blazer',
  'Garden Dress',
  'City Trousers',
  'Cozy Sweater',
  'Fall Coat',
  'Dinner Silk Top',
  'Everyday Crossbody',
  'Distressed Jeans',
];

const SAMPLE_CATEGORIES: Category[] = [
  'Tops',
  'Outerwear',
  'Dresses',
  'Bottoms',
  'Tops',
  'Outerwear',
  'Tops',
  'Accessories',
  'Bottoms',
];

export default function AddScreen({ onAddItem, onNavigate, currentCount }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState<'upload' | 'gallery'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setMode('upload');
    };
    reader.readAsDataURL(file);
  };

  const handleSampleSelect = (image: string, index: number) => {
    setSelectedImage(image);
    setMode('gallery');
    if (!itemName) setItemName(SAMPLE_LABELS[index] ?? '');
    if (!category) setCategory(SAMPLE_CATEGORIES[index] ?? '');
  };

  const handleAdd = () => {
    if (!selectedImage) return;
    onAddItem({
      name: itemName || 'New Piece',
      category: (category || 'Tops') as Category,
      image: selectedImage,
      color: color || 'Not specified',
      brand: brand || 'Unknown',
      lastWornDaysAgo: -1,
      tags: ['newly-added'],
    });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedImage(null);
      setItemName('');
      setCategory('');
      setColor('');
      setBrand('');
      setMode('upload');
      onNavigate('wardrobe');
    }, 1200);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setItemName('');
    setCategory('');
    setColor('');
    setBrand('');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-serif font-medium text-ink-900">Add to Wardrobe</h1>
        <p className="text-sm text-ink-400 mt-1">
          Snap a photo or pick from our gallery to grow your collection.
        </p>
      </div>

      {/* Empty wardrobe demo banner */}
      {currentCount === 0 && (
        <div className="mx-6 mb-5 p-4 bg-clay-100/60 rounded-2xl border border-clay-200">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-clay-500" />
            <span className="text-sm font-medium text-clay-600">Your wardrobe is empty</span>
          </div>
          <p className="text-xs text-clay-600/80">
            Add your first piece below — every great outfit starts with a single item.
          </p>
        </div>
      )}

      {/* Upload zone */}
      {!selectedImage && (
        <div className="px-6 space-y-5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-cream-400 bg-cream-200/40 flex flex-col items-center justify-center gap-3 hover:border-ink-300 hover:bg-cream-200/60 transition-all duration-300 group"
          >
            <div className="w-16 h-16 rounded-full bg-cream-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera size={28} className="text-ink-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink-600">Take or upload a photo</p>
              <p className="text-xs text-ink-300 mt-0.5">JPG, PNG — anything works</p>
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

          {/* Smart features */}
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => onNavigate('extract')}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-cream-200/60 hover:border-ink-200 hover:shadow-md transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-clay-100 to-clay-200 flex items-center justify-center flex-shrink-0">
                <Wand2 size={22} className="text-clay-600" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-ink-900">Extract from outfit photo</h3>
                <p className="text-xs text-ink-300 mt-0.5">
                  Upload a photo of an outfit — we'll identify each piece
                </p>
              </div>
              <ArrowRight
                size={18}
                className="text-ink-200 group-hover:text-ink-500 group-hover:translate-x-1 transition-all"
              />
            </button>

            <button
              onClick={() => onNavigate('import')}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-cream-200/60 hover:border-ink-200 hover:shadow-md transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={22} className="text-sage-500" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-ink-900">Import past purchases</h3>
                <p className="text-xs text-ink-300 mt-0.5">
                  Connect shopping accounts to find clothes you already own
                </p>
              </div>
              <ArrowRight
                size={18}
                className="text-ink-200 group-hover:text-ink-500 group-hover:translate-x-1 transition-all"
              />
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-cream-300" />
            <span className="text-xs uppercase tracking-wider text-ink-300">or try our gallery</span>
            <div className="flex-1 h-px bg-cream-300" />
          </div>

          {/* Sample gallery */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ImagePlus size={16} className="text-ink-400" />
              <h3 className="text-sm font-medium text-ink-600">Sample pieces</h3>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {SAMPLE_GALLERY.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handleSampleSelect(img, i)}
                  className="aspect-[3/4] rounded-xl overflow-hidden bg-cream-200 group relative"
                >
                  <img
                    src={img}
                    alt={SAMPLE_LABELS[i]}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/10 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected image + form */}
      {selectedImage && (
        <div className="px-6 animate-slide-up">
          {/* Preview */}
          <div className="relative rounded-3xl overflow-hidden mb-5">
            <img src={selectedImage} alt="Selected" className="w-full aspect-[4/5] object-cover" />
            <button
              onClick={handleReset}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-cream-50/90 backdrop-blur-sm flex items-center justify-center"
            >
              <X size={18} className="text-ink-700" />
            </button>
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-cream-50/90 backdrop-blur-sm">
              <span className="text-xs font-medium text-ink-600">
                {mode === 'gallery' ? 'From gallery' : 'Your photo'}
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-400 uppercase tracking-wider">
                Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Linen Blouse"
                className="w-full mt-1.5 px-4 py-3 bg-cream-200/60 rounded-2xl text-sm text-ink-800 placeholder:text-ink-300 border border-transparent focus:border-ink-200 focus:bg-cream-50 outline-none transition-all"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-400 uppercase tracking-wider">
                  Color
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. White"
                  className="w-full mt-1.5 px-4 py-3 bg-cream-200/60 rounded-2xl text-sm text-ink-800 placeholder:text-ink-300 border border-transparent focus:border-ink-200 focus:bg-cream-50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-400 uppercase tracking-wider">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Zara"
                  className="w-full mt-1.5 px-4 py-3 bg-cream-200/60 rounded-2xl text-sm text-ink-800 placeholder:text-ink-300 border border-transparent focus:border-ink-200 focus:bg-cream-50 outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={!selectedImage}
              className="w-full py-3.5 bg-ink-900 text-cream-50 rounded-2xl text-sm font-medium hover:bg-ink-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={18} />
              Add to wardrobe
            </button>
          </div>
        </div>
      )}

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-50/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-success-500 flex items-center justify-center mx-auto mb-4">
              <Check size={36} className="text-cream-50" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-serif text-ink-900">Added to your wardrobe!</h2>
            <p className="text-sm text-ink-400 mt-1 flex items-center justify-center gap-1">
              Taking you to your collection <ArrowRight size={14} />
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
