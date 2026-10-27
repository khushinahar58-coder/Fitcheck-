# FitCheck — Ideas Backlog

**Parked, not decided.** A running list of ways to make FitCheck better. Add freely; promote an idea into the
[product spec](SPEC.md) only when the team agrees to build it.

## Ideas

| # | Idea | What it gives |
|---|---|---|
| 1 | **Camera-roll setup, private by default.** Filter on the phone first (iOS and Android already recognize people in photos), so only photos of the user are sent for analysis. Group the same shirt across many photos into one piece. | "We found 64 pieces" within a minute |
| 2 | **Wear history from photo dates.** Every dated photo of you in a piece is a past wear. | Exact "last worn" dates with no manual logging; *Not worn recently* accurate from day one |
| 3 | **Calendar + weather planning.** Read tomorrow's event and the forecast. | A look ready in the morning |
| 4 | **See it on you.** Render the suggested outfit on the user with an image model. | Optional, since it costs money per outfit |
| 5 | **Slot-based outfits.** Base, mid-layer, outer layer, shoes, accessory, each swappable. | Layers become first-class; the current build already supports adding a piece |
| 6 | **Clearer actions.** Rename Keep/Save, e.g. *Wearing this today* (logs a wear) vs *Save for later*. | Addresses the Keep/Save confusion found in testing |
| 7 | **Chat as the front door.** "What do I wear to a birthday dinner Friday?" with the closet, calendar and wear history behind it. | Same engine as the recommendations |
| 8 | **Temperature units.** °C/°F setting. | Requested in testing |

## Prior art

A widely shared July 2026 demo gave an AI model access to a developer's camera roll. It found every clothing item he
owns, suggested new combinations, and rendered them onto him. It showed that extraction is now cheap; it had no daily
habit, history or planning. FitCheck's edge is the opposite half: being the app you open before getting dressed, with
real wear history.

## Hard parts

| Hard part | Why it is hard |
|---|---|
| **Camera roll needs a phone app** | A website can only take photos the user picks. This is the biggest architecture decision. |
| **Messy photos** | Mirror selfies, group shots, partial views, the same piece across many photos. |
| **Taste** | Outfits can match on paper and still look wrong. Needs testing with real users, not only more code. |
| **Cost** | Vision and image calls per user add up quickly. |
| **Purchase import** | Means reading email, which needs a heavy security review from Google. Suggest cutting it. |

## Suggested starting scope

Web first: upload 20–30 photos → a vision model fills the closet → ask "what do I wear Friday?" → the answer uses
what you own and what you've worn recently. A phone app with camera-roll scanning only if time allows.
