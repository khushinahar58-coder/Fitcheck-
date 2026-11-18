# My agent

Our story, rubric, and cases, in plain language. Everything else in this repo is
generated from this file. When you change it, tell your AI: "Update the harness
from my-agent.md."

Cases rewritten by the team on Tue Nov 17. Each one names the exact pieces and
days in the test data, so a pass or fail can be checked against the closet.

---

## The user story

As Kiara, a young working professional, I want to hand off planning my outfits
for the week ahead, so that I can get dressed in minutes each morning and wear
more of what I already own.

## Who the user is and what's going on

Kiara owns plenty of clothes but keeps wearing the same few outfits. On Sunday
evening she messages FitCheck the way she'd text a friend, asking it to plan the
week. She wants to hear back once, with a plan she can check quickly.

## What the agent can see and do (its systems)

- Her closet: each piece's name, category, color, warmth, rain-readiness,
  the dates she wore it, and when it was added.
- Her FitCheck calendar: planned looks, who planned each one (her or the agent),
  and whether it was worn.
- Her upcoming events (read-only): title, day and time. (Test data; the
  calendar import isn't built yet.)
- The forecast for her city, for the days it covers.
- It can pencil a look into a FitCheck calendar day, replace a look it
  pencilled in itself, ask her a question, and send her the weekly readback.

## What it may not do (permissions)

- It may only use pieces that are in her closet.
- It may not suggest, link or add anything to buy.
- It may not change or remove a look she planned herself.
- It may not mark anything worn (only she can; that writes wear dates).
- It may not write to her work or personal calendar.

## The rubric: what good looks like

| Question | What good looks like | What fails | Enforced by |
|---|---|---|---|
| Only her clothes? | Every piece in every look is in her closet. | Invents a piece or suggests buying one. | Code |
| Fits the occasion? | Dressiness matches each event (pitch vs. brunch). | Same look for every day; party look for a client meeting. | Eval |
| Fits the weather? | Uses that day's forecast; rain-ready on rainy days; says so. | Suede on a rainy day; ignores the forecast. | Eval |
| Rediscovery, no repeats? | Includes a piece unworn 30+ days when one fits; no piece twice in the week. | Recycles the same five favorites. | Eval |
| Her plans win? | Leaves looks she planned untouched; proposes instead. | Overwrites her choice. | Code |
| Readback and asking | One message she can check in ten seconds: what was asked, each day's look and why, what it couldn't plan; asks when an event is unclear. | Silently skips a day; guesses a dress code. | Eval |

## The cases

Each case is a Given-When-Then scenario: **Given** what's true in the world at
that moment, **When** the user says something, **Then** what good looks like.
The test week is Monday Nov 30 to Sunday Dec 6, 2026; she messages on Sunday
Nov 29 at 7:30 p.m.

### G1 (golden): the pitch week
- **Given:** Mon to Fri at the office (business casual), client pitch Thu 10 a.m., brunch with college friends Sat 11 a.m. Dry, highs 11-14°C. The emerald silk blouse was last worn 46 days ago and the camel wide-leg trousers have never been worn. Her go-to shoes are the tan suede loafers.
- **When** Kiara says: "can u plan my outfits for next week? big client pitch thurs"
- **Then** good looks like: Six looks, Mon to Sat. Thursday is the sharpest look of the week. The emerald blouse or camel trousers show up at least once. No piece is worn twice. One readback that opens with "You asked..." and gives each day's look with a one-line reason.

### G2 (golden): Wednesday rains
- **Given:** The G1 week, except Wednesday is 85% rain. Suede loafers are her default; she also owns black leather ankle boots and a trench coat.
- **When** Kiara says: same as G1.
- **Then** good looks like: Wednesday's look uses the ankle boots and the trench, not the suede loafers, and the readback says that's because of the rain.

### G3 (golden): Friday is already hers
- **Given:** Kiara already put a date-night look on Friday herself (green cocktail midi, black pumps, gold hoops).
- **When** Kiara says: "fill in the rest of my week pls"
- **Then** good looks like: Plans Mon to Thu around it, doesn't reuse the midi, pumps or hoops, leaves Friday exactly as she set it, and the readback says Friday was left alone because she planned it.

### A1 (adversarial): black tie with no gown
- **Given:** Brunch is gone; a wedding Sat 5 p.m. is marked "black tie." Her dressiest piece is the green cocktail midi. Nothing in the closet is floor-length.
- **When** Kiara says: "plan my week!! wedding saturday"
- **Then** good looks like: Recommends nothing to buy or rent. Offers the cocktail midi as her dressiest option, says plainly it may read under black tie, and asks whether to pencil it in or leave Saturday to her.

### A2 (adversarial): "Priya's thing"
- **Given:** Saturday 7 p.m. says only "Priya's thing." No dress code, no place.
- **When** Kiara says: "plan the weekend too"
- **Then** good looks like: Doesn't guess. Asks what kind of event it is, or offers a dressy and a casual option and says which it would pick if it's dinner versus a house party.

### A3 (adversarial): cold, and no jackets
- **Given:** Monday's high is 38°F (3°C). Her profile note says she hates jackets and layering.
- **When** Kiara says: "something warm for monday but NO jackets i hate layers"
- **Then** good looks like: No outerwear in the look. Uses her warmest single pieces (heavy knit, wool trousers, boots), says plainly that 38°F is cold, and mentions a coat once as optional without pushing it.
