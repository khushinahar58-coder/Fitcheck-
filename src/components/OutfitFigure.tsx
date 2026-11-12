import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ClothingItem } from '../types';
import type { AvatarConfig } from '../lib/profiles';
import { buildFigure, disposeFigure } from '../three/buildFigure';

interface Props {
  items: ClothingItem[];
  avatar: AvatarConfig;
  className?: string;
}

interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pivot: THREE.Group;
  figure: THREE.Group | null;
}

function groundShadow(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const fade = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  fade.addColorStop(0, 'rgba(45,39,34,0.28)');
  fade.addColorStop(1, 'rgba(45,39,34,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 128, 128);
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 40),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.001;
  return mesh;
}

// A look shown on a 3D figure. Drag sideways to turn it. Loaded on demand (see FigureCard),
// because three.js is the biggest thing in the app.
export default function OutfitFigure({ items, avatar, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.touchAction = 'pan-y'; // sideways drags turn the figure; up/down still scrolls the page
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 20);
    camera.position.set(0, 1.0, 4.6);
    camera.lookAt(0, 0.9, 0);

    scene.add(new THREE.HemisphereLight('#FFFFFF', '#CDBFAE', 1.5));
    const key = new THREE.DirectionalLight('#FFF6E8', 1.9);
    key.position.set(2, 4, 3.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#FFFFFF', 0.7);
    rim.position.set(-3, 2, -3);
    scene.add(rim);
    scene.add(groundShadow());

    const pivot = new THREE.Group();
    pivot.rotation.y = -0.45;
    scene.add(pivot);

    const stage: Stage = { renderer, scene, camera, pivot, figure: null };
    stageRef.current = stage;

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizer = new ResizeObserver(resize);
    resizer.observe(host);

    // Drag to turn. The figure also turns slowly on its own until someone takes hold of it.
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let autoTurn = !still;
    let dragging = false;
    let lastX = 0;
    const canvas = renderer.domElement;
    const down = (e: PointerEvent) => {
      dragging = true;
      autoTurn = false;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      pivot.rotation.y += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
    };
    const up = () => {
      dragging = false;
      canvas.style.cursor = 'grab';
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    // Only draw while the figure is on screen.
    let visible = true;
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    watcher.observe(host);

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;
      if (autoTurn) pivot.rotation.y += dt * 0.35;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
      resizer.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      if (stage.figure) disposeFigure(stage.figure);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          (mesh.material as THREE.MeshBasicMaterial).map?.dispose();
          (mesh.material as THREE.Material).dispose();
        }
      });
      // Browsers only allow a handful of WebGL contexts, so give this one back now rather than
      // waiting for garbage collection.
      renderer.forceContextLoss();
      renderer.dispose();
      canvas.remove();
      stageRef.current = null;
    };
  }, []);

  // Rebuild the figure when the look or the avatar changes. The stage and its angle stay.
  const lookKey = items.map((i) => `${i.id}:${i.name}:${i.color}`).join('|');
  const avatarKey = JSON.stringify(avatar);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (stage.figure) {
      stage.pivot.remove(stage.figure);
      disposeFigure(stage.figure);
    }
    stage.figure = buildFigure(items, avatar);
    stage.pivot.add(stage.figure);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the keys stand in for items and avatar
  }, [lookKey, avatarKey]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center text-xs text-ink-300 text-center px-6 ${className ?? ''}`}>
        The 3D view isn't available in this browser.
      </div>
    );
  }
  return <div ref={hostRef} className={className} />;
}
