"use client";

import { useMemo, useState } from "react";
import { COMPONENT_KEYS, DepthKey, SwingPlusData } from "@/lib/types";
import { buildPercentiles, leagueMean } from "@/lib/metrics";
import { FOOTER_COPY } from "@/lib/copy";
import SearchBox from "./SearchBox";
import PlayerCard from "./PlayerCard";
import Leaderboard from "./Leaderboard";
import Compare from "./Compare";

type Tab = "card" | "leaderboard" | "compare";

const DEPTH_KEYS: DepthKey[] = ["depth_FB", "depth_BR", "depth_OS"];
const PCT_KEYS = [...COMPONENT_KEYS, "Hitting+", "xwoba"] as const;

export default function Explorer({ data }: { data: SwingPlusData }) {
  const seasons = useMemo(() => [...data.seasons].sort((a, b) => b - a), [data.seasons]);
  const [season, setSeason] = useState<number>(seasons[0]);
  const [tab, setTab] = useState<Tab>("card");
  const [compareNames, setCompareNames] = useState<string[]>([]);

  const seasonPlayers = useMemo(
    () => data.players.filter((p) => p.game_year === season),
    [data.players, season]
  );

  const [pickedName, setPickedName] = useState<string | null>(() => {
    const best = [...data.players]
      .filter((p) => p.game_year === seasons[0])
      .sort((a, b) => (b["Hitting+"] ?? -Infinity) - (a["Hitting+"] ?? -Infinity))[0];
    return best?.player_name ?? null;
  });

  const picked = useMemo(
    () => (pickedName ? seasonPlayers.find((p) => p.player_name === pickedName) ?? null : null),
    [seasonPlayers, pickedName]
  );

  const pct = useMemo(() => buildPercentiles(seasonPlayers, PCT_KEYS), [seasonPlayers]);

  const leagueDepth = useMemo(() => {
    const out = {} as Record<DepthKey, number>;
    for (const k of DEPTH_KEYS) out[k] = leagueMean(seasonPlayers, k);
    return out;
  }, [seasonPlayers]);

  function selectPlayer(name: string) {
    setPickedName(name);
    setTab("card");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "card", label: "Player" },
    { key: "leaderboard", label: "Leaderboard" },
    { key: "compare", label: "Compare" },
  ];

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

      <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-3 shadow-[var(--panel-shadow)]">
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

        {tab === "card" && <SearchBox players={seasonPlayers} onSelect={selectPlayer} />}

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
        <span className="text-xs text-[var(--dimmer)]">{seasonPlayers.length} qualified</span>
      </div>

      {tab === "card" &&
        (picked ? (
          <PlayerCard player={picked} pct={pct} leagueDepth={leagueDepth} />
        ) : (
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-7 py-11 text-center text-[var(--dim)] shadow-[var(--panel-shadow)]">
            <p className="mb-1.5 text-base font-semibold text-[var(--text)]">No hitter selected</p>
            <p>Search a name above, or pick one from the leaderboard.</p>
          </div>
        ))}

      {tab === "leaderboard" && <Leaderboard players={seasonPlayers} pct={pct} onSelect={selectPlayer} />}

      {tab === "compare" && (
        <Compare players={seasonPlayers} pct={pct} selected={compareNames} onChangeSelected={setCompareNames} />
      )}

      <footer className="mt-9 space-y-3 border-t border-[var(--rule)] pt-5 text-xs leading-relaxed text-[var(--dimmer)]">
        {FOOTER_COPY.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </footer>
    </div>
  );
}
