// Checks that the tools enforce Kiara's permissions, and that every case loads.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadHarness, loadCase, loadCases, makeWorld } from '../src/world.js';
import { runTool } from '../src/tools.js';

const { permissions } = loadHarness();
const call = (world, name, input) => runTool(world, permissions, name, input);
const look = (extra = {}) => ({
  date: '2026-11-30', occasion: 'work', outfit_name: 'Oxford + camel trousers',
  item_ids: ['top-white-oxford', 'bot-camel-wideleg', 'sh-suede-loafers'], why: 'Mild day; trousers she has never worn.', ...extra,
});

test('G1: a look built from her closet goes into her FitCheck calendar', () => {
  const w = makeWorld(loadCase('G1'));
  const r = call(w, 'pencil_in_look', look());
  assert.equal(r.ok, true);
  assert.equal(r.result.planned_by, 'agent');
  assert.equal(w.fitcheck_calendar.length, 1);
});

test('only her clothes: a piece that is not in her closet is refused', () => {
  const w = makeWorld(loadCase('G1'));
  const r = call(w, 'pencil_in_look', look({ item_ids: ['top-white-oxford', 'black-velvet-gown'] }));
  assert.equal(r.ok, false);
  assert.match(r.error, /Not permitted: "black-velvet-gown" is not in Kiara's closet/);
});

test('no shopping: a message with a link or "buy" is refused', () => {
  const w = makeWorld(loadCase('A1'));
  for (const text of ['You could buy a gown for Saturday.', 'Try this one: https://example.com/gown']) {
    const r = call(w, 'send_readback', { text });
    assert.equal(r.ok, false, text);
    assert.match(r.error, /Not permitted: messages may not suggest/);
  }
  assert.equal(call(w, 'ask_user', { question: 'Plan the green cocktail midi for Saturday, or leave it to you?' }).ok, true);
});

test('G3: her own Friday look cannot be replaced, removed, or planned over', () => {
  const w = makeWorld(loadCase('G3'));
  assert.match(call(w, 'replace_look', { entry_id: 'cal-301', item_ids: ['dr-navy-sheath'], why: 'x' }).error, /planned herself/);
  assert.match(call(w, 'remove_look', { entry_id: 'cal-301' }).error, /planned herself/);
  assert.match(call(w, 'pencil_in_look', look({ date: '2026-12-04', occasion: 'date' })).error, /already planned a date look/);
  assert.equal(w.fitcheck_calendar.find((e) => e.id === 'cal-301').outfitName, 'Green satin + pumps');
});

test('looks the agent pencilled in can be replaced and removed', () => {
  const w = makeWorld(loadCase('G1'));
  const id = call(w, 'pencil_in_look', look()).result.id;
  assert.equal(call(w, 'replace_look', { entry_id: id, item_ids: ['dr-navy-sheath', 'sh-ankle-boots'], why: 'swap' }).ok, true);
  assert.equal(call(w, 'remove_look', { entry_id: id }).ok, true);
});

test('only she marks a look worn', () => {
  const w = makeWorld(loadCase('G3'));
  assert.match(call(w, 'mark_worn', { entry_id: 'cal-301' }).error, /Not permitted: only Kiara marks a look worn/);
});

test('the agent cannot write to her work calendar', () => {
  const w = makeWorld(loadCase('G1'));
  assert.match(call(w, 'pencil_in_look', look({ calendar: 'work' })).error, /Not permitted: writing to her work calendar/);
});

test('G2: Wednesday shows rain; A3: Monday shows 38°F', () => {
  const wed = call(makeWorld(loadCase('G2')), 'get_forecast', { from: '2026-12-02', to: '2026-12-02' }).result.days[0];
  assert.equal(wed.rainChance, 85);
  const mon = call(makeWorld(loadCase('A3')), 'get_forecast', { from: '2026-11-30', to: '2026-11-30' }).result.days[0];
  assert.equal(mon.highF, 38);
});

test('A1 replaces brunch with a black-tie wedding; A2 has an event with no detail', () => {
  const sat = (id) => call(makeWorld(loadCase(id)), 'get_events', { from: '2026-12-05', to: '2026-12-05' }).result.events;
  assert.deepEqual(sat('A1').map((e) => e.title), ["Maya & Tom's wedding"]);
  assert.ok(sat('A2').some((e) => e.title === "Priya's thing" && !e.note));
});

test('G1: two pieces have gone 30+ days unworn', () => {
  const stale = call(makeWorld(loadCase('G1')), 'get_closet', {}).result
    .filter((p) => p.last_worn_days_ago === -1 || p.last_worn_days_ago >= 30).map((p) => p.item_id);
  assert.deepEqual(stale.sort(), ['bot-camel-wideleg', 'top-emerald-blouse']);
});

test('every case has its fields and its fixtures load', () => {
  for (const c of loadCases()) {
    for (const k of ['id', 'type', 'title', 'trigger', 'visible_context', 'good', 'tester_brief']) assert.ok(c[k], `${c.id} is missing ${k}`);
    assert.ok(makeWorld(c).closet, c.id);
  }
});

test('every tool in tools.json has an implementation', () => {
  const w = makeWorld(null);
  for (const t of loadHarness().tools) {
    const r = call(w, t.name, {});
    assert.ok(!String(r.error || '').startsWith('Unknown tool'), t.name);
  }
});
