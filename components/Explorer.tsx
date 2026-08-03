"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { COMPONENT_KEYS, DepthKey, SwingPlusData } from "@/lib/types";
import { buildPercentiles, fieldPercentileValue, leagueMean } from "@/lib/metrics";
import { FOOTER_COPY, PA_FILTER_NOTE } from "@/lib/copy";
import SearchBox from "./SearchBox";
import PlayerCard from "./PlayerCard";
import Leaderboard from "./Leaderboard";
import Compare from "./Compare";
import HowItWorks from "./HowItWorks";

type Tab = "card" | "leaderboard" | "compare" | "how";
const TAB_KEYS: Tab[] = ["card", "leaderboard", "compare", "how"];

const DEPTH_KEYS: DepthKey[] = ["depth_FB", "depth_BR", "depth_OS"];
const PCT_KEYS = [...COMPONENT_KEYS, "Hitting+", "xwoba"] as const;
const PA_PRESETS = [10, 50, 150, 300, 500];
const DEFAULT_MIN_PA = 150;

const TABS: { key: Tab; label: string }[] = [
  { key: "card", label: "Player" },
  { key: "leaderboard", label: "Leaderboard" },
  { key: "compare", label: "Compare" },
  { key: "how", label: "How it works" },
];

export default function Explorer({ data }: { data: SwingPlusData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const seasons = useMemo(() => [...data.seasons].sort((a, b) => b - a), [data.seasons]);

  const [tab, setTab] = useState<Tab>(() => {
    const q = searchParams.get("tab");
    return TAB_KEYS.includes(q as Tab) ? (q as Tab) : "card";
  });
  const [season, setSeason] = useState<number>(() => {
    const q = Number(searchParams.get("season"));
    return seasons.includes(q) ? q : seasons[0];
  });
  const [minPA, setMinPA] = useState<number>(() => {
    const q = Number(searchParams.get("minPA"));
    return Number.isFinite(q) && q > 0 ? q : DEFAULT_MIN_PA;
  });
  const [compareNames, setCompareNames] = useState<string[]>(() => {
    const q = searchParams.get("compare");
    return q ? q.split("|").filter(Boolean) : [];
  });

  const seasonPlayers = useMemo(
    () => data.players.filter((p) => p.game_year === season),
    [data.players, season]
  );

  // The percentile baseline is always the qualified pool for the season, never the
  // PA-filtered view. Moving the filter changes who is visible, not what 100 means.
  const qualifiedSeasonPlayers = useMemo(
    () => seasonPlayers.filter((p) => p.qualified),
    [seasonPlayers]
  );

  const visiblePlayers = useMemo(
    () => seasonPlayers.filter((p) => p.pa >= minPA),
    [seasonPlayers, minPA]
  );

  const [pickedName, setPickedName] = useState<string | null>(() => {
    const q = searchParams.get("player");
    if (q) return q;
    const best = [...data.players]
      .filter((p) => p.game_year === seasons[0])
      .sort((a, b) => (b["Hitting+"] ?? -Infinity) - (a["Hitting+"] ?? -Infinity))[0];
    return best?.player_name ?? null;
  });

  const picked = useMemo(
    () => (pickedName ? seasonPlayers.find((p) => p.player_name === pickedName) ?? null : null),
    [seasonPlayers, pickedName]
  );

  const pct = useMemo(() => buildPercentiles(qualifiedSeasonPlayers, PCT_KEYS), [qualifiedSeasonPlayers]);

  const leagueDepth = useMemo(() => {
    const out = {} as Record<DepthKey, number>;
    for (const k of DEPTH_KEYS) out[k] = leagueMean(qualifiedSeasonPlayers, k);
    return out;
  }, [qualifiedSeasonPlayers]);

  const eliteDepth = useMemo(() => {
    const out = {} as Record<DepthKey, number>;
    for (const k of DEPTH_KEYS) out[k] = fieldPercentileValue(qualifiedSeasonPlayers, k, 10) ?? leagueDepth[k];
    return out;
  }, [qualifiedSeasonPlayers, leagueDepth]);

  // Reflect the current view in the URL so it can be bookmarked or shared. Guarded so it
  // only replaces when the query actually differs, since useSearchParams re-suspends the
  // Suspense boundary above on every navigation and an unguarded replace loops forever.
  useEffect(() => {
    const params = new URLSearchParams();
    if (tab !== "card") params.set("tab", tab);
    params.set("season", String(season));
    if (tab === "card" && pickedName) params.set("player", pickedName);
    if (minPA !== DEFAULT_MIN_PA) params.set("minPA", String(minPA));
    if (tab === "compare" && compareNames.length > 0) {
      params.set("compare", compareNames.join("|"));
    }
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, season, pickedName, minPA, compareNames]);

  const selectPlayer = useCallback((name: string) => {
    setPickedName(name);
    setTab("card");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1080px] flex-1 px-4 pb-20 pt-0 sm:px-5">
      <header className="mb-6 pb-5 pt-8">
        <div className="flex flex-wrap items-baseline gap-3.5">
          <h1 className="text-[28px] font-bold tracking-tight sm:text-[32px]">
            Hitting<span className="text-[var(--accent)]">+</span>
          </h1>
        </div>
        <p className="mt-2 max-w-[52ch] text-[15px] text-[var(--dim)]">
          Four graded inputs, in the order a swing happens. Every component measures the swing itself, never the
          result.
        </p>
        <p className="mt-3 text-xs text-[var(--dimmer)]">
          {data.source} &middot; generated {data.generated}
        </p>
      </header>

      <div className="mb-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-3 shadow-[var(--panel-shadow)]">
        <div className="flex flex-wrap items-center gap-2.5">
          <nav className="flex gap-1" aria-label="View">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? "page" : undefined}
                className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-transparent bg-transparent text-[var(--dim)] hover:text-[var(--text)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {tab === "card" && <SearchBox players={visiblePlayers} onSelect={selectPlayer} />}

          {tab !== "how" && (
            <label className="ml-auto flex items-center gap-2 text-xs font-medium text-[var(--dim)]">
              Season
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="rounded-lg border border-[var(--rule)] bg-white px-2.5 py-2 text-[13px] text-[var(--text)]"
              >
                {seasons.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {tab === "leaderboard" && (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-[var(--rule)] pt-3">
              <span className="text-xs font-medium text-[var(--dim)]">Min PA</span>
              <div className="flex gap-1" role="group" aria-label="Minimum plate appearances">
                {PA_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMinPA(n)}
                    aria-pressed={minPA === n}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      minPA === n
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--rule)] bg-white text-[var(--dim)] hover:text-[var(--text)]"
                    }`}
                  >
                    {n}+
                  </button>
                ))}
              </div>
              <span className="text-xs text-[var(--dimmer)]">{visiblePlayers.length} shown</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--dimmer)]">{PA_FILTER_NOTE}</p>
          </>
        )}
      </div>

      {tab === "card" &&
        (picked ? (
          <PlayerCard player={picked} pct={pct} leagueDepth={leagueDepth} eliteDepth={eliteDepth} />
        ) : (
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-7 py-11 text-center text-[var(--dim)] shadow-[var(--panel-shadow)]">
            <p className="mb-1.5 text-base font-semibold text-[var(--text)]">No hitter selected</p>
            <p>Search a name above, or pick one from the leaderboard.</p>
          </div>
        ))}

      {tab === "leaderboard" && (
        <Leaderboard players={visiblePlayers} pct={pct} onSelect={selectPlayer} minPA={minPA} />
      )}

      {tab === "compare" && (
        <Compare
          players={seasonPlayers}
          searchPool={visiblePlayers}
          pct={pct}
          selected={compareNames}
          onChangeSelected={setCompareNames}
        />
      )}

      {tab === "how" && <HowItWorks />}

      <footer className="mt-9 space-y-3 border-t border-[var(--rule)] pt-5 text-xs leading-relaxed text-[var(--dimmer)]">
        {FOOTER_COPY.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </footer>
    </div>
  );
}
