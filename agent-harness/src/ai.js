// One small adapter so the rest of the code doesn't care which AI you use.
//
//   OPENAI_API_KEY     -> OpenAI   (model: AI_MODEL, default below)
//   ANTHROPIC_API_KEY  -> Anthropic (model: AI_MODEL, default below)
//   neither            -> no AI: the test page still works (you
//                         write every reply), and evals are graded by hand.
//
// AI_PROVIDER=openai|anthropic|none forces a choice. AI_PROVIDER=script is for
// the automated tests: it replays canned responses from the file in AI_SCRIPT.

import fs from 'node:fs';

const DEFAULT_MODEL = {
  openai: 'gpt-5-mini',
  anthropic: 'claude-haiku-5-5',
};

export function getProvider() {
  const forced = (process.env.AI_PROVIDER || '').toLowerCase();
  const name = forced || (process.env.OPENAI_API_KEY ? 'openai' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'none');
  if (name === 'openai') return openai();
  if (name === 'anthropic') return anthropic();
  if (name === 'script') return script();
  return { name: 'none', model: null, chat: null };
}

// Neutral message format used everywhere else:
//   { role: 'user', text }
//   { role: 'assistant', text, toolCalls: [{ id, name, input }] }
//   { role: 'tool', results: [{ id, name, output }] }
// chat() returns { text, toolCalls }.

function openai() {
  const model = process.env.AI_MODEL || DEFAULT_MODEL.openai;
  return {
    name: 'openai',
    model,
    async chat({ system, messages, tools = [] }) {
      const msgs = [{ role: 'system', content: system }];
      for (const m of messages) {
        if (m.role === 'user') msgs.push({ role: 'user', content: m.text });
        else if (m.role === 'assistant') {
          msgs.push({
            role: 'assistant',
            content: m.text || null,
            ...(m.toolCalls?.length ? {
              tool_calls: m.toolCalls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.input) } })),
            } : {}),
          });
        } else if (m.role === 'tool') {
          for (const r of m.results) msgs.push({ role: 'tool', tool_call_id: r.id, content: JSON.stringify(r.output) });
        }
      }
      const body = { model, messages: msgs };
      if (tools.length) body.tools = tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }));
      const data = await post('https://api.openai.com/v1/chat/completions', body, {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      });
      const msg = data.choices[0].message;
      return {
        text: msg.content || '',
        toolCalls: (msg.tool_calls || []).map((c) => ({ id: c.id, name: c.function.name, input: safeParse(c.function.arguments) })),
      };
    },
  };
}

function anthropic() {
  const model = process.env.AI_MODEL || DEFAULT_MODEL.anthropic;
  return {
    name: 'anthropic',
    model,
    async chat({ system, messages, tools = [] }) {
      const msgs = [];
      for (const m of messages) {
        if (m.role === 'user') msgs.push({ role: 'user', content: m.text });
        else if (m.role === 'assistant') {
          const content = [];
          if (m.text) content.push({ type: 'text', text: m.text });
          for (const c of m.toolCalls || []) content.push({ type: 'tool_use', id: c.id, name: c.name, input: c.input });
          msgs.push({ role: 'assistant', content });
        } else if (m.role === 'tool') {
          msgs.push({ role: 'user', content: m.results.map((r) => ({ type: 'tool_result', tool_use_id: r.id, content: JSON.stringify(r.output) })) });
        }
      }
      const body = { model, max_tokens: 2000, system, messages: msgs };
      if (tools.length) body.tools = tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters }));
      const data = await post('https://api.anthropic.com/v1/messages', body, {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      });
      return {
        text: data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n'),
        toolCalls: data.content.filter((b) => b.type === 'tool_use').map((b) => ({ id: b.id, name: b.name, input: b.input })),
      };
    },
  };
}

// Test double: replays responses in order from a JSON file.
function script() {
  const steps = JSON.parse(fs.readFileSync(process.env.AI_SCRIPT, 'utf8'));
  let i = 0;
  return {
    name: 'script',
    model: 'script',
    async chat() {
      const step = steps[i++ % steps.length];
      return { text: step.text || '', toolCalls: (step.toolCalls || []).map((c, n) => ({ id: `t${i}-${n}`, ...c })) };
    },
  };
}

async function post(url, body, headers) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

function safeParse(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}
