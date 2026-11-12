import { lazy, Suspense } from 'react';
import type { ClothingItem } from '../types';
import type { AvatarConfig } from '../lib/profiles';

// three.js is large, so the 3D view is only downloaded when someone opens it.
const OutfitFigure = lazy(() => import('./OutfitFigure'));

interface Props {
  items: ClothingItem[];
  avatar: AvatarConfig;
  heightClass?: string;
  caption?: string;
}

export default function FigureCard({ items, avatar, heightClass = 'h-80', caption }: Props) {
  return (
    <div className="rounded-3xl bg-cream-200/70 border border-cream-300/60 overflow-hidden" data-testid="figure-card">
      <Suspense
        fallback={
          <div className={`${heightClass} flex items-center justify-center text-xs text-ink-300`}>Loading the 3D view…</div>
        }
      >
        <OutfitFigure items={items} avatar={avatar} className={`${heightClass} w-full`} />
      </Suspense>
      <p className="text-[11px] text-ink-400 text-center pb-3 px-4">
        {caption ?? 'Drag to turn. A sketch of the colors and layers, not a photo.'}
      </p>
    </div>
  );
}
