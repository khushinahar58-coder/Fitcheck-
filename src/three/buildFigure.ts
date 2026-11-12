// Builds a simple 3D figure wearing a look. Everything is made from basic shapes, so there is
// no model file to download: a body in the avatar's build and skin tone, then each piece of
// the look as a slightly larger shell in that piece's color.
//
// It is a sketch of the look (colors, layers, lengths), not a photo of the person.

import * as THREE from 'three';
import type { ClothingItem } from '../types';
import { attrsOf, type Attrs, type Kind } from '../lib/attributes';
import type { AvatarConfig } from '../lib/profiles';

interface Dims {
  shoulder: number;
  waist: number;
  hip: number;
}

const BUILDS: Record<AvatarConfig['build'], Dims> = {
  slim: { shoulder: 0.37, waist: 0.26, hip: 0.32 },
  regular: { shoulder: 0.4, waist: 0.29, hip: 0.35 },
  broad: { shoulder: 0.46, waist: 0.33, hip: 0.36 },
  curvy: { shoulder: 0.38, waist: 0.27, hip: 0.41 },
};

const DEPTH = 0.62; // front-to-back thickness as a share of side-to-side width
const Y = { ankle: 0.07, knee: 0.5, crotch: 0.86, hip: 0.95, waist: 1.1, chest: 1.3, shoulder: 1.41, neck: 1.47, head: 1.61 };

interface Worn {
  item: ClothingItem;
  a: Attrs;
}

export interface FigureSpec {
  top?: Worn;
  mid?: Worn;
  bottom?: Worn;
  dress?: Worn;
  outer?: Worn;
  shoes?: Worn;
  accessories: Worn[];
}

// Sort a look's pieces into the places they go on the body.
export function figureSpec(items: ClothingItem[]): FigureSpec {
  const spec: FigureSpec = { accessories: [] };
  for (const item of items) {
    const worn = { item, a: attrsOf(item) };
    switch (item.category) {
      case 'Tops':
        if (worn.a.kind === 'cardigan' && items.some((i) => i !== item && (i.category === 'Tops' || i.category === 'Dresses'))) spec.mid ??= worn;
        else spec.top ??= worn;
        break;
      case 'Bottoms':
        spec.bottom ??= worn;
        break;
      case 'Dresses':
        spec.dress ??= worn;
        break;
      case 'Outerwear':
        spec.outer ??= worn;
        break;
      case 'Shoes':
        spec.shoes ??= worn;
        break;
      case 'Accessories':
        spec.accessories.push(worn);
        break;
    }
  }
  return spec;
}

function patternTexture(hex: string): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (const [x, y, r] of [[14, 14, 6], [46, 44, 5], [44, 12, 3], [14, 46, 3]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function cloth(worn: Worn, doubleSided = false): THREE.MeshStandardMaterial {
  const shiny = /silk|satin|leather/.test(`${worn.item.name} ${(worn.item.tags ?? []).join(' ')}`.toLowerCase());
  const map = worn.a.color.pattern ? patternTexture(worn.a.color.hex) : null;
  return new THREE.MeshStandardMaterial({
    color: map ? '#ffffff' : worn.a.color.hex,
    map,
    roughness: shiny ? 0.45 : 0.92,
    metalness: 0,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  });
}

function plain(hex: string, roughness = 0.8, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
}

function named<T extends THREE.Object3D>(object: T, name: string): T {
  object.name = name;
  return object;
}

// A body section made by spinning a width profile around the spine, then flattening it
// front-to-back. `grow` pushes the surface out so clothes sit over the body.
function shell(
  profile: Array<[number, number]>, // [height, half-width]
  material: THREE.Material,
  grow = 0,
  open = 0 // radians left open at the front, for jackets and cardigans
): THREE.Mesh {
  const points = profile.map(([y, r]) => new THREE.Vector2(Math.max(0.001, r + grow), y));
  const geometry = new THREE.LatheGeometry(points, 40, open / 2, Math.PI * 2 - open);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.z = DEPTH;
  return mesh;
}

// A limb or sleeve: a tapered tube between two points.
function tube(from: THREE.Vector3, to: THREE.Vector3, rFrom: number, rTo: number, material: THREE.Material): THREE.Mesh {
  const length = from.distanceTo(to);
  const geometry = new THREE.CylinderGeometry(rFrom, rTo, length, 20, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), from.clone().sub(to).normalize());
  return mesh;
}

function ball(at: THREE.Vector3, r: number, material: THREE.Material, scale?: [number, number, number]): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), material);
  mesh.position.copy(at);
  if (scale) mesh.scale.set(...scale);
  return mesh;
}

const SLEEVELESS: Kind[] = ['camisole', 'slip-dress'];
const SHORT_SLEEVED: Kind[] = ['tee', 'polo', 'dress'];

export function buildFigure(items: ClothingItem[], avatar: AvatarConfig): THREE.Group {
  const spec = figureSpec(items);
  const d = BUILDS[avatar.build];
  const figure = new THREE.Group();
  const skin = plain(avatar.skin, 0.75);
  const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

  const torsoProfile: Array<[number, number]> = [
    [Y.crotch, d.hip * 0.42],
    [Y.hip, d.hip * 0.5],
    [Y.waist, d.waist * 0.5],
    [Y.chest, d.shoulder * 0.46],
    [Y.shoulder, d.shoulder * 0.47],
    [Y.neck - 0.01, 0.06],
  ];
  const shoulderX = d.shoulder * 0.5 - 0.01;
  const handX = shoulderX + 0.075;
  const legX = d.hip * 0.25;

  // ---- Body
  const body = named(new THREE.Group(), 'body');
  body.add(shell(torsoProfile, skin));
  body.add(tube(v(0, Y.neck + 0.07, 0), v(0, Y.neck - 0.03, 0), 0.045, 0.05, skin));
  body.add(named(ball(v(0, Y.head, 0), 0.105, skin, [1, 1.16, 1.02]), 'head'));
  for (const side of [-1, 1]) {
    const shoulder = v(side * shoulderX, Y.shoulder - 0.02);
    const elbow = v(side * (shoulderX + 0.045), 1.13);
    const wrist = v(side * handX, 0.86);
    body.add(ball(shoulder, 0.052, skin));
    body.add(tube(shoulder, elbow, 0.048, 0.04, skin));
    body.add(tube(elbow, wrist, 0.04, 0.03, skin));
    body.add(ball(v(side * handX, 0.815), 0.04, skin, [0.8, 1.25, 0.6]));
    body.add(tube(v(side * legX, Y.hip - 0.03), v(side * legX, Y.knee), 0.085, 0.058, skin));
    body.add(tube(v(side * legX, Y.knee), v(side * legX, Y.ankle), 0.058, 0.037, skin));
    body.add(ball(v(side * legX, 0.04, 0.05), 0.05, skin, [0.85, 0.7, 2.1]));
  }
  figure.add(body);

  // ---- Hair
  if (avatar.hair !== 'none') {
    const hair = named(new THREE.Group(), 'hair');
    const hairMat = plain(avatar.hairColor, 0.95);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.113, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat);
    cap.position.set(0, Y.head + 0.014, -0.016);
    cap.scale.set(1.03, 1.16, 1.06);
    cap.rotation.x = -0.55;
    hair.add(cap);
    if (avatar.hair === 'medium' || avatar.hair === 'long') {
      const length = avatar.hair === 'long' ? 0.36 : 0.17;
      const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, length, 6, 16), hairMat);
      back.position.set(0, Y.head - 0.03 - length / 2, -0.055);
      back.scale.set(1.08, 1, 0.55);
      hair.add(back);
    }
    if (avatar.hair === 'bun') hair.add(ball(v(0, Y.head + 0.1, -0.09), 0.055, hairMat));
    figure.add(hair);
  }
  if (avatar.beard) {
    const beard = named(ball(v(0, Y.head - 0.065, 0.035), 0.085, plain(avatar.hairColor, 0.95), [0.95, 0.75, 0.85]), 'beard');
    figure.add(beard);
  }

  // ---- Sleeves, shared by tops, layers and outerwear
  const sleeves = (grow: number, length: 'long' | 'short', material: THREE.Material) => {
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      // Thicker layers sit lower on the shoulder, so a coat does not look padded.
      const shoulder = v(side * (shoulderX - grow * 0.2), Y.shoulder - 0.02 - grow * 0.5);
      const elbow = v(side * (shoulderX + 0.045), 1.13);
      const wrist = v(side * (handX - 0.004), 0.88);
      group.add(ball(shoulder, 0.05 + grow * 0.55, material));
      if (length === 'short') {
        const mid = shoulder.clone().lerp(elbow, 0.62);
        group.add(tube(shoulder, mid, 0.052 + grow, 0.05 + grow, material));
      } else {
        group.add(tube(shoulder, elbow, 0.05 + grow, 0.044 + grow, material));
        group.add(ball(elbow, 0.044 + grow, material));
        group.add(tube(elbow, wrist, 0.044 + grow, 0.036 + grow, material));
      }
    }
    return group;
  };

  // ---- Bottom (drawn before the top so an untucked top covers the waistband)
  if (spec.bottom && !spec.dress) {
    const worn = spec.bottom;
    const material = cloth(worn);
    const group = named(new THREE.Group(), 'garment-bottom');
    const kind = worn.a.kind;
    if (kind === 'skirt') {
      const hem = /mini/.test(worn.item.name.toLowerCase()) ? 0.62 : 0.4;
      group.add(
        shell(
          [[hem, d.hip * 0.5 + 0.11], [Y.hip - 0.05, d.hip * 0.5 + 0.02], [Y.hip, d.hip * 0.5], [Y.waist + 0.01, d.waist * 0.5]],
          cloth(worn, true),
          0.014
        )
      );
    } else {
      group.add(shell([[Y.crotch - 0.03, d.hip * 0.36], [Y.hip, d.hip * 0.5], [Y.waist + 0.01, d.waist * 0.5]], material, 0.014));
      const hemY = kind === 'shorts' ? 0.62 : Y.ankle + 0.015;
      const wide = kind === 'wide-leg';
      const slim = kind === 'jeans' || kind === 'joggers';
      for (const side of [-1, 1]) {
        const top = v(side * legX, Y.hip - 0.04);
        if (kind === 'shorts') {
          group.add(tube(top, v(side * legX, hemY), 0.096, 0.088, material));
        } else {
          const kneeR = wide ? 0.095 : slim ? 0.066 : 0.072;
          const hemR = wide ? 0.125 : slim ? 0.05 : 0.062;
          group.add(tube(top, v(side * legX, Y.knee), 0.096, kneeR, material));
          group.add(tube(v(side * legX, Y.knee), v(side * (legX + (wide ? 0.012 : 0)), hemY), kneeR, hemR, material));
        }
      }
    }
    figure.add(group);
  }

  // ---- Dress
  if (spec.dress) {
    const worn = spec.dress;
    const material = cloth(worn, true);
    const group = named(new THREE.Group(), 'garment-dress');
    const slip = worn.a.kind === 'slip-dress';
    const top = slip ? Y.chest + 0.045 : Y.shoulder;
    const profile: Array<[number, number]> = [
      [0.42, d.hip * 0.5 + (slip ? 0.07 : 0.13)],
      [Y.hip, d.hip * 0.5 + 0.012],
      [Y.waist, d.waist * 0.5 + 0.004],
      [Y.chest, d.shoulder * 0.46],
    ];
    if (!slip) profile.push([top, d.shoulder * 0.47], [Y.neck - 0.035, 0.085]);
    else profile.push([top, d.shoulder * 0.44]);
    group.add(shell(profile, material, 0.014));
    if (slip) {
      for (const side of [-1, 1]) {
        group.add(tube(v(side * 0.085, top - 0.01, 0.07), v(side * 0.1, Y.shoulder + 0.012, 0), 0.007, 0.007, material));
        group.add(tube(v(side * 0.1, Y.shoulder + 0.012, 0), v(side * 0.085, top - 0.01, -0.07), 0.007, 0.007, material));
      }
    } else {
      group.add(sleeves(0.012, 'short', material));
    }
    figure.add(group);
  }

  // ---- Top
  if (spec.top && !spec.dress) {
    const worn = spec.top;
    const material = cloth(worn);
    const group = named(new THREE.Group(), 'garment-top');
    const kind = worn.a.kind;
    const sleeveless = SLEEVELESS.includes(kind);
    const hem = Y.hip - 0.03;
    const profile: Array<[number, number]> = [
      [hem, d.hip * 0.5 + 0.008],
      [Y.waist, d.waist * 0.5 + 0.014],
      [Y.chest, d.shoulder * 0.46],
    ];
    if (sleeveless) profile.push([Y.chest + 0.05, d.shoulder * 0.44]);
    else profile.push([Y.shoulder, d.shoulder * 0.47], [Y.neck - 0.035, kind === 'turtleneck' ? 0.055 : 0.082]);
    group.add(shell(profile, sleeveless ? cloth(worn, true) : material, 0.016));
    if (sleeveless) {
      for (const side of [-1, 1]) {
        group.add(tube(v(side * 0.085, Y.chest + 0.04, 0.075), v(side * 0.1, Y.shoulder + 0.012, 0), 0.007, 0.007, material));
        group.add(tube(v(side * 0.1, Y.shoulder + 0.012, 0), v(side * 0.085, Y.chest + 0.04, -0.075), 0.007, 0.007, material));
      }
    } else {
      group.add(sleeves(0.014, SHORT_SLEEVED.includes(kind) ? 'short' : 'long', material));
    }
    if (kind === 'turtleneck') group.add(tube(v(0, Y.neck + 0.055, 0), v(0, Y.neck - 0.035, 0), 0.056, 0.062, material));
    if (kind === 'shirt' || kind === 'polo' || kind === 'blouse') {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.016, 10, 28), material);
      collar.position.set(0, Y.neck - 0.012, 0.004);
      collar.rotation.x = Math.PI / 2 - 0.25;
      collar.scale.set(1, 1, 0.8);
      group.add(collar);
    }
    if (kind === 'hoodie') {
      const hood = ball(v(0, Y.neck + 0.02, -0.07), 0.1, material, [1.05, 0.9, 0.8]);
      group.add(hood);
    }
    figure.add(group);
  }

  // ---- Open layers: a cardigan, then outerwear over it
  const openLayer = (worn: Worn, name: string, grow: number) => {
    const material = cloth(worn, true);
    const kind = worn.a.kind;
    const long = kind === 'trench' || kind === 'coat';
    const cropped = kind === 'denim-jacket' || kind === 'leather-jacket';
    const hem = long ? 0.5 : cropped ? Y.hip - 0.02 : kind === 'cardigan' ? Y.hip - 0.09 : Y.crotch - 0.04;
    const group = named(new THREE.Group(), name);
    const profile: Array<[number, number]> = [
      [hem, d.hip * 0.5 + (long ? 0.035 : 0.006)],
      [Y.hip, d.hip * 0.5 + 0.004],
      [Y.waist, d.waist * 0.5 + (kind === 'trench' ? 0.012 : 0.03)],
      [Y.chest, d.shoulder * 0.47],
      [Y.shoulder + 0.004, d.shoulder * 0.475],
      [Y.neck - 0.03, 0.095],
    ];
    group.add(shell(profile, material, grow, 0.62));
    group.add(sleeves(grow + 0.004, 'long', material));
    if (kind === 'trench') {
      const belt = new THREE.Mesh(new THREE.TorusGeometry(d.waist * 0.5 + grow + 0.016, 0.014, 8, 40), material);
      belt.position.y = Y.waist;
      belt.rotation.x = Math.PI / 2;
      belt.scale.set(1, DEPTH, 1);
      group.add(belt);
    }
    figure.add(group);
  };
  if (spec.mid) openLayer(spec.mid, 'garment-mid', 0.03);
  if (spec.outer) openLayer(spec.outer, 'garment-outer', spec.mid ? 0.05 : 0.04);

  // ---- Shoes
  if (spec.shoes) {
    const worn = spec.shoes;
    const material = cloth(worn);
    const group = named(new THREE.Group(), 'garment-shoes');
    const kind = worn.a.kind;
    for (const side of [-1, 1]) {
      const x = side * legX;
      if (kind === 'heels') {
        group.add(ball(v(x, 0.045, 0.06), 0.05, material, [0.8, 0.55, 2.0]));
        group.add(tube(v(x, 0.06, -0.04), v(x, 0, -0.04), 0.012, 0.008, material));
      } else {
        const chunky = kind === 'sneakers' || kind === 'boots';
        group.add(ball(v(x, 0.045, 0.052), 0.056, material, [0.95, chunky ? 0.85 : 0.68, 2.2]));
        if (kind === 'boots') group.add(tube(v(x, 0.23, 0), v(x, 0.05, 0), 0.052, 0.05, material));
        if (kind === 'sneakers') {
          group.add(ball(v(x, 0.014, 0.052), 0.058, plain('#F6F4EF'), [1, 0.24, 2.25]));
        }
      }
    }
    figure.add(group);
  }

  // ---- Accessories
  for (const worn of spec.accessories) {
    const material = cloth(worn);
    const metal = plain(worn.a.color.hex, 0.3, 0.7);
    const name = `accessory-${worn.a.kind}`;
    switch (worn.a.kind) {
      case 'hat': {
        const group = named(new THREE.Group(), name);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.116, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), material);
        crown.position.set(0, Y.head + 0.035, 0);
        crown.scale.set(1.03, 1.02, 1.08);
        group.add(crown);
        if (!/beanie/.test(worn.item.name.toLowerCase())) {
          const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.012, 28, 1, false, -Math.PI * 0.42, Math.PI * 0.84), material);
          brim.position.set(0, Y.head + 0.04, 0.085);
          brim.scale.set(1, 1, 1.25);
          brim.rotation.x = 0.16;
          group.add(brim);
        }
        figure.add(group);
        break;
      }
      case 'scarf': {
        const group = named(new THREE.Group(), name);
        const loop = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.034, 12, 28), material);
        loop.position.set(0, Y.neck + 0.005, 0.005);
        loop.rotation.x = Math.PI / 2;
        group.add(loop);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.3, 0.02), material);
        tail.position.set(0.045, Y.neck - 0.17, d.shoulder * 0.47 * DEPTH + 0.05);
        group.add(tail);
        figure.add(group);
        break;
      }
      case 'bag': {
        const group = named(new THREE.Group(), name);
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.07), material);
        bag.position.set(-(handX + 0.03), 0.66, 0.02);
        group.add(bag);
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 8, 24, Math.PI), material);
        handle.position.set(-(handX + 0.03), 0.74, 0.02);
        group.add(handle);
        figure.add(group);
        break;
      }
      case 'necklace': {
        const chain = named(new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.004, 8, 40), metal), name);
        chain.position.set(0, Y.neck - 0.065, 0.045);
        chain.rotation.x = Math.PI / 2 - 0.75;
        figure.add(chain);
        figure.add(ball(v(0, Y.neck - 0.125, d.shoulder * 0.46 * DEPTH + 0.028), 0.012, metal));
        break;
      }
      case 'earrings': {
        const group = named(new THREE.Group(), name);
        for (const side of [-1, 1]) group.add(ball(v(side * 0.108, Y.head - 0.045, 0.005), 0.014, metal, [0.8, 1.6, 0.8]));
        figure.add(group);
        break;
      }
      case 'belt': {
        if (spec.dress) break;
        const belt = named(new THREE.Mesh(new THREE.TorusGeometry(d.waist * 0.5 + 0.026, 0.013, 8, 40), material), name);
        belt.position.y = Y.waist - 0.02;
        belt.rotation.x = Math.PI / 2;
        belt.scale.set(1, DEPTH, 1);
        figure.add(belt);
        break;
      }
      case 'watch': {
        const watch = named(new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.011, 8, 20), metal), name);
        watch.position.set(-(handX - 0.006), 0.885, 0);
        watch.rotation.x = Math.PI / 2;
        figure.add(watch);
        break;
      }
      case 'sunglasses': {
        const group = named(new THREE.Group(), name);
        for (const side of [-1, 1]) {
          const lens = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.01), plain('#1E1A16', 0.2));
          lens.position.set(side * 0.04, Y.head + 0.02, 0.105);
          group.add(lens);
        }
        figure.add(group);
        break;
      }
      case 'tie': {
        const tie = named(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.3, 0.008), material), name);
        tie.position.set(0, Y.neck - 0.2, d.shoulder * 0.46 * DEPTH + 0.022);
        figure.add(tie);
        break;
      }
      default:
        break;
    }
  }

  return figure;
}

// Free the GPU memory a figure holds, before replacing it or closing the view.
export function disposeFigure(figure: THREE.Object3D): void {
  figure.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      (material as THREE.MeshStandardMaterial).map?.dispose();
      material.dispose();
    }
  });
}
