# Build brief: Hitting+ Explorer

Build a Next.js app, deployed on Vercel, for exploring a set of baseball hitting
metrics I built. Read this whole file before writing code.

---

## Who you are working with

I am not a developer. I have a background as a systems analyst, I can run commands
in Terminal when told exactly what to type, and I run Python analysis in JupyterLab.
I do not know React, I do not know how to debug a build failure, and I will not be
able to fix things you leave half-finished.

That has two consequences for how you should work:

1. **Prefer the simplest architecture that does the job.** No database, no CMS, no
   auth, no API routes unless something genuinely needs one. Static JSON in
   `public/` read at build time or fetched client side is correct here.
2. **Every command I need to run should be spelled out**, one per line, with what
   it does and what I should see when it works. Put these in a `SETUP.md` at the
   repo root, written for someone who has never run `npm` before.

Do not ask me to make architectural decisions. Make them, state what you chose in
one line, and move on.

---

## What the metrics are

Hitting+ is a hitter-side answer to the pitcher-side Stuff+ / Location+ / Pitching+
family. It grades **inputs**, meaning things about the swing itself, and never reads
the hitter's own results. That is the entire point: like Pitching+, it is allowed to
disagree with the stat line, and the disagreements are the interesting part.

Four components, and they are ordered because a swing genuinely happens in this
sequence:

| Component | Grades | The question |
| --- | --- | --- |
| **Decision+** | swing or take | *whether* you swung |
| **Timing+** | contact timing | *when* the bat arrived |
| **Contact+** | whiff avoidance | did the bat *find* it |
| **Power+** | bat speed plus lift | *what* the swing brought |
| **Hitting+** | refit on all four | the combination |

Details that matter for how you present them:

- **Decision+** scores every pitch by the run-value regret of the swing-or-take
  choice, against what a league-average hitter gets in that location, count and
  pitch type. Correct choice scores zero, wrong choice scores negative by the size
  of the gap, so coin-flip pitches barely register.
- **Timing+** measures when the bat arrived: how far out front a hitter makes
  contact on breaking and offspeed pitches relative to fastballs. Everyone is
  early on soft stuff. Staying back is the skill. Higher Timing+ is better.
- **Contact+** is whiff avoidance, scaled so higher is better.
- **Power+** combines location-adjusted bat speed (paBS) and location-adjusted
  attack angle (paAA, the "lift" term). Both are adjusted because contact point
  changes both measurements: hitters swing slower on high pitches and steeper on
  low ones regardless of ability.
- **Hitting+** is a **regression refit on all four component features**, not an
  average of them. The components correlate, so averaging counts the same tendency
  more than once. Do not present it as a blend anywhere in the UI.

All five are scaled so **100 is league average and 15 is one standard deviation**,
the same convention as wRC+ and Stuff+.

### The two honest limitations, which the UI must surface rather than hide

1. **Hitting+ cannot see baserunning.** It grades the swing. Hitters who stretch
   singles into doubles beat their grade by design. The data includes an
   `extra_bases` field (total bases above what that batted ball usually yields) so
   the UI can separate "the model missed something" from "this is legs, not bat."
2. **It over-punishes elite contact hitters with no power.** Bat speed carries the
   most weight in the fit, so a hitter nine mph below expected bat speed grades in
   the bottom few percent even when his expected outcomes are league average. This
   is a real limitation, not a bug to design around. Say so in the footer.

---

## The data contract

I generate the data from a Python engine and will commit the JSON into the repo.
Assume the file lives at `public/data/swingplus_latest.json` and looks like this:

```json
{
  "generated": "2026-08-02T09:14:22",
  "source": "swingplus engine",
  "seasons": [2024, 2025, 2026],
  "fields": [
    {"key": "Decision+", "label": "Decision+", "desc": "..."}
  ],
  "players": [ { ...one object per player-season... } ]
}
```

Each object in `players` has these keys. **Every numeric field can be `null`** for
some player-seasons, so handle that everywhere rather than assuming presence.

| Key | Type | Meaning | Typical range |
| --- | --- | --- | --- |
| `player_name` | string | `"Last, First"` with accents, eg `"Ramírez, José"` | |
| `game_year` | int | season | 2024 to 2026 |
| `pitches` | int | pitches seen | 800 to 6500 |
| `swings` | int | swings taken | 400 to 3300 |
| `pa` | int | plate appearances | 150 to 750 |
| `Hitting+` | float | the headline grade | 40 to 155 |
| `Decision+` | float | | 45 to 145 |
| `Timing+` | float | | 55 to 160 |
| `Contact+` | float | | 40 to 140 |
| `Power+` | float | | 45 to 145 |
| `paBS+` | float | bat speed half of Power+ | 45 to 150 |
| `paAA+` | float | lift half of Power+ | 45 to 150 |
| `xwoba` | float | expected wOBA, the calibration target | 0.240 to 0.480 |
| `woba` | float | actual wOBA | 0.220 to 0.470 |
| `extra_bases` | float | total bases above expected, per batted ball | -0.19 to +0.21 |
| `swing_rate` | float | share of pitches swung at, 0 to 1 | 0.38 to 0.62 |
| `whiff_rate` | float | share of swings missed, 0 to 1 | 0.08 to 0.35 |
| `paBS` | float | raw bat speed residual, mph vs expected | -10 to +10 |
| `paAA` | float | raw attack angle residual, degrees vs expected | -8 to +9 |
| `fooled` | float | inches early on soft stuff vs fastballs | +0.7 to +13.6 |
| `depth_FB` | float | contact depth on fastballs, location adjusted, inches | -11 to +5 |
| `depth_BR` | float | same, breaking balls | -6 to +12 |
| `depth_OS` | float | same, offspeed | -5 to +15 |

Notes on the awkward ones:

- **Percentiles are not in the file.** Compute them client side, **within season**,
  across the players present. Do not compute percentiles across pooled seasons.
- **`fooled` is inverted relative to Timing+.** Lower `fooled` is better and produces
  a higher Timing+. If you show the raw number, label it so that is obvious.
- **Depth fields are "inches in front of the batter, location adjusted."** Positive
  means contact happened further out front, which means the hitter was **early**.
  To make them readable, subtract the league mean for that field within the season
  and show the deviation.
- Names use real accents. Search must be accent-insensitive: normalize with
  `.normalize('NFD').replace(/\p{Diacritic}/gu, '')` on both sides.
- Roughly 240 to 340 player-seasons per year, so the whole file is under 300 KB.
  Loading it all client side is fine. Do not build pagination or a search API.

---

## What to build

### 1. Player card, the primary view

This is the reason the app exists. A person types a name and gets a full picture of
how that hitter's grade is constructed.

Required on the card:

- Name, season, and the sample it rests on (pitches, swings, PA)
- **Hitting+ as the hero number**, with its within-season percentile
- **The four components laid out in swing order**, each with its grade, its
  percentile, a bar, and one line of plain-language context underneath. That
  context line should use the raw fields, for example "misses 12% of his swings"
  for Contact+ or "bat speed +4.9 mph, lift +2.1 deg vs expected" for Power+.
- **A contact-depth diagram** showing where this hitter meets fastballs vs breaking
  vs offspeed, relative to league average. This is the signature visual and it
  should be the thing people screenshot. See the design notes below.
- **Grade against results**: Hitting+ percentile, xwOBA, wOBA, extra bases, and a
  written read of what the gap means. Three cases: aligned, grading above results,
  or producing beyond the swing. In the third case, check `extra_bases` and say
  whether the gap is baserunning or something the model is missing.

### 2. Leaderboard

Every qualified hitter for the selected season, sortable on every column, clicking
a row opens that player's card. Include a computed "gap" column (Hitting+ percentile
minus xwOBA percentile) since that is where the interesting names live.

### 3. Compare view

Two or three hitters side by side on the four components. I have an existing tool
at `player-compare-rho.vercel.app` that does this shape for FanGraphs stats; this
should feel like a sibling to it, not a clone.

### 4. Season switching

A control that changes the season and updates everything, keeping the selected
player if they exist in the new season.

---

## Design direction

I have a prototype single-file HTML version in this repo at
`reference/hitting-plus-explorer.html`. **Use it as the starting point for the
visual language, not as code to copy.** It establishes the palette, the swing-order
sequence layout, and the contact diagram. Improve on it.

House style for my analytics tools:

- **Dark navy and charcoal**, not pure black. The prototype uses `#0D1218` base,
  `#151D26` panels, `#26323F` rules.
- **FanGraphs green `#1D9C52`** as the single accent, with a muted clay `#C25B42`
  for below-average values. A percentile-driven colour ramp between them.
- **IBM Plex Sans** for interface and prose, **IBM Plex Mono for every number**.
  The numbers are the content, and mono makes the card read like a readout.
  IBM Plex Sans Condensed at 700 for player names.
- Restraint everywhere except the contact diagram. That is where the boldness goes.

### The contact diagram, in detail

A horizontal axis representing inches in front of the league-average contact point.
Three markers, one per pitch family, positioned at that hitter's deviation. Label
the left end "later" and the right end "earlier" and mark league average with a
dashed vertical line.

Why it works: everyone is early on soft stuff, so most hitters show fastball near
the middle and breaking and offspeed pushed right. A hitter with good timing has
them clustered; a hitter who gets fooled has them spread far right. It makes the
Timing+ finding legible in one glance.

Draw it as inline SVG. Do not pull in a charting library for this.

### Things not to do

- No gradient hero sections, no glassmorphism, no animated background blobs.
- No radar or spider charts for the four components. They imply the axes are
  comparable in a way they are not.
- Do not use emoji anywhere.
- **No em dashes in any copy.** Use commas, periods, colons or parentheses. This
  applies to code comments and README text too.
- Do not invent metrics, thresholds or player facts. If you need a number that is
  not in the data contract, ask rather than guessing.

---

## Technical requirements

- **Next.js App Router, TypeScript, Tailwind.** Deployed on Vercel.
- **No database.** JSON in `public/data/`, fetched client side or imported at build.
- **No localStorage or sessionStorage.** Keep state in React.
- Responsive down to a phone. The card is the priority; the leaderboard can scroll
  horizontally on small screens.
- Keyboard accessible: search results navigable with arrows and Enter, visible focus
  rings, `prefers-reduced-motion` respected.
- Fast. This is a small static dataset and the app should feel instant.

### Deliverables

1. The working app.
2. **`SETUP.md`** at the repo root: how to run it locally, how to deploy to Vercel,
   and **how to update the data**, which is the part I will actually do repeatedly.
   The update flow is: I regenerate `swingplus_latest.json` from my Python engine,
   drop it into `public/data/`, and push. Write that out as literal commands.
3. **`README.md`** explaining what the metrics are, so the repo makes sense to
   someone who finds it later.

### Definition of done

- `npm run build` completes with no errors and no type errors.
- Searching a name with an accent, for example "Ramirez" without the accent, finds
  "Ramírez, José".
- Switching seasons keeps the selected player when they exist in that season.
- A player with `null` in any numeric field renders without crashing.
- The card is readable at 375px wide.

---

## Working style

Build it in this order, and show me something running before you polish:

1. Data loading, season switching, search, and a rough player card
2. The contact diagram
3. The leaderboard
4. Compare view
5. Polish and accessibility pass

Tell me when each stage is done and what I should look at. If something in this
brief turns out to be wrong when you hit the real data, say so rather than working
around it silently.
