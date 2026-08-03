# Hitting+ Explorer

A small Next.js app for exploring Hitting+, a hitter-side answer to the pitcher-side
Stuff+ / Location+ / Pitching+ family. It grades the swing itself, not the results
the swing produced, which means it is allowed to disagree with the stat line. The
disagreements are the interesting part.

## What the metrics are

A swing happens in four steps, and Hitting+ grades each one separately before
refitting them together.

| Component | Grades | The question |
| --- | --- | --- |
| Decision+ | swing or take | whether you swung |
| Timing+ | contact timing | when the bat arrived |
| Contact+ | whiff avoidance | did the bat find it |
| Power+ | bat speed plus lift | what the swing brought |
| Hitting+ | refit on all four | the combination |

- **Decision+** scores every pitch by the run-value regret of the swing-or-take
  choice, against what a league-average hitter gets in that location, count and
  pitch type. A correct choice scores zero. Coin-flip pitches barely move the needle.
- **Timing+** measures when the bat arrived: how far out front a hitter makes
  contact on breaking and offspeed pitches relative to fastballs. Everyone is
  early on soft stuff; staying back is the skill, so higher Timing+ is better.
- **Contact+** is whiff avoidance, scaled so higher is better.
- **Power+** combines location-adjusted bat speed and location-adjusted attack angle
  (the lift term). Both are adjusted because contact point changes both
  measurements: hitters swing slower on high pitches and steeper on low ones
  regardless of ability.
- **Hitting+** is a regression refit on all four component features, not an
  average of them. The components correlate with each other, so averaging would
  count the same underlying tendency more than once.

All five are scaled so **100 is league average and 15 is one standard deviation**,
the same convention as wRC+ and Stuff+.

## Two honest limitations

1. **Hitting+ cannot see baserunning.** It grades the swing, so hitters who stretch
   singles into doubles beat their grade by design. The `extra_bases` field (total
   bases above what a batted ball usually yields) is shown alongside the grade so
   you can tell "this is legs, not bat" apart from "the model missed something."
2. **It over-punishes elite contact hitters with no power.** Bat speed carries the
   most weight in the fit, so a hitter well below expected bat speed can grade in
   the bottom few percent even when his expected outcomes are league average. This
   is a real limitation of the model, not something the UI tries to paper over.

## What is in this app

- **Player card**: search a hitter and see their Hitting+ grade, the four
  components in swing order with percentiles and plain-language context, a
  contact-depth diagram showing where they meet fastballs vs breaking vs offspeed,
  and a read on how the grade compares to their actual results.
- **Leaderboard**: every qualified hitter for a season, sortable on any column,
  including a Gap column (Hitting+ percentile minus xwOBA percentile) for finding
  the hitters the model disagrees with most.
- **Compare**: two or three hitters side by side on the same four components.
- **Season switch**: change seasons without losing your selected hitter, if they
  played in that season too.

## How it works

There is no database and no backend. The data lives in
[`public/data/swingplus_latest.json`](public/data/swingplus_latest.json) and is
read once when the app builds. Percentiles are computed in the browser, separately
for each season, from the players present in that season's file. See
[SETUP.md](SETUP.md) for how to run it locally, deploy it, and update the data.

## Tech

Next.js (App Router), TypeScript, Tailwind CSS. No database, no auth, no API
routes. Built and tested with [Bun](https://bun.sh) as the package manager and
runtime; plain `npm` works too if that is what you have installed.
