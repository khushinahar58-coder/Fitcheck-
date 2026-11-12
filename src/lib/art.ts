// Draws a simple picture of a piece from its kind and color, as an SVG data URL.
// Pieces added by typing ("navy blazer") get one of these instead of a photo, so the closet
// fills up without a camera. Nothing is fetched: the picture is built in the browser.

import type { ClothingItem } from '../types';
import { attrsOf, type Kind } from './attributes';
import { isLightHex } from './color';

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (v: number) => Math.round(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface Ink {
  fill: string;
  edge: string; // outline
  line: string; // seams and details, always visible against the fill
  hi: string; // lighter panel (collars, soles)
}

function inkFor(hex: string): Ink {
  const light = isLightHex(hex);
  return {
    fill: hex,
    edge: shade(hex, light ? -0.42 : -0.35),
    line: light ? shade(hex, -0.3) : shade(hex, 0.28),
    hi: light ? shade(hex, -0.07) : shade(hex, 0.14),
  };
}

const LONG_BODY = 'M118 78 Q150 98 182 78 L212 90 L262 205 L232 218 L205 150 L205 300 L95 300 L95 150 L68 218 L38 205 L88 90 Z';
const SHORT_BODY = 'M118 78 Q150 98 182 78 L212 90 L255 140 L228 162 L205 138 L205 300 L95 300 L95 138 L72 162 L45 140 L88 90 Z';
const CAMI_BODY = 'M120 62 L128 62 L133 118 Q150 132 167 118 L172 62 L180 62 L186 124 L201 150 L205 300 L95 300 L99 150 L114 124 Z';
const LONG_COAT = 'M118 70 Q150 90 182 70 L214 82 L264 215 L234 228 L208 150 L214 362 L86 362 L92 150 L66 228 L36 215 L86 82 Z';
const MID_JACKET = 'M118 74 Q150 94 182 74 L213 86 L263 208 L233 221 L206 150 L208 318 L92 318 L94 150 L67 221 L37 208 L87 86 Z';

function body(d: string, k: Ink, extra = ''): string {
  return `<path d="${d}" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5" stroke-linejoin="round"/>${extra}`;
}

function seam(d: string, k: Ink, width = 2, dash = ''): string {
  return `<path d="${d}" fill="none" stroke="${k.line}" stroke-width="${width}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

function dots(points: Array<[number, number]>, k: Ink, r = 3.2): string {
  return points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k.line}"/>`).join('');
}

const ribbing = (k: Ink) =>
  seam('M95 284 L205 284', k) + seam('M42 196 L72 209', k) + seam('M258 196 L228 209', k);

function draw(kind: Kind, k: Ink): string {
  switch (kind) {
    // ---- Tops
    case 'tee':
      return body(SHORT_BODY, k) + seam('M118 78 Q150 104 182 78', k, 5);
    case 'polo':
      return (
        body(SHORT_BODY, k) +
        `<path d="M118 78 L150 104 L138 122 L112 92 Z M182 78 L150 104 L162 122 L188 92 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2"/>` +
        seam('M150 104 L150 150', k) +
        dots([[150, 120], [150, 138]], k, 2.6)
      );
    case 'shirt':
    case 'blouse':
      return (
        body(LONG_BODY, k) +
        `<path d="M118 78 L150 102 L134 124 L108 88 Z M182 78 L150 102 L166 124 L192 88 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2"/>` +
        seam('M150 102 L150 300', k) +
        (kind === 'shirt' ? dots([[150, 135], [150, 170], [150, 205], [150, 240], [150, 275]], k, 2.6) : seam('M150 102 Q130 150 150 190', k, 1.5)) +
        seam('M44 198 L74 211', k) + seam('M256 198 L226 211', k)
      );
    case 'camisole':
      return body(CAMI_BODY, k) + seam('M133 118 Q150 132 167 118', k, 3);
    case 'turtleneck':
      return (
        `<rect x="124" y="50" width="52" height="42" rx="8" fill="${k.hi}" stroke="${k.edge}" stroke-width="2.5"/>` +
        body(LONG_BODY, k) + seam('M126 66 L174 66', k, 1.5) + ribbing(k)
      );
    case 'sweater':
      return body(LONG_BODY, k) + seam('M118 78 Q150 106 182 78', k, 6) + ribbing(k);
    case 'hoodie':
      return (
        `<path d="M112 84 Q150 30 188 84 Q150 110 112 84 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2.5"/>` +
        body(LONG_BODY, k) +
        seam('M140 100 L138 140 M160 100 L162 140', k, 1.8) +
        `<path d="M118 232 L182 232 L190 276 L110 276 Z" fill="none" stroke="${k.line}" stroke-width="2"/>` + ribbing(k)
      );
    case 'cardigan':
      return (
        body(LONG_BODY, k) +
        `<path d="M118 78 L150 170 L182 78 Q150 98 118 78 Z" fill="#F5F0E9" stroke="${k.edge}" stroke-width="2"/>` +
        seam('M150 170 L150 300', k) + dots([[158, 195], [158, 225], [158, 255], [158, 285]], k, 2.8) + ribbing(k)
      );
    case 'top':
      return body(LONG_BODY, k) + seam('M118 78 Q150 104 182 78', k, 4);

    // ---- Bottoms
    case 'jeans':
    case 'trousers':
    case 'chinos':
    case 'pants':
    case 'joggers': {
      const legs = 'M100 60 L200 60 L214 350 L162 350 L150 150 L138 350 L86 350 Z';
      const crease = kind === 'trousers' ? seam('M119 96 L112 344 M181 96 L188 344', k, 1.5) : '';
      const stitch = kind === 'jeans' ? seam('M106 88 Q118 112 138 112 M194 88 Q182 112 162 112', k, 1.8, '5 4') : seam('M108 88 L130 108 M192 88 L170 108', k, 1.8);
      const cuff = kind === 'joggers' ? seam('M88 336 L138 336 M162 336 L212 336', k, 4) : '';
      return body(legs, k) + seam('M100 78 L200 78', k) + seam('M150 78 L150 128', k, 1.8) + crease + stitch + cuff + dots([[150, 69]], k, 2.6);
    }
    case 'wide-leg':
      return body('M104 60 L196 60 L238 350 L160 350 L150 150 L140 350 L62 350 Z', k) + seam('M104 78 L196 78', k) + seam('M124 96 L100 344 M176 96 L200 344', k, 1.5);
    case 'shorts':
      return body('M100 110 L200 110 L214 250 L158 250 L150 190 L142 250 L86 250 Z', k) + seam('M100 128 L200 128', k) + seam('M150 128 L150 170', k, 1.8);
    case 'skirt':
      return (
        body('M112 70 L188 70 L238 322 Q150 344 62 322 Z', k) + seam('M112 88 L188 88', k) +
        seam('M132 92 L112 330 M150 92 L150 338 M168 92 L188 330', k, 1.4)
      );

    // ---- Dresses
    case 'slip-dress':
      return (
        body('M122 50 L130 50 L135 105 Q150 118 165 105 L170 50 L178 50 L185 110 L198 150 L186 192 L232 350 Q150 368 68 350 L114 192 L102 150 L115 110 Z', k) +
        seam('M114 192 Q150 204 186 192', k, 1.5)
      );
    case 'dress':
      return (
        body('M118 60 Q150 80 182 60 L208 72 L240 115 L216 132 L200 115 L190 185 L236 350 Q150 368 64 350 L110 185 L100 115 L84 132 L60 115 L92 72 Z', k) +
        seam('M110 185 Q150 197 190 185', k, 2) + seam('M118 60 Q150 86 182 60', k, 3)
      );

    // ---- Outerwear
    case 'blazer':
      return (
        body(MID_JACKET, k) +
        `<path d="M118 74 L150 200 L182 74 Q150 94 118 74 Z" fill="#F5F0E9" stroke="${k.edge}" stroke-width="2"/>` +
        `<path d="M118 74 L104 110 L128 122 L150 200 Z M182 74 L196 110 L172 122 L150 200 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2" stroke-linejoin="round"/>` +
        seam('M150 200 L150 318', k) + dots([[158, 222], [158, 256]], k, 3.4) +
        seam('M104 250 L132 250 M168 250 L196 250', k, 2.2) + seam('M172 150 L192 150', k, 2)
      );
    case 'trench':
    case 'coat':
      return (
        body(LONG_COAT, k) +
        `<path d="M118 70 L150 170 L182 70 Q150 90 118 70 Z" fill="#F5F0E9" stroke="${k.edge}" stroke-width="2"/>` +
        `<path d="M118 70 L100 112 L128 128 L150 170 Z M182 70 L200 112 L172 128 L150 170 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2" stroke-linejoin="round"/>` +
        seam('M150 170 L150 362', k) +
        (kind === 'trench'
          ? `<rect x="90" y="222" width="120" height="14" fill="${k.hi}" stroke="${k.edge}" stroke-width="2"/><rect x="141" y="218" width="18" height="22" rx="3" fill="none" stroke="${k.line}" stroke-width="2.5"/>` +
            dots([[132, 190], [168, 190], [132, 262], [168, 262]], k, 3.2)
          : dots([[160, 200], [160, 240], [160, 280]], k, 3.4) + seam('M100 290 L128 290 M172 290 L200 290', k, 2.2))
      );
    case 'puffer':
      return (
        body(MID_JACKET, k) + seam('M150 86 L150 318', k, 2.5) +
        seam('M92 150 L208 150 M93 192 L207 192 M93 234 L207 234 M93 276 L207 276', k, 2) +
        seam('M58 150 L84 138 M242 150 L216 138 M48 180 L76 170 M252 180 L224 170', k, 1.8)
      );
    case 'rain-jacket':
      return (
        `<path d="M110 84 Q150 26 190 84 Q150 108 110 84 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2.5"/>` +
        body(MID_JACKET, k) + seam('M150 92 L150 318', k, 3) +
        seam('M104 240 L134 250 M196 240 L166 250', k, 2.2) + seam('M92 304 L208 304', k, 1.6)
      );
    case 'denim-jacket':
      return (
        body('M118 78 Q150 98 182 78 L212 90 L262 205 L232 218 L205 150 L205 290 L95 290 L95 150 L68 218 L38 205 L88 90 Z', k) +
        `<path d="M118 78 L150 104 L134 126 L108 88 Z M182 78 L150 104 L166 126 L192 88 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2"/>` +
        seam('M150 104 L150 290', k) + dots([[150, 140], [150, 176], [150, 212], [150, 248]], k, 2.8) +
        `<rect x="106" y="150" width="30" height="26" rx="3" fill="none" stroke="${k.line}" stroke-width="2"/><rect x="164" y="150" width="30" height="26" rx="3" fill="none" stroke="${k.line}" stroke-width="2"/>` +
        seam('M95 274 L205 274', k, 2, '5 4')
      );
    case 'leather-jacket':
      return (
        body('M118 78 Q150 98 182 78 L212 90 L262 205 L232 218 L205 150 L205 286 L95 286 L95 150 L68 218 L38 205 L88 90 Z', k) +
        `<path d="M118 78 L160 150 L130 142 L104 96 Z M182 78 L150 132 L176 138 L196 96 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2" stroke-linejoin="round"/>` +
        seam('M160 150 L138 286', k, 2.5) + seam('M108 222 L132 232 M192 222 L168 232', k, 2.2) + seam('M95 272 L205 272', k, 2)
      );
    case 'jacket':
      return (
        body(MID_JACKET, k) +
        `<path d="M118 74 L150 100 L136 120 L108 84 Z M182 74 L150 100 L164 120 L192 84 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2"/>` +
        seam('M150 100 L150 318', k, 2.5) +
        `<rect x="102" y="150" width="34" height="30" rx="3" fill="none" stroke="${k.line}" stroke-width="2"/><rect x="164" y="150" width="34" height="30" rx="3" fill="none" stroke="${k.line}" stroke-width="2"/>` +
        `<rect x="100" y="246" width="38" height="40" rx="3" fill="none" stroke="${k.line}" stroke-width="2"/><rect x="162" y="246" width="38" height="40" rx="3" fill="none" stroke="${k.line}" stroke-width="2"/>`
      );

    // ---- Shoes (side view)
    case 'sneakers':
      return (
        `<rect x="44" y="262" width="218" height="20" rx="10" fill="#E9E4DA" stroke="${k.edge}" stroke-width="2.5"/>` +
        body('M50 264 Q50 218 96 208 L128 202 Q148 172 176 184 L192 216 Q232 226 250 244 Q260 254 258 264 Z', k) +
        seam('M128 202 L176 228 M140 190 L188 214', k, 2) + seam('M186 230 Q214 236 240 250', k, 2) +
        seam('M60 236 Q78 222 100 222', k, 2)
      );
    case 'boots':
      return (
        `<path d="M56 268 L258 268 L258 284 L128 284 L128 300 L56 300 Z" fill="${k.edge}"/>` +
        body('M96 100 L168 100 L172 214 Q228 224 250 246 Q260 256 258 268 L56 268 Q52 238 92 226 Z', k) +
        seam('M96 122 L168 122', k, 2) + seam('M118 128 L112 220 M150 128 L156 216', k, 1.8) + seam('M172 214 Q150 230 96 232', k, 2)
      );
    case 'heels':
      return (
        body('M60 214 Q104 210 150 244 Q200 268 250 264 L258 276 L150 276 Q118 268 96 252 L90 306 L78 306 L70 244 Q62 232 60 214 Z', k) +
        seam('M70 226 Q110 226 150 256', k, 1.8)
      );
    case 'flats':
      return (
        `<path d="M48 272 L260 272 L258 282 L52 282 Z" fill="${k.edge}"/>` +
        body('M48 272 Q50 238 104 234 Q112 258 176 258 Q200 246 222 250 Q258 256 260 272 Z', k) +
        `<path d="M104 234 Q112 258 176 258 Q160 238 104 234 Z" fill="#F5F0E9" stroke="${k.edge}" stroke-width="2"/>` +
        seam('M204 252 q8 -8 16 0', k, 2.2)
      );
    case 'loafers':
    case 'dress-shoes':
    case 'shoes':
      return (
        `<path d="M48 270 L260 270 L260 282 L96 282 L96 292 L48 292 Z" fill="${k.edge}"/>` +
        body('M48 270 Q48 232 92 220 Q112 214 124 226 Q168 232 196 244 Q250 250 260 270 Z', k) +
        `<path d="M92 220 Q112 214 124 226 Q150 246 122 250 Q96 246 92 220 Z" fill="#F5F0E9" stroke="${k.edge}" stroke-width="2"/>` +
        (kind === 'loafers'
          ? seam('M140 236 Q164 228 188 244', k, 5)
          : seam('M136 232 L160 246 M146 228 L170 242 M156 226 L180 240', k, 2)) +
        seam('M206 250 Q232 254 250 264', k, 1.8)
      );
    case 'sandals':
      return (
        `<path d="M46 268 Q150 258 262 268 L262 284 L46 284 Z" fill="${k.edge}"/>` +
        seam('M92 264 Q110 214 150 262', k, 12).replace(k.line, k.fill) +
        seam('M176 264 Q204 226 236 264', k, 12).replace(k.line, k.fill)
      );

    // ---- Accessories
    case 'bag':
      return (
        `<path d="M108 178 Q150 84 192 178" fill="none" stroke="${k.edge}" stroke-width="9" stroke-linecap="round"/>` +
        `<rect x="76" y="170" width="148" height="138" rx="18" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5"/>` +
        seam('M76 206 L224 206', k, 2) +
        `<rect x="138" y="196" width="24" height="22" rx="4" fill="${k.hi}" stroke="${k.edge}" stroke-width="2"/>`
      );
    case 'hat':
      return (
        `<path d="M62 232 Q60 126 150 126 Q240 126 238 232 Z" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5"/>` +
        `<path d="M54 232 Q150 208 246 232 Q268 250 262 272 Q150 232 38 272 Q32 250 54 232 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2.5" stroke-linejoin="round"/>` +
        seam('M150 126 L150 214 M104 140 Q112 190 110 222 M196 140 Q188 190 190 222', k, 1.6) +
        `<circle cx="150" cy="124" r="6" fill="${k.hi}" stroke="${k.edge}" stroke-width="2"/>`
      );
    case 'scarf':
      return (
        `<path d="M96 96 Q150 60 204 96 Q214 140 150 150 Q86 140 96 96 Z" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5"/>` +
        `<path d="M120 142 L104 316 L140 320 L156 148 Z" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5" stroke-linejoin="round"/>` +
        `<path d="M152 148 L176 300 L208 292 L182 140 Z" fill="${k.hi}" stroke="${k.edge}" stroke-width="2.5" stroke-linejoin="round"/>` +
        seam('M106 318 L104 338 M116 319 L115 339 M127 320 L127 340 M138 320 L139 340 M180 299 L184 318 M190 297 L195 316 M200 294 L206 313', k, 2) +
        seam('M112 104 Q150 84 188 104', k, 1.8)
      );
    case 'belt':
      return (
        `<rect x="30" y="184" width="240" height="32" rx="6" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5"/>` +
        `<rect x="128" y="174" width="46" height="52" rx="6" fill="none" stroke="#B8923F" stroke-width="6"/>` +
        seam('M151 200 L176 200', { ...k, line: '#B8923F' }, 4) + dots([[206, 200], [226, 200], [246, 200]], k, 2.6)
      );
    case 'watch':
      return (
        `<rect x="128" y="58" width="44" height="284" rx="12" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5"/>` +
        seam('M128 110 L172 110 M128 290 L172 290', k, 1.8) +
        `<circle cx="150" cy="200" r="52" fill="#C9CDD2" stroke="#7E848C" stroke-width="3"/>` +
        `<circle cx="150" cy="200" r="40" fill="#FBFAF7" stroke="#7E848C" stroke-width="2"/>` +
        `<path d="M150 200 L150 172 M150 200 L170 210" fill="none" stroke="#2D2722" stroke-width="3.5" stroke-linecap="round"/>` +
        `<rect x="200" y="193" width="10" height="14" rx="3" fill="#7E848C"/>`
      );
    case 'necklace':
      return (
        `<path d="M84 96 Q150 300 216 96" fill="none" stroke="${k.fill}" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 7"/>` +
        `<path d="M84 96 Q150 300 216 96" fill="none" stroke="${k.edge}" stroke-width="1.4" stroke-linecap="round"/>` +
        `<circle cx="150" cy="206" r="15" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5"/>` +
        `<circle cx="146" cy="202" r="4" fill="${k.hi}"/>`
      );
    case 'earrings':
      return [102, 198]
        .map(
          (x) =>
            `<path d="M${x} 110 q-14 22 0 40" fill="none" stroke="${k.edge}" stroke-width="3" stroke-linecap="round"/>` +
            `<circle cx="${x}" cy="172" r="12" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5"/>` +
            `<path d="M${x} 186 L${x - 22} 262 Q${x} 286 ${x + 22} 262 Z" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5" stroke-linejoin="round"/>` +
            `<circle cx="${x - 4}" cy="168" r="3.5" fill="${k.hi}"/>`
        )
        .join('');
    case 'sunglasses':
      return (
        `<rect x="46" y="170" width="92" height="68" rx="26" fill="${k.fill}" stroke="${k.edge}" stroke-width="3"/>` +
        `<rect x="162" y="170" width="92" height="68" rx="26" fill="${k.fill}" stroke="${k.edge}" stroke-width="3"/>` +
        seam('M138 192 Q150 180 162 192', { ...k, line: k.edge }, 4) + seam('M62 190 L84 182 M178 190 L200 182', k, 3)
      );
    case 'tie':
      return (
        body('M134 60 L166 60 L172 90 L128 90 Z', k) +
        body('M130 92 L170 92 L186 300 L150 344 L114 300 Z', k) + seam('M124 180 L176 150 M120 240 L180 206 M124 296 L184 262', k, 2)
      );
    case 'accessory':
    default:
      return (
        `<path d="M150 96 L224 200 L150 304 L76 200 Z" fill="${k.fill}" stroke="${k.edge}" stroke-width="2.5" stroke-linejoin="round"/>` +
        seam('M150 96 L150 304 M76 200 L224 200', k, 1.8)
      );
  }
}

const CACHE = new Map<string, string>();

export function garmentArt(item: Pick<ClothingItem, 'name' | 'category' | 'color' | 'tags'>): string {
  const a = attrsOf(item);
  const key = `${a.kind}|${a.color.hex}|${a.color.pattern}`;
  const cached = CACHE.get(key);
  if (cached) return cached;

  const k = inkFor(a.color.hex);
  let defs = '';
  if (a.color.pattern) {
    // A small repeating blossom, so a "floral" piece reads as patterned at thumbnail size.
    defs =
      `<defs><pattern id="p" width="34" height="34" patternUnits="userSpaceOnUse">` +
      `<rect width="34" height="34" fill="${k.fill}"/>` +
      `<circle cx="9" cy="9" r="4.4" fill="${k.line}"/><circle cx="26" cy="25" r="3.4" fill="${k.hi}"/>` +
      `<circle cx="9" cy="9" r="1.6" fill="${k.fill}"/></pattern></defs>`;
    k.fill = 'url(#p)';
  }
  let art = defs + draw(a.kind, k);
  // Shoes are drawn small; enlarge them so they fill the card like the other pieces.
  if (item.category === 'Shoes') art = `<g transform="translate(150 250) scale(1.28) translate(-150 -250)">${art}</g>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">` +
    `<rect width="300" height="400" fill="#F5F0E9"/>` +
    `<ellipse cx="150" cy="372" rx="96" ry="9" fill="#E3DACB"/>` +
    art +
    `</svg>`;
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  CACHE.set(key, url);
  return url;
}

// True for a picture this file drew (as opposed to a photo the user took or picked).
export function isGarmentArt(image: string): boolean {
  return image.startsWith('data:image/svg+xml');
}
