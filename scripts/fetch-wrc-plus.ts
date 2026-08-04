/**
 * Fetches wRC+ per player-season from FanGraphs (via a public proxy in front of
 * FanGraphs' own leaderboard JSON, since FanGraphs blocks direct scraping) and writes
 * it to public/data/wrc_plus.json, keyed by player name then season. Joins to our own
 * players via MLBAM id, reusing the id already resolved in player_info.json rather than
 * looking each player up again.
 *
 * Usage: bun run scripts/fetch-wrc-plus.ts
 */
import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "public", "data", "swingplus_latest.json");
const PLAYER_INFO_PATH = path.join(process.cwd(), "public", "data", "player_info.json");
const OUT_PATH = path.join(process.cwd(), "public", "data", "wrc_plus.json");
const PROXY = "https://fg-proxy.vercel.app/api/fangraphs";

interface FgRow {
  xMLBAMID: number;
  "wRC+": number;
}

async function fetchSeason(season: number): Promise<Map<number, number>> {
  const params = new URLSearchParams({
    pos: "all",
    stats: "bat",
    lg: "all",
    qual: "0",
    type: "4",
    season: String(season),
    season1: String(season),
    month: "0",
    ind: "0",
    pageitems: "5000",
    pagenum: "1",
    sortstat: "WAR",
    sortdir: "default",
  });
  const res = await fetch(`${PROXY}?${params}`);
  if (!res.ok) throw new Error(`FanGraphs proxy HTTP ${res.status} for season ${season}`);
  const json = (await res.json()) as { data?: FgRow[] };
  const map = new Map<number, number>();
  for (const row of json.data ?? []) {
    if (row.xMLBAMID != null && row["wRC+"] != null) {
      map.set(row.xMLBAMID, row["wRC+"]);
    }
  }
  return map;
}

async function main() {
  const rawData = await fs.readFile(DATA_PATH, "utf8");
  const data = JSON.parse(rawData.replace(/\bNaN\b/g, "null")) as {
    seasons: number[];
    players: { player_name: string; game_year: number }[];
  };
  const playerInfo = JSON.parse(await fs.readFile(PLAYER_INFO_PATH, "utf8")) as Record<
    string,
    { id: number }
  >;

  console.log(`Fetching wRC+ for seasons: ${data.seasons.join(", ")}`);
  const bySeasonId = new Map<number, Map<number, number>>();
  for (const season of data.seasons) {
    const map = await fetchSeason(season);
    bySeasonId.set(season, map);
    console.log(`  ${season}: ${map.size} players with wRC+`);
  }

  const out: Record<string, Record<string, number>> = {};
  let matched = 0;
  let missed = 0;
  const uniquePairs = new Set(data.players.map((p) => `${p.player_name}|${p.game_year}`));

  for (const pair of uniquePairs) {
    const sep = pair.lastIndexOf("|");
    const name = pair.slice(0, sep);
    const year = Number(pair.slice(sep + 1));
    const id = playerInfo[name]?.id;
    const wrcPlus = id != null ? bySeasonId.get(year)?.get(id) : undefined;
    if (wrcPlus != null) {
      out[name] ??= {};
      out[name][year] = wrcPlus;
      matched++;
    } else {
      missed++;
    }
  }

  await fs.writeFile(OUT_PATH, JSON.stringify(out));
  console.log(`Wrote ${matched} player-seasons (${missed} unmatched) to ${OUT_PATH}`);
}

main();
