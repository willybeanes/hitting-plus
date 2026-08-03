import { normalize } from "./metrics";

const idCache = new Map<string, number | null>();
const inflight = new Map<string, Promise<number | null>>();

export function headshotUrl(id: number, size = 213): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_${size},q_auto:best/v1/people/${id}/headshot/67/current`;
}

interface MlbPerson {
  id: number;
  lastFirstName?: string;
}

/** Resolves "Last, First" to an MLBAM person id via MLB's public Stats API, caching by name for the session. */
export function resolveHeadshotId(name: string): Promise<number | null> {
  if (idCache.has(name)) return Promise.resolve(idCache.get(name) ?? null);
  const existing = inflight.get(name);
  if (existing) return existing;

  const [last, first] = name.split(",").map((s) => s.trim());
  const query = first ? `${first} ${last}` : name;

  const promise = fetch(`https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { people?: MlbPerson[] } | null) => {
      const people = data?.people ?? [];
      const target = normalize(name);
      const match = people.find((p) => normalize(p.lastFirstName ?? "") === target) ?? people[0];
      return match?.id ?? null;
    })
    .catch(() => null)
    .then((id) => {
      idCache.set(name, id);
      inflight.delete(name);
      return id;
    });

  inflight.set(name, promise);
  return promise;
}
