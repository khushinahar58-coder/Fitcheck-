// Runs every case through the harness several times and grades each run.
//
//   npm run eval                    all cases, 3 runs each
//   npm run eval -- --runs 5        more runs per case
//   npm run eval -- --case A1       one case
//
// Writes results/<date-time>.md (for people) and .json (for tools and AI).
// With no AI key, it writes a hand-grading sheet instead.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadHarness, loadCases, makeWorld } from './world.js';
import { getProvider } from './ai.js';
import { runHarness } from './harness.js';
import { gradeRun } from './grader.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const runs = Number(opt('runs', 3));
const only = opt('case', null);

const harness = loadHarness();
const cases = loadCases().filter((c) => !only || c.id === only);
const ai = getProvider();
const stamp = localStamp(new Date());
fs.mkdirSync(path.join(ROOT, 'results'), { recursive: true });

if (!cases.length) {
  console.error(`No case found${only ? ` with id ${only}` : ''}.`);
  process.exit(1);
}

if (ai.name === 'none') {
  const file = path.join(ROOT, 'results', `${stamp}-hand-grading.md`);
  fs.writeFileSync(file, handSheet(cases, harness.rubric));
  console.log(`No AI key set, so no runs. Wrote a hand-grading sheet: ${path.relative(ROOT, file)}`);
  console.log('Run each case by hand (or on the test page) and fill it in.');
  process.exit(0);
}

console.log(`Running ${cases.length} case(s) x ${runs} run(s) with ${ai.name} (${ai.model})...`);
const results = [];
for (const c of cases) {
  for (let n = 1; n <= runs; n++) {
    const world = makeWorld(c);
    let run;
    try {
      run = await runHarness({ ai, harness, world, transcript: [{ role: 'user', text: c.trigger }] });
      run.grade = await gradeRun({ ai, rubric: harness.rubric, caseDef: c, reply: run.reply, trace: run.trace });
    } catch (err) {
      run = { reply: '', trace: [], error: String(err.message || err), grade: { rows: [], overall: 'error' } };
    }
    results.push({ case: c.id, type: c.type, run: n, ...run });
    console.log(`  ${c.id} run ${n}: ${run.grade.overall}${run.error ? ` (${run.error})` : ''}`);
  }
}

const base = path.join(ROOT, 'results', stamp);
fs.writeFileSync(`${base}.json`, JSON.stringify({ when: stamp, provider: ai.name, model: ai.model, runs, results }, null, 2));
fs.writeFileSync(`${base}.md`, report(results, cases, harness.rubric, ai, runs));
console.log(`Wrote ${path.relative(ROOT, base)}.md and .json`);

function report(results, cases, rubric, ai, runs) {
  const lines = [`# Eval results ${stamp}`, '', `AI: ${ai.name} (${ai.model}). ${runs} run(s) per case. Every run is a fresh sample, so read these as rates, not single verdicts.`, ''];
  lines.push(`| Case | ${rubric.map((r) => r.id).join(' | ')} | Overall |`);
  lines.push(`|---|${rubric.map(() => '---').join('|')}|---|`);
  for (const c of cases) {
    const rs = results.filter((r) => r.case === c.id);
    const cell = (id) => {
      const vs = rs.map((r) => r.grade.rows.find((x) => x.id === id)?.verdict);
      if (vs.every((v) => v === 'n/a')) return 'n/a';
      return `${vs.filter((v) => v === 'pass').length}/${vs.filter((v) => v !== 'n/a').length}`;
    };
    lines.push(`| ${c.id} ${c.type} | ${rubric.map((r) => cell(r.id)).join(' | ')} | ${rs.filter((r) => r.grade.overall === 'pass').length}/${rs.length} |`);
  }
  lines.push('', '## Runs', '');
  for (const r of results) {
    lines.push(`### ${r.case}, run ${r.run}: ${r.grade.overall}`, '');
    if (r.error) lines.push(`Error: ${r.error}`, '');
    lines.push('Tool calls:', '');
    for (const t of r.trace) lines.push(`- \`${t.tool}\` ${JSON.stringify(t.input)} → ${t.ok ? 'ok' : `**${t.output}**`}`);
    if (!r.trace.length) lines.push('- (none)');
    lines.push('', 'Reply:', '', ...String(r.reply).split('\n').map((l) => `> ${l}`), '', 'Grade:', '');
    for (const g of r.grade.rows) lines.push(`- ${g.id}: **${g.verdict}**. ${g.why}`);
    lines.push('');
  }
  return lines.join('\n');
}

function handSheet(cases, rubric) {
  const lines = [`# Hand-grading sheet ${stamp}`, '', 'For each case, send the trigger, record what happened, and mark each rubric row pass, fail, or n/a.', ''];
  for (const c of cases) {
    lines.push(`## ${c.id} (${c.type}): ${c.title}`, '', `Trigger: "${c.trigger}"`, '', `Visible context: ${c.visible_context}`, '', `What good looks like: ${c.good}`, '', 'What happened:', '', '| Rubric row | Verdict | Why |', '|---|---|---|');
    for (const r of rubric) lines.push(`| ${r.question} |  |  |`);
    lines.push('');
  }
  return lines.join('\n');
}

function localStamp(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
