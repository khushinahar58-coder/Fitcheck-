# FitCheck — Product Spec

**Status:** Draft for team discussion · **Updated:** 2026-10-27

Sections 1–3 describe the product and the build as they stand. Section 4 onward is a **proposal**, not an agreed plan.
Change it freely.

---

## 1. Product

**Value proposition:** More outfits. Same closet.

**Primary user:** Khushi, a young working professional. She owns plenty of clothes but keeps wearing the same few
outfits. She wants to get dressed for different occasions without spending time remembering what she owns, working out
what goes together, or feeling she has nothing to wear.

**Job to be done:** Help users rediscover their existing wardrobe and find outfits they feel good wearing, without
encouraging them to buy more.

**Where the value is:** At the moment of decision, when someone is getting ready for work, dinner, a date or an event.
Digitizing the wardrobe is the foundation, but organization alone is not the product. Getting started has to be close
to effortless, or the user never reaches the value.

## 2. User Stories

| # | As a user, I want to… | So that… |
|---|---|---|
| S1 | Add my clothes without a lot of manual work | My closet is in the app before I lose interest |
| S2 | Pick an occasion and see outfits from what I own | I can get dressed quickly and with confidence |
| S3 | Be shown pieces I haven't worn in a while | I rediscover clothes I'd forgotten |
| S4 | See whether an outfit suits the weather | I'm not cold, hot or soaked |
| S5 | Swap, remove or add pieces, including layers | The suggestion fits how I actually dress |
| S6 | Save outfits and plan them on a calendar | I can get ready ahead for the week |
| S7 | See when I last wore each piece | I can avoid repeats and spot what's sitting unused |

## 3. Current Build (Bolt export, 2026-10-27)

**Stack:** React 18 · TypeScript · Vite · Tailwind · lucide-react. No backend: `@supabase/supabase-js` is installed
but never imported. State lives in `localStorage` (`fitcheck-wardrobe`, `fitcheck-saved`, `fitcheck-calendar`).

**Data model** (`src/types.ts`)

| Type | Key fields |
|---|---|
| `ClothingItem` | name, category (Tops, Bottoms, Dresses, Outerwear, Shoes, Accessories), image, color, brand, `lastWornDaysAgo`, `wearDates[]` |
| `Outfit` | occasion, name, description, `slots[]` (role + item) |
| `SavedOutfit` | outfit snapshot + the weather at save time |
| `CalendarEntry` | date, outfit snapshot, `worn` flag |
| `WeatherInfo` | condition, high, low, note |

**Story coverage**

| Story | Status | How |
|---|---|---|
| S1 Add clothes | 🟡 Partial | Manual add with a photo works. Photo extraction and purchase import are simulated |
| S2 Occasion outfits | 🟡 Simulated | 18 fixed looks across 5 occasions in `src/data.ts`; nothing is generated |
| S3 Rediscovery | ✅ Real logic | "Rarely worn" = 30+ days since last wear; insights on Profile |
| S4 Weather | 🟡 Simulated | Fixed values per occasion; no unit label |
| S5 Edit outfits | ✅ Real | Swap, remove, add an item (layers) |
| S6 Save and plan | ✅ Real | Saved looks and a monthly calendar |
| S7 Wear history | ✅ Real logic | Marking a calendar entry worn records the date on each piece; starter data is preset |

**Usability findings (birthday-dinner scenario)**

- Liked: visual design, occasion suggestions, accessory swapping, *Not worn recently* tags, wardrobe insights.
- Unclear: **Keep** vs **Save**. In the code, Keep adds the look to today's calendar and Save adds it to Saved Looks.
- Requested: layers (now built), temperature units, a calendar (now built), exact wear history (now built), and
  clarity on whether recommendations are generated (they are not yet).

**Known issues:** photos stored as base64 in `localStorage` (~5 MB cap); no temperature unit; 4 lint errors (unused
imports).

## 4. Proposed v1 Scope

> **Proposal.** The principle: replace simulated features with real ones, in the order that makes or breaks the product.

| Priority | Feature | Replaces | Notes |
|---|---|---|---|
| P0 | **Real closet setup:** upload several outfit photos; a vision model returns each piece with category, color and a cropped image; the user confirms or edits | Simulated extraction | Biggest risk in the product (S1) |
| P0 | **Real storage:** a database plus image storage instead of `localStorage` | `localStorage` photos | Fixes the 5 MB cap; enables sync |
| P0 | **Generated recommendations:** looks built from the user's own pieces, the occasion, recent wear and the forecast, with a short reason for each | Fixed `OUTFITS` list | Must only use pieces the user owns |
| P1 | **Live weather** with a °C/°F setting | `SAMPLE_WEATHER` | Location from the browser or a city setting |
| P1 | **Clear actions:** rename Keep/Save (e.g. *Wearing this today* vs *Save for later*) | Current labels | Direct tester finding |
| P1 | **Ask FitCheck:** a chat box for "What do I wear to a birthday dinner Friday?" | — | Same engine as recommendations |
| P2 | Wear history backfilled from photo dates | Preset `lastWornDaysAgo` | See the backlog |
| P2 | Calendar import for upcoming occasions | — | |
| Cut for now | Import past purchases from email | Simulated import | Email access needs a heavy security review |

## 5. Success Measures (draft OECs)

Observable evidence that each core job works. Thresholds are placeholders for the team to set before testing.

| Job | Observable evidence | Draft bar |
|---|---|---|
| Setup | A new user gets **N pieces** into the closet from photos | ≥ 15 pieces in ≤ 5 minutes |
| Extraction quality | Share of extracted pieces kept without edits | ≥ 70% |
| Getting dressed | In a scenario test, the user picks *I'd wear this* on one of the first 3 looks | ≥ 3 of 5 testers |
| Rediscovery | Chosen look includes at least one piece not worn in 30+ days | ≥ 1 in 3 chosen looks |
| Clarity | Testers can say what Keep/Save (renamed) does without help | 5 of 5 testers |

## 6. AI Evaluation Plan (draft)

For the recommendation engine and the chat:

- **Golden cases (3–6):** realistic, moderately hard requests, e.g. "rainy work day, client meeting, nothing too
  formal", "birthday dinner, don't repeat last week's dress".
- **Adversarial cases:** requests for pieces the user doesn't own, contradictory constraints, an empty closet.
- **Rubric (pass/fail):** uses only owned pieces · matches occasion · suits the forecast · includes a rarely-worn piece
  when one fits · gives a one-line reason · no shopping suggestions.
- Keep the test cases separate from the cases used while tuning the prompt.

## 7. Open Questions

1. **Course deployment:** the course's final software is expected on the team's WordPress site; this is a React app.
   How should the repo and the WordPress site fit together?
2. **Platform:** stay web-first, or build a phone app later for camera-roll access?
3. **Models and cost:** which vision and language models, and what does setup cost per user?
4. **Privacy:** photos of people are personal data. Where are they stored, and can users delete them?
5. **Accounts:** does v1 need sign-in, or is one device per user enough for testing?
