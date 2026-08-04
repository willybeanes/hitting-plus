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
}

interface MlbPerson {
  id: number;
  lastFirstName?: string;
  currentTeam?: { name?: string };
  primaryPosition?: { abbreviation?: string };
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
