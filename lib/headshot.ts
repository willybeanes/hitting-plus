import { normalize } from "./metrics";
import { TEAM_ABBR } from "./teams";

export interface MlbInfo {
  id: number;
  teamName: string | null;
  team: string | null;
  position: string | null;
}

const infoCache = new Map<string, MlbInfo | null>();
const inflight = new Map<string, Promise<MlbInfo | null>>();

export function headshotUrl(id: number, size = 213): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_${size},q_auto:best/v1/people/${id}/headshot/67/current`;
}

interface MlbPerson {
  id: number;
  lastFirstName?: string;
  currentTeam?: { name?: string };
  primaryPosition?: { abbreviation?: string };
}

/**
 * Resolves "Last, First" to MLBAM identity info (id, current team, current position) via
 * MLB's public Stats API, caching by name for the session. Team and position reflect the
 * player's CURRENT assignment, not necessarily what they played in a given past season.
 */
export function resolveMlbInfo(name: string): Promise<MlbInfo | null> {
  if (infoCache.has(name)) return Promise.resolve(infoCache.get(name) ?? null);
  const existing = inflight.get(name);
  if (existing) return existing;

  const [last, first] = name.split(",").map((s) => s.trim());
  const query = first ? `${first} ${last}` : name;

  const promise = fetch(
    `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}&hydrate=currentTeam`
  )
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { people?: MlbPerson[] } | null) => {
      const people = data?.people ?? [];
      const target = normalize(name);
      const match = people.find((p) => normalize(p.lastFirstName ?? "") === target) ?? people[0];
      if (!match) return null;
      // currentTeam can be a minor-league affiliate for optioned or depth players; only
      // surface it when it maps to one of the 30 MLB clubs, since this leaderboard is
      // MLB-level and an unrecognized minor-league name would just clutter the filter.
      const rawTeamName = match.currentTeam?.name ?? null;
      const abbr = rawTeamName ? TEAM_ABBR[rawTeamName] : undefined;
      const info: MlbInfo = {
        id: match.id,
        teamName: abbr ? rawTeamName : null,
        team: abbr ?? null,
        position: match.primaryPosition?.abbreviation ?? null,
      };
      return info;
    })
    .catch(() => null)
    .then((info) => {
      infoCache.set(name, info);
      inflight.delete(name);
      return info;
    });

  inflight.set(name, promise);
  return promise;
}

export function resolveHeadshotId(name: string): Promise<number | null> {
  return resolveMlbInfo(name).then((info) => info?.id ?? null);
}
