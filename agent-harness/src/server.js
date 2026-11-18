// The test harness server.
//
//   /        the test page: pick a case, play the user on the phone, then
//            check each harness draft and send it as is, edit it, or write
//            your own; let time pass; have the AI score the session first,
//            then agree or change it.
//
// Every event is written to logs/<date>-<time>-<initials>.jsonl, one JSON
// object per line, so you (or an AI) can read the session back later.
// Sessions live in memory; restarting the server ends them (the logs stay).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, loadHarness, loadCases, loadCase, makeWorld } from './world.js';
import { getProvider } from './ai.js';
import { runHarness } from './harness.js';
import { gradeRun } from './grader.js';

const PORT = Number(process.env.PORT || 3000);
const ai = getProvider();
const sessions = new Map();
fs.mkdirSync(path.join(ROOT, 'logs'), { recursive: true });

function log(session, event) {
  const line = JSON.stringify({ at: new Date().toISOString(), session: session.id, ...event });
  fs.appendFileSync(path.join(ROOT, session.logFile), `${line}\n`);
}

function publicState(s, forWizard) {
  return {
    id: s.id,
    caseId: s.caseId,
    ended: s.ended,
    messages: s.messages,
    role: s.caseDef ? { brief: s.caseDef.tester_brief, opening: s.caseDef.trigger } : null,
    ...(forWizard ? { drafts: s.drafts.map(({ worldAfter, ...d }) => d), logFile: s.logFile, ai: ai.name, scored: s.scored } : {}),
  };
}

async function draftReply(s) {
  if (!ai.chat) return;
  const draft = { draft_id: `d${s.drafts.length + 1}`, status: 'drafting', forMessage: s.messages.length };
  s.drafts.push(draft);
  const world = structuredClone(s.world); // dry run: nothing changes unless you send it
  world.actions = [];
  try {
    const res = await runHarness({ ai, harness: loadHarness(), world, transcript: s.messages.map(({ role, text }) => ({ role, text })) });
    Object.assign(draft, { status: 'ready', text: res.reply, trace: res.trace });
    draft.worldAfter = world;
  } catch (err) {
    Object.assign(draft, { status: 'error', text: '', error: String(err.message || err), trace: [] });
  }
  log(s, { type: 'draft', draft_id: draft.draft_id, status: draft.status, text: draft.text, trace: draft.trace, error: draft.error });
}

async function proposeLater(s, hint) {
  const { caseDef } = s;
  const world = JSON.stringify(s.world, (k, v) => (k === 'actions' ? undefined : v)).slice(0, 8000);
  const system = 'You play the rest of the world in a test of an AI agent. Time has passed since the last message. ' +
    'Write the ONE thing that most plausibly happens next because of what the agent did (an approval comes back, a supplier confirms, a customer replies), ' +
    'as a short line starting with how much time passed in brackets, e.g. "[About 3 hours later] Lena Park approves the $96 part by email." ' +
    'If it changes a record in the world, say how in updates, using that record\'s id. Answer with JSON only.';
  const prompt = [
    caseDef ? `Case: ${caseDef.title}. ${caseDef.good}` : 'Free play.',
    hint ? `The case author suggests: ${hint}` : '',
    `The world now (JSON): ${world}`,
    'The conversation so far:',
    ...s.messages.map((m) => `${m.role}: ${m.text}`),
    '',
    'Respond with exactly: {"text":"[time] what happens","updates":[{"id":"<record id>","set":{"<field>":"<new value>"}}]}',
  ].join('\n');
  const res = await ai.chat({ system, messages: [{ role: 'user', text: prompt }] });
  try {
    const m = String(res.text).match(/\{[\s\S]*\}/);
    const j = JSON.parse(m ? m[0] : res.text);
    return { text: String(j.text || ''), updates: Array.isArray(j.updates) ? j.updates : [] };
  } catch {
    return { text: String(res.text || '').trim(), updates: [] };
  }
}

// Finds records in the world by id (any field named id or ending in _id)
// and changes the given fields, e.g. an approval's status to "approved".
function applyUpdates(world, updates) {
  const applied = new Set();
  const seen = new Set();
  const visit = (node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) return node.forEach(visit);
    for (const u of updates) {
      const hit = Object.entries(node).some(([k, v]) => (k === 'id' || k.endsWith('_id')) && v === u.id);
      if (hit && u.set && typeof u.set === 'object') { Object.assign(node, u.set); applied.add(u); }
    }
    Object.values(node).forEach(visit);
  };
  visit(world);
  return [...applied];
}

const routes = {
  'GET /api/info': () => ({ ai: ai.name, model: ai.model, ...loadHarness().app }),
  'GET /api/cases': () => loadCases().map(({ id, type, title, trigger, tester_brief, visible_context, good }) => ({ id, type, title, trigger, tester_brief, visible_context, good })),
  'GET /api/rubric': () => loadHarness().rubric,

  'POST /api/sessions': (_s, body) => {
    const initials = String(body.initials || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'XX';
    const stamp = /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(body.local_stamp || '') ? body.local_stamp
      : new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
    const caseDef = body.case_id ? loadCase(body.case_id) : null;
    let logFile = `logs/${stamp}-${initials}.jsonl`;
    for (let n = 2; fs.existsSync(path.join(ROOT, logFile)); n++) logFile = `logs/${stamp}-${initials}-${n}.jsonl`;
    const s = {
      id: crypto.randomBytes(9).toString('base64url'),
      caseId: caseDef?.id || null,
      world: makeWorld(caseDef),
      messages: [],
      drafts: [],
      logFile,
      ended: false,
      scored: false,
      usedTraces: [],
      aiScore: null,
      caseDef,
    };
    sessions.set(s.id, s);
    log(s, { type: 'session_start', initials, case_id: s.caseId, ai: ai.name, model: ai.model });
    return { id: s.id, logFile };
  },

  'GET /api/sessions/:id': (s, _b, q) => publicState(s, q.get('as') === 'wizard'),

  'POST /api/sessions/:id/user': (s, body) => {
    const text = String(body.text || '').trim();
    if (!text || s.ended) return { ok: false };
    s.messages.push({ role: 'user', text, at: new Date().toISOString() });
    log(s, { type: 'user_message', text });
    draftReply(s); // runs in the background; the test page polls for it
    return { ok: true };
  },

  'POST /api/sessions/:id/agent': (s, body) => {
    const text = String(body.text || '').trim();
    if (!text || s.ended) return { ok: false };
    const draft = s.drafts.find((d) => d.draft_id === body.draft_id && d.status === 'ready');
    let action = 'wizard_only';
    if (draft) action = body.override ? 'overridden' : text === draft.text ? 'sent_as_is' : 'edited';
    if (draft && action !== 'overridden') { s.world = draft.worldAfter; s.usedTraces.push(...(draft.trace || [])); } // the draft's actions now count
    if (draft) draft.status = `used:${action}`;
    s.messages.push({ role: 'agent', text, at: new Date().toISOString() });
    log(s, { type: 'agent_message', text, action, draft_id: draft?.draft_id || null, draft_text: draft && action !== 'sent_as_is' ? draft.text : undefined });
    return { ok: true, action };
  },

  // Time passes: the AI proposes what happens next in the world (an approval
  // comes in, a part ships). You edit it, then posts it with /event.
  'POST /api/sessions/:id/later': async (s) => {
    const hint = s.caseDef?.later || '';
    if (!ai.chat) return { text: hint || '[A few hours later] ', updates: [] };
    return proposeLater(s, hint);
  },

  'POST /api/sessions/:id/event': (s, body) => {
    const text = String(body.text || '').trim();
    if (!text || s.ended) return { ok: false };
    const applied = applyUpdates(s.world, Array.isArray(body.updates) ? body.updates : []);
    s.messages.push({ role: 'event', text, at: new Date().toISOString() });
    log(s, { type: 'event', text, updates: applied });
    draftReply(s); // the agent gets a chance to act on what happened
    return { ok: true, applied };
  },

  // The AI scores the session first; you agree or changes each row.
  'POST /api/sessions/:id/autoscore': async (s) => {
    if (!ai.chat) return { error: 'No AI connected, so there is no first-pass score. Score it yourself.' };
    const conversation = s.messages.map((m) => `${m.role}: ${m.text}`).join('\n\n');
    const g = await gradeRun({ ai, rubric: loadHarness().rubric, caseDef: s.caseDef, trace: s.usedTraces, conversation });
    s.aiScore = g;
    log(s, { type: 'ai_score', rows: g.rows, overall: g.overall });
    return g;
  },

  'POST /api/sessions/:id/score': (s, body) => {
    const scores = body.scores || {};
    const ai_rows = s.aiScore ? Object.fromEntries(s.aiScore.rows.map((r) => [r.id, r.verdict])) : null;
    const changed_from_ai = ai_rows ? Object.keys(scores).filter((k) => scores[k] && ai_rows[k] && scores[k] !== ai_rows[k]) : undefined;
    log(s, { type: 'score', scores, note: body.note || '', ai_scores: ai_rows || undefined, changed_from_ai });
    s.scored = true;
    return { ok: true, changed_from_ai };
  },

  'POST /api/sessions/:id/end': (s) => {
    s.ended = true;
    log(s, { type: 'session_end' });
    return { ok: true, logFile: s.logFile };
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && ['/', '/test', '/wizard'].includes(url.pathname)) return sendFile(res, 'public/test.html');
    if (req.method === 'GET' && url.pathname === '/style.css') return sendFile(res, 'public/style.css', 'text/css');

    const m = url.pathname.match(/^\/api\/sessions\/([\w-]+)(\/\w+)?$/);
    const key = m ? `${req.method} /api/sessions/:id${m[2] || ''}` : `${req.method} ${url.pathname}`;
    const handler = routes[key];
    if (!handler) return send(res, 404, { error: 'not found' });
    let session = null;
    if (m) {
      session = sessions.get(m[1]);
      if (!session) return send(res, 404, { error: 'No such session. If the server restarted, start a new one.' });
    }
    const body = req.method === 'POST' ? await readBody(req) : {};
    return send(res, 200, await handler(session, body, url.searchParams));
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
});

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function sendFile(res, rel, type = 'text/html; charset=utf-8') {
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(path.join(ROOT, rel)));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`Test harness on port ${PORT}. AI: ${ai.name}${ai.model ? ` (${ai.model})` : ' (you write every reply)'}`);
  console.log(`Open the page on port ${PORT} to start.`);
});
