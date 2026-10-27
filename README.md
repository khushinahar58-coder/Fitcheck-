# FitCheck

### More outfits. Same closet.

> A wardrobe app for people who own plenty of clothes but keep wearing the same few outfits. Pick the occasion, get looks built from what you already own, swap pieces, check the weather, and plan the week, with the clothes you've forgotten brought back to the front.

![FitCheck: choose an occasion, review a curated look, check it against the weather](docs/images/hero.png)

<sub>The prototype as of 2026-10-27, running on its built-in sample wardrobe. All clothing photos are stock images from Pexels.</sub>

**[Product spec](docs/SPEC.md)** · [Ideas backlog](docs/IDEAS-BACKLOG.md) · [Run it locally](#run-it-locally) · [What's real vs. simulated](#whats-real-vs-simulated)

[![React](https://img.shields.io/badge/React-18-3A3530)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-5C5448)](tsconfig.app.json)
[![Vite](https://img.shields.io/badge/Vite-5-7A7166)](vite.config.ts)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-A89F92)](tailwind.config.js)
[![Stage](https://img.shields.io/badge/stage-clickable%20prototype-C9876B)](#whats-real-vs-simulated)

| Product | Build |
|---|---|
| **User:** A young working professional with a full closet who still feels she has nothing to wear | **Front end:** React 18 + TypeScript + Vite + Tailwind, mobile-first |
| **Job:** Get dressed for a specific occasion quickly, using what she already owns | **Data:** Browser `localStorage`; ships with a 25-piece sample wardrobe |
| **Promise:** Rediscover forgotten clothes instead of buying more | **Backend / AI:** None yet. Recommendations, weather and photo extraction are simulated |
| **Stage:** Working clickable prototype, tested with users; now being built into real software | **Origin:** Designed and prototyped in Bolt; exported to this repo on 2026-10-27 |

## The Problem

Most people wear a small share of what they own. The problem shows up at the moment of getting dressed: there is no time to remember everything in the closet, work out what goes together, or check whether the outfit suits the weather and the day. So people reach for the same few looks and conclude they have nothing to wear.

FitCheck's bet is that **the closet is not the problem; recall is.** Organizing a wardrobe is not enough on its own. The value is making it useful at the moment of decision, for work, dinner, a date, or a weekend.

## Try It In 30 Seconds

<p align="center">
  <img src="docs/images/demo.gif" width="320" alt="Walkthrough: pick Date Night, swap the dress, check the weather, save the look">
  <br>
  <sub>Recorded from the build on 2026-10-27 (15 seconds, no audio).</sub>
</p>

1. On **Home**, pick an occasion: Work, Dinner Out, Date Night, Casual Weekend, or Party.
2. Flip between the looks for that occasion. Pieces you haven't worn in a while carry a **Rarely worn** tag.
3. **Swap** any piece, **Remove** it, or **Add an item** to layer on a jacket or accessory.
4. Tap **I'd wear this** to check the look against the day's weather.
5. **Keep** it to put it on today's calendar, or **Save** it and schedule it for a future date.
6. On the **Calendar**, mark a planned look as worn. That logs the wear date on every piece in it.
7. Open **Wardrobe** to filter by category or by *Not worn recently*, and tap the avatar for wardrobe insights.

## Screens

![Wardrobe, calendar and wardrobe insights](docs/images/screens-wardrobe-calendar-insights.png)

| Screen | What it does |
|---|---|
| **Home** | Pick the occasion; see today's planned outfit if there is one |
| **Recommendations** | Several looks per occasion; swap, remove, or add pieces; rarely-worn pieces flagged |
| **Confirmation** | Weather check, then keep for today (adds it to today's calendar) or save |
| **Wardrobe** | Every piece, filterable by category or by time since last worn |
| **Add** | Add a piece from a photo; extract pieces from an outfit photo; import past purchases |
| **Saved** | Saved looks, ready to schedule |
| **Calendar** | Plan outfits by date and mark them worn, which logs exact wear dates |
| **Profile** | Totals, wardrobe breakdown by category, and rediscovery insights |

## What's Real vs. Simulated

The prototype is honest about what it fakes. This is the gap the current build closes.

| Feature | Today | Notes |
|---|---|---|
| Add a piece from a photo | ✅ Real | You type the name, category, color and brand |
| Wardrobe browse and filters | ✅ Real | Category and *Not worn recently* filters |
| Swap, remove, add a layer | ✅ Real | Works on any look |
| Save, calendar, mark worn | ✅ Real | Wear dates are recorded per piece |
| Rarely-worn tags and insights | ✅ Real | Computed from days since last worn (30+ days = rarely worn) |
| Outfit recommendations | 🟡 Simulated | 18 hand-written looks across 5 occasions in `src/data.ts` |
| Weather | 🟡 Simulated | A fixed table per occasion; no live forecast, no °C/°F label |
| Extract pieces from an outfit photo | 🟡 Simulated | Returns preset results; any upload gets Top / Bottoms / Shoes |
| Import past purchases | 🟡 Simulated | Retailer buttons over sample purchase data |
| Sample wardrobe history | 🟡 Simulated | Starter pieces have preset "last worn" values |
| Sync across devices | ⛔ Not built | Everything lives in one browser's `localStorage` |

## What We Learned From Testing

The team ran a usability walkthrough: a user getting ready for a birthday dinner who wants to avoid her usual outfit.

- **Landed:** the visual design and flow, occasion-based suggestions, accessory swapping, *Not worn recently* tags, and the wardrobe insights.
- **Confused:** the difference between keeping an outfit and saving it.
- **Asked for:** adding layers rather than only swapping, configurable temperature units, a calendar for future plans, and exact wear history.
- **Questioned:** whether recommendations would be generated or pre-set.

Layers, the calendar, and per-piece wear dates are already in this build. The open items are in the [product spec](docs/SPEC.md).

## Where It Goes Next

The full list lives in the [ideas backlog](docs/IDEAS-BACKLOG.md), and nothing there is decided yet. The direction in one line: **replace each simulated feature with a real one, starting with the two that make or break the product.**

1. **Getting the closet in.** If setup feels like work, nobody gets to the good part. Real photo-to-piece extraction with a vision model is the first build.
2. **Real recommendations.** Generate looks from the pieces you own, what you've worn recently, the occasion, and the live forecast.
3. **Wear history that fills itself in.** Dated photos of you wearing a piece are past wears, so "last worn" can be accurate from day one.

## Run It Locally

Requires Node 18+.

```bash
npm install
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript check (passes) |
| `npm run lint` | ESLint (4 unused-import errors carried over from the export) |

To reset the sample wardrobe, clear the site's `localStorage` (keys starting with `fitcheck-`).

## Project Structure

```
src/
├── App.tsx            # Screen routing and bottom navigation
├── store.ts           # Wardrobe, saved looks and calendar state (localStorage)
├── types.ts           # ClothingItem, Outfit, SavedOutfit, CalendarEntry, WeatherInfo
├── data.ts            # Sample wardrobe, looks, weather, and the simulated features
└── screens/           # One file per screen
docs/
├── SPEC.md            # Product spec: user, stories, current build, proposed v1
├── IDEAS-BACKLOG.md   # Parked ideas, hard parts, open questions
└── images/            # README screenshots and walkthrough GIF
```

## Known Issues

- **Photo storage:** uploaded photos are saved as base64 in `localStorage`, which caps out around 5 MB. A handful of phone photos will fill it and saving will stop working.
- **Weather units:** temperatures are shown without a unit and read as Celsius.
- **Lint:** four unused imports from the Bolt export.

## Credits

**Product concept, design and original Bolt prototype:** Akshada Shotri and Khushi Nahar.

**Build team:** Khushi Nahar · Bakul Badwal

Built for *Coding with GPT* at UVA Darden, 2026. Clothing photography from [Pexels](https://www.pexels.com).
