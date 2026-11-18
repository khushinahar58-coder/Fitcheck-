// The orchestrator: the loop that turns a technician's message into a reply.
//
//   1. Send the instructions, the conversation so far, and the tool list to the AI.
//   2. If the AI asks to call tools, run them (with the technician's
//      permissions) against the world and send the results back.
//   3. Repeat until the AI answers in plain text, or MAX_STEPS is reached.
//
// Returns the reply plus a trace of every tool call, which is what the
// test page shows you and what the eval grader reads.

import { runTool } from './tools.js';

const MAX_STEPS = 10;

export async function runHarness({ ai, harness, world, transcript }) {
  const system = `${harness.instructions}\n\nThe current date and time is ${world.now}. ` +
    `You are acting for technician "${harness.permissions.acts_as}".`;

  // transcript: [{ role: 'user' | 'agent' | 'event', text }]
  // An event is something that happened while time passed (an approval came
  // in, a part shipped). The AI hears it on the user's side, labeled.
  // Consecutive messages from the same side are merged, and the conversation
  // always starts with the technician, because some AI APIs require that.
  const messages = [];
  for (const t of transcript) {
    const role = t.role === 'agent' ? 'assistant' : 'user';
    const text = t.role === 'event' ? `(Update, not from the user: ${t.text})` : t.text;
    const last = messages[messages.length - 1];
    if (last && last.role === role) last.text += `\n\n${text}`;
    else messages.push({ role, text });
  }
  if (messages[0]?.role !== 'user') messages.unshift({ role: 'user', text: '(No message yet.)' });
  const trace = [];

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await ai.chat({ system, messages, tools: harness.tools });
    if (!res.toolCalls.length) return { reply: res.text.trim(), trace, steps: step + 1 };

    messages.push({ role: 'assistant', text: res.text, toolCalls: res.toolCalls });
    const results = res.toolCalls.map((call) => {
      const output = runTool(world, harness.permissions, call.name, call.input);
      trace.push({ tool: call.name, input: call.input, ok: output.ok, output: output.ok ? output.result : output.error });
      return { id: call.id, name: call.name, output };
    });
    messages.push({ role: 'tool', results });
  }
  return { reply: '(The harness stopped after too many steps without a reply. Escalate to a person.)', trace, steps: MAX_STEPS };
}
