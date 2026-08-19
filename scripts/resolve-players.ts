/**
 * Resolves every unique player name in the data file to MLBAM id, current team, and
 * current position via MLB's public Stats API, once, and writes the result to
 * public/data/player_info.json. The app reads that static file instead of calling the
 * API from every visitor's browser. Re-run this after regenerating the main data file,
 * or periodically to pick up trades/call-ups.
 *
 * Usage: bun run scripts/resolve-players.ts
 */
import { promises as fs } from "fs";
import path from "path";
import { normalize } from "../lib/metrics";
import { TEAM_ABBR } from "../lib/teams";

const DATA_PATH = path.join(process.cwd(), "public", "data", "swingplus_latest.json");
const OUT_PATH = path.join(process.cwd(), "public", "data", "player_info.json");
const CONCURRENCY = 8;

interface PlayerInfo {
  id: number;
  team: string | null;
  position: string | null;
  /** Teams the player logged hitting stats for, keyed by season. A traded player has
   *  more than one entry for a season. Used so the leaderboard's team filter reflects
   *  the roster for the SELECTED season, not the player's current club. */
  teamsBySeason: Record<string, string[]>;
}

interface MlbPerson {
  id: number;
  lastFirstName?: string;
  currentTeam?: { name?: string };
  primaryPosition?: { abbreviation?: string };
}

interface YearByYearSplit {
  season?: string;
  team?: { name?: string };
}

/** Fetches the year-by-year hitting splits for a player id and reduces them to the set
 *  of MLB team abbreviations they played for in each season. Silent on failure — a
 *  missing map just means that player can't be season-filtered. */
async function resolveTeamsBySeason(id: number): Promise<Record<string, string[]>> {
  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=yearByYear&group=hitting`
    );
    if (!res.ok) return {};
    const data = (await res.json()) as { stats?: { splits?: YearByYearSplit[] }[] };
    const splits = data.stats?.[0]?.splits ?? [];
    const bySeason: Record<string, Set<string>> = {};
    for (const s of splits) {
      const season = s.season;
      const abbr = s.team?.name ? TEAM_ABBR[s.team.name] : undefined;
      if (!season || !abbr) continue;
      (bySeason[season] ??= new Set()).add(abbr);
    }
    const out: Record<string, string[]> = {};
    for (const [season, set] of Object.entries(bySeason)) out[season] = Array.from(set).sort();
    return out;
  } catch {
    return {};
  }
}

async function resolveOne(name: string): Promise<PlayerInfo | null> {
  const [last, first] = name.split(",").map((s) => s.trim());
  const query = first ? `${first} ${last}` : name;
  const res = await fetch(
    `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}&hydrate=currentTeam`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { people?: MlbPerson[] };
  const people = data.people ?? [];
  const target = normalize(name);
  const match = people.find((p) => normalize(p.lastFirstName ?? "") === target) ?? people[0];
  if (!match) return null;
  const rawTeamName = match.currentTeam?.name ?? null;
  const abbr = rawTeamName ? TEAM_ABBR[rawTeamName] : undefined;
  return {
    id: match.id,
    team: abbr ?? null,
    position: match.primaryPosition?.abbreviation ?? null,
    teamsBySeason: await resolveTeamsBySeason(match.id),
  };
}

async function main() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  const sanitized = raw.replace(/\bNaN\b/g, "null");
  const json = JSON.parse(sanitized) as { players: { player_name: string }[] };
  const names = Array.from(new Set(json.players.map((p) => p.player_name)));
  console.log(`Resolving ${names.length} unique players...`);

  const out: Record<string, PlayerInfo> = {};
  let idx = 0;
  let done = 0;
  let misses = 0;

  async function worker() {
    while (idx < names.length) {
      const name = names[idx++];
      try {
        const info = await resolveOne(name);
        if (info) {
          out[name] = info;
        } else {
          misses++;
        }
      } catch {
        misses++;
      }
      done++;
      if (done % 100 === 0 || done === names.length) {
        console.log(`  ${done}/${names.length} (${misses} misses so far)`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await fs.writeFile(OUT_PATH, JSON.stringify(out));
  console.log(`Wrote ${Object.keys(out).length} entries (${misses} unresolved) to ${OUT_PATH}`);
}

main();
