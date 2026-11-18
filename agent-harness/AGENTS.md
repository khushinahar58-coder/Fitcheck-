# Instructions for AI coding assistants

This repo is a working example of a harness for an agentic UX, used by MBA
students. The student's job is the user story, the rubric, and the cases. Your
job is everything else. Keep the student out of the terminal: run commands
yourself, and explain what you did in a sentence or two of plain language, not
code.

## Helping a student build their own

Students usually arrive one of two ways: they've pointed you at this repo (or
its demo, alexcowan.github.io/hinh-agent-harness) from their own new repository
and asked you to build something like it, or they've made a copy of it. Either
way, work through it with them one level at a time, and stop to check in at each.

**First, find out their setup.** Ask, in one short message:
- Which AI tool they're using with you (for example, the Codex app, Claude, a
  Codespace with Copilot), and whether you can run commands on their machine.
- Whether they have an API key for OpenAI or Anthropic, and whether their
  account allows one. Many school or enterprise accounts include a chat or coding
  assistant but no API key; that's fine.
- Their user story, rubric, and cases, if they haven't already pasted them.
  If they don't have them yet, help them write their own; don't write the
  cases for them (see below). If they gave you a link to a design brief, read
  it for the persona, the job, and the success metrics (OECs).

Their material often comes from the course prompt or a worksheet: a user story,
a rubric table (question / good looks like / fails looks like), and cases as
Given-When-Then (a case title, what's true in the world, what the user says,
what good looks like). Two or three golden and two or three adversarial cases is
enough to start; don't ask for more before level 1 runs. Put their material into
`my-agent.md` in its existing format, keeping their wording.

**If something you need is blocked by your sandbox** (the AI key calls at
level 2, or saving to GitHub), stop and tell the student in one line what's
blocked and the simplest way around it: allow internet access in their
assistant's settings if it has one, or run that one command in their own
terminal. Don't work around it silently or carry on without it. Levels 1 and 3
need no internet.

Then choose the simplest way to get them running, and tell them what you chose
and why in a sentence. Copying this repo's files into their repository and
adapting them is usually simplest. Don't rebuild what already works here.

Where it lives: a new private repository for their team, separate from their
project's, named `<their project>-agent-harness`, with teammates added as
collaborators and a link to it from their project repo's README next to the
user story it tests. Create it for them if you can; if you can't, tell them the
one or two clicks to do it, then carry on.

**Then the levels.** Each is useful on its own; get as far as their setup allows.
1. **It runs.** The test page opens and they can play one of their own cases,
   one role at a time: the user on the phone, then the agent, writing its
   replies themselves. This needs no API key.
2. **The AI is connected.** The harness drafts the agent's replies. This needs
   an API key, set as an environment variable or a Codespaces secret, never in
   a file. If they don't have one, say plainly that level 1 is a fine place to
   stop, and move on to level 3's check, which works without one.
3. **Evals.** `npm run check` confirms the tests pass and no HinH material is
   left. With an API key, `npm run eval` runs every case and reports which
   rubric rows fail most often; without one, it writes a sheet for grading by
   hand.

Testing with another person is a Wizard-of-Oz session, and it doesn't use the
harness: the student messages a test subject over Teams or text and plays the
agent by hand. If they ask, write the opening prompt for a case from its
`tester_brief`: who to pretend to be, the situation, and what they want, in a
few plain sentences starting "Pretend you're…". Don't set up links, port
sharing, or tunnels for a second person.

At each level, tell them in a line what works now and what the next level
would add, and let them choose whether to keep going.

## The source of truth is `my-agent.md`

The student writes `my-agent.md` in plain language. Everything else is generated
from it. When the student asks you to "update the harness from my-agent.md" (or
anything like it), regenerate these files so they match it exactly:

| File | What to put in it |
|---|---|
| `harness/app.json` | The names shown on the test page: `agent_name`, `user_page_title` (the app name on the phone), and `user_name` (the persona the student plays, shown as signed in on the phone). |
| `harness/instructions.md` | What the agent is for, how it should work, and how it reports back, written from the story and "What it may not do". Always end with a short readback the user can check in ten seconds. |
| `harness/rubric.json` | One entry per rubric row: `id` (short slug), `question`, `good`, `fails`. |
| `harness/permissions.json` | The limits from "What it may not do", as values `src/tools.js` can check. |
| `fixtures/<name>.json` | Made-up but realistic test data covering "What the agent can see and do". Exactly one .json file in `fixtures/`; name it after the student's product. |
| `harness/tools.json` | One tool per thing the agent can look up or do, each with a plain one-sentence description and JSON-schema parameters. |
| `src/tools.js` | An implementation for every tool in `tools.json`, running against the fixtures. Every action must check `permissions.json` and refuse with a clear "Not permitted: ..." message, exactly as the HinH version does. Never move a permission rule into the instructions only. |
| `cases/<ID>.json` | One file per case: `id`, `type` (golden, adversarial, intervention), `title`, `trigger` (the **When**: what the user says, word for word), `visible_context`, `good` (the **Then**), `tester_brief` (the role card for whoever plays the user, and the basis for a Wizard-of-Oz prompt), `fixtures` (only the changes to the base test data that make the case's **Given** true), and, only if the case has a **Later** line, `later` (that line, starting with how much time passed in brackets, e.g. "[About three hours later] Lena Park approves the part."). Records the agent creates should carry an id field (`id` or `something_id`) so a Later event can change them. |
| `tests/` | `tools.test.js`: tests that each permission rule is enforced and each case's fixtures load. `harness.test.js` and `tests/scripts/`: rewrite for one of the student's golden cases, or delete them. |

When `my-agent.md` describes the student's own product, remove everything about the HinH example: delete `fixtures/hinh.json` and the HinH case files, and leave no HinH names (HinH, Trent, Ridgeline, and so on) anywhere you generate.

Then run `npm run check`. It runs the tests and looks for HinH material left over. Fix anything it reports and run it again until it passes. Tell the student which cases you
couldn't represent in the test data, if any, instead of quietly dropping them.

If `my-agent.md` is missing something you need (for example, a case with no
**Given**), ask the student one plain question rather than inventing it.

The cases are the student's to write. Don't write new cases for them, even if
asked to "fill in" a section; instead, help them write their own: fix the
format, and point out any case that is vague, untestable, or a near-copy of
another. If they insist on a draft, mark every case you wrote with
"(AI draft: replace with your own)" so check output and reviewers can see it.

Do not change `src/harness.js`, `src/server.js`, `src/eval.js`, `src/grader.js`,
or `public/` unless the student asks.

## Commands to run for the student

- Check that it works (and, once it's theirs, that no HinH is left): `npm run check`.

- Start the test page: `npm start` (in a Codespace this starts on its own).
  Give the student the link to port 3000. On their own computer that's
  http://localhost:3000.
- Run the eval: `npm run eval` (all cases) or `npm run eval -- --case A1`.
- Save sessions and results to GitHub: `npm run save`.

## Turning sessions into cases

When asked to learn from a test session, read the log in `logs/`. For
every reply the student edited or overrode, propose a new case for `my-agent.md`
in the same format as the others, and add it there only after the student agrees.
Then regenerate the case files.

From a Wizard-of-Oz session over Teams or text, the student can paste the
exchange to you; propose cases from it the same way, wherever the person
playing the agent hesitated or had to make a call.

## Things to keep true

- Never put an API key in a file. In a Codespace, keys live in Codespaces
  secrets; on the student's own computer, in an environment variable.
- Logs never hold real names.
- Language models are called "AI" in anything the student reads.
