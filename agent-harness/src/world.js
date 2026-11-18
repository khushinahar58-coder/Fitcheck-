// Loads the harness files, the fixtures, and the cases from disk.
// A "world" is one copy of the fixtures that a run (or a test-page session)
// can change without touching the files.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

export function loadHarness() {
  return {
    instructions: fs.readFileSync(path.join(ROOT, 'harness/instructions.md'), 'utf8'),
    rubric: readJson('harness/rubric.json'),
    tools: readJson('harness/tools.json'),
    permissions: readJson('harness/permissions.json'),
    app: fs.existsSync(path.join(ROOT, 'harness/app.json')) ? readJson('harness/app.json') : {},
  };
}

export function loadCases() {
  const dir = path.join(ROOT, 'cases');
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => readJson(path.join('cases', f)));
}

export function loadCase(id) {
  return loadCases().find((c) => c.id === id) || null;
}

// Objects merge key by key; anything else (including arrays) is replaced.
export function deepMerge(base, patch) {
  if (patch === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(patch)) return structuredClone(patch);
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) out[k] = deepMerge(base[k], v);
  return out;
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// The test data is the one .json file in fixtures/ (whatever it is named).
function fixturesFile() {
  const files = fs.readdirSync(path.join(ROOT, 'fixtures')).filter((f) => f.endsWith('.json'));
  if (files.length !== 1) throw new Error(`fixtures/ should hold exactly one .json file; found ${files.length}.`);
  return path.join('fixtures', files[0]);
}

export function makeWorld(caseDef) {
  const base = readJson(fixturesFile());
  const world = structuredClone(deepMerge(base, caseDef?.fixtures || {}));
  world.actions = [];
  return world;
}
