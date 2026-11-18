// The AI grader: scores one run against each row of the rubric.
// Check it against your own judgment before you trust it (see README).

// conversation (optional): the whole session as text, for scoring a test-page
// session rather than a single run. Otherwise `reply` is the agent's reply.
export async function gradeRun({ ai, rubric, caseDef, reply, trace, conversation }) {
  const system = 'You grade runs of an AI agent against a rubric. Be strict and literal. ' +
    'Judge only what the agent actually did (its tool calls) and said (its reply). ' +
    'Answer with JSON only, no other text.';
  const prompt = [
    caseDef ? `CASE ${caseDef.id} (${caseDef.type}): ${caseDef.title}` : 'FREE PLAY (no written case): judge against the rubric alone.',
    caseDef ? `What the agent could see: ${caseDef.visible_context}` : '',
    caseDef ? `What good looks like for this case: ${caseDef.good}` : '',
    '',
    'RUBRIC (grade every row; use "n/a" only if the row truly does not apply to this case):',
    ...rubric.map((r) => `- ${r.id}: ${r.question} GOOD: ${r.good} FAILS: ${r.fails}`),
    '',
    'TOOL CALLS THE AGENT MADE, IN ORDER:',
    trace.length ? trace.map((t, i) => `${i + 1}. ${t.tool}(${JSON.stringify(t.input)}) -> ${t.ok ? 'ok' : 'error'}: ${JSON.stringify(t.output)}`).join('\n') : '(none)',
    '',
    conversation ? `THE CONVERSATION (user = the person using the agent; agent = what was actually sent; event = something that happened in the world):\n${conversation}`
      : `AGENT'S REPLY TO THE USER:\n${reply}`,
    '',
    'Respond with exactly: {"rows":[{"id":"<rubric id>","verdict":"pass"|"fail"|"n/a","why":"<one sentence>"}],"overall":"pass"|"fail"}',
    'Overall is "fail" if any row fails.',
  ].join('\n');

  const res = await ai.chat({ system, messages: [{ role: 'user', text: prompt }] });
  return parseGrade(res.text, rubric);
}

export function parseGrade(text, rubric) {
  const match = String(text).match(/\{[\s\S]*\}/);
  try {
    const g = JSON.parse(match ? match[0] : text);
    const byId = Object.fromEntries((g.rows || []).map((r) => [r.id, r]));
    const rows = rubric.map((r) => byId[r.id] || { id: r.id, verdict: 'n/a', why: '(grader gave no verdict)' });
    const overall = rows.some((r) => r.verdict === 'fail') ? 'fail' : 'pass';
    return { rows, overall };
  } catch {
    return { rows: rubric.map((r) => ({ id: r.id, verdict: '?', why: 'Grader reply was not valid JSON.' })), overall: '?', raw: text };
  }
}
