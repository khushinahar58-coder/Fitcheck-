# FitCheck agent harness

A test harness for FitCheck's weekly outfit-planning agent: our user story,
rubric and cases, made-up test data for Kiara's closet, the agent's tools with
their limits enforced in code, an eval runner, and a test page. Built from
Alex Cowan's example (github.com/alexcowan/hinh-agent-harness) for Coding with
GPT, Session 9.

**The source of truth is [`my-agent.md`](my-agent.md).** Edit it, then tell your
AI coding assistant: "Update the harness from my-agent.md."

## Status

- **Level 1 (it runs): works.** No API key needed.
- **Level 2 (AI connected):** needs an `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
  in an environment variable, never in a file. Not set up.
- **Level 3 (evals):** `npm run check` passes. Without a key, `npm run eval`
  writes a hand-grading sheet to `results/`.
- **The six cases** were rewritten on Nov 17 and name exact pieces and days in
  the test data. They live in `my-agent.md`; change them there.

## Run it

From the FitCheck repo, with Node 20 or newer. There is nothing to install.

```bash
cd agent-harness
npm start
```

Then open http://localhost:3000, pick a case, and press send on Kiara's opening
line (it's pre-filled). You write the agent's reply yourself, then score it
against the rubric.

## What the code enforces vs. what the eval judges

| Limit | Where |
|---|---|
| Only pieces in her closet | Code: `pencil_in_look` / `replace_look` refuse an unknown piece |
| Nothing to buy | Code catches links and words like "buy" or "shop" in messages; the eval has to catch subtler suggestions |
| Her looks win | Code: her looks can't be replaced, removed, or planned over |
| Only she marks worn | Code: `mark_worn` always refuses |
| FitCheck calendar only | Code: other calendars are refused |
| Occasion, weather, rediscovery, readback | Eval (rubric rows) |

## Notes for the team

- **"Planned by" isn't in the app yet.** FitCheck's `CalendarEntry` doesn't
  record who planned a look, so the app can't enforce "her plans win" today.
  The test data adds a `planned_by` field.
- **"No piece twice in the week" includes shoes.** Six looks therefore need six
  pairs of shoes, so the test closet has six. Decide whether the rule should
  cover only tops, bottoms and dresses.
- **The test week** is Mon Nov 30 to Sun Dec 6, 2026; she messages Sunday
  Nov 29 at 7:30 p.m. Temperatures are stored in Celsius, as in the app.
