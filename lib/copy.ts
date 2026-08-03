import { ComponentKey, Player } from "./types";
import { fmtPct, fmtSigned } from "./metrics";

export const COMPONENT_ASK: Record<ComponentKey, string> = {
  "Decision+": "whether to swing",
  "Swing+": "when the bat arrived",
  "Contact+": "did the bat find it",
  "Power+": "what the swing brought",
};

export const COMPONENT_DESC: Record<ComponentKey, string> = {
  "Decision+":
    "Scores every pitch by the run-value regret of the swing-or-take choice, against what a league-average hitter gets in that location, count and pitch type. A correct choice scores zero. Coin-flip pitches barely register.",
  "Swing+":
    "Measures how far out front a hitter makes contact on breaking and offspeed pitches relative to fastballs. Everyone in baseball is early on soft stuff. A hitter who is less early stayed back better.",
  "Contact+": "Whiff avoidance, scaled so higher is better.",
  "Power+":
    "Combines location-adjusted bat speed and location-adjusted attack angle, the lift term. Both are adjusted because contact point changes both measurements: hitters swing slower on high pitches and steeper on low ones regardless of ability.",
};

/** One line of plain-language context under each component, built from the raw fields. */
export const COMPONENT_NOTE: Record<ComponentKey, (d: Player) => string> = {
  "Decision+": (d) => `swings at ${fmtPct(d.swing_rate)} of pitches seen`,
  "Swing+": (d) => `${fmtSigned(d.fooled, 1)}" in front on soft stuff vs fastballs`,
  "Contact+": (d) => `misses ${fmtPct(d.whiff_rate)} of his swings`,
  "Power+": (d) => `bat speed ${fmtSigned(d.paBS, 1)} mph, lift ${fmtSigned(d.paAA, 1)} deg vs expected`,
};

export const HEADLINE_DESC =
  "A regression refit on all four component features, not an average of them. The components correlate, so averaging would count the same tendency more than once.";

export const FOOTER_COPY = [
  "Hitting+ grades from Statcast pitch tracking, 2024 to 2026, calibrated against xwOBA. Decision+, Swing+, Contact+ and Power+ each grade one part of the swing, in the order it happens. Hitting+ is a regression refit on all four, not an average of them, since the components correlate and averaging would count the same tendency more than once. All five are scaled so 100 is league average and 15 is one standard deviation, the same convention as wRC+ and Stuff+.",
  "Two honest limitations. First, Hitting+ cannot see baserunning: it grades the swing, so hitters who stretch singles into doubles beat their grade by design. Extra bases per batted ball is shown separately so you can tell that apart from a gap the model actually missed. Second, it over-punishes elite contact hitters with no power: bat speed carries the most weight in the fit, so a hitter well below expected bat speed can grade in the bottom few percent even when his expected outcomes are league average. That is a real limitation of the model, not a bug to design around.",
];
