"use client";

import { useMemo, useState } from "react";
import { ComponentKey, Player } from "@/lib/types";
import { fmtNum, fmtSigned } from "@/lib/metrics";
import { ramp } from "@/lib/ramp";

type PctFn = (x: number | null | undefined) => number | null;

interface Row extends Player {
  gap: number | null;
}

const COLUMNS: { key: keyof Row | "gap"; label: string }[] = [
  { key: "player_name", label: "Hitter" },
  { key: "Hitting+", label: "Hitting+" },
  { key: "Decision+", label: "Decision+" },
  { key: "Swing+", label: "Swing+" },
  { key: "Contact+", label: "Contact+" },
  { key: "Power+", label: "Power+" },
  { key: "xwoba", label: "xwOBA" },
  { key: "gap", label: "Gap" },
];

export default function Leaderboard({
  players,
  pct,
  onSelect,
}: {
  players: Player[];
  pct: Record<ComponentKey | "Hitting+" | "xwoba", PctFn>;
  onSelect: (name: string) => void;
}) {
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: "Hitting+", dir: -1 });

  const rows: Row[] = useMemo(() => {
    return players.map((r) => {
      const hp = pct["Hitting+"](r["Hitting+"]);
      const xp = pct["xwoba"](r.xwoba);
      return { ...r, gap: hp != null && xp != null ? hp - xp : null };
    });
  }, [players, pct]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const A = a[sort.k as keyof Row];
      const B = b[sort.k as keyof Row];
      if (typeof A === "string" || typeof B === "string") {
        return sort.dir * String(A ?? "").localeCompare(String(B ?? ""));
      }
      const an = A as number | null;
      const bn = B as number | null;
      if (an == null && bn == null) return 0;
      if (an == null) return 1;
      if (bn == null) return -1;
      return sort.dir * (an - bn);
    });
    return copy;
  }, [rows, sort]);

  function onSort(k: string) {
    setSort((s) => (s.k === k ? { k, dir: (s.dir * -1) as 1 | -1 } : { k, dir: k === "player_name" ? 1 : -1 }));
  }

  return (
    <div className="rounded border border-[var(--rule)] bg-[var(--panel)] px-5 py-6 sm:px-7 sm:py-6">
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono-num text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--dim)]">
          Every qualified hitter
        </h2>
        <span className="font-mono-num text-xs text-[var(--dimmer)]">{sorted.length} qualified</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  onClick={() => onSort(c.key as string)}
                  aria-sort={sort.k === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                  className={`cursor-pointer select-none whitespace-nowrap px-2.5 pb-2.5 font-mono-num text-[10px] font-medium uppercase tracking-[0.1em] hover:text-[var(--text)] ${
                    c.key === "player_name" ? "text-left" : "text-right"
                  } ${sort.k === c.key ? "text-[var(--green)]" : "text-[var(--dim)]"}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const hp = pct["Hitting+"](r["Hitting+"]);
              return (
                <tr
                  key={r.player_name}
                  onClick={() => onSelect(r.player_name)}
                  className="cursor-pointer border-t border-[var(--rule)] hover:bg-[var(--panel2)]"
                >
                  <td className="px-2.5 py-2 text-left hover:text-[var(--green)]">{r.player_name}</td>
                  <td className="px-2.5 py-2 text-right font-mono-num" style={{ color: ramp(hp) }}>
                    {fmtNum(r["Hitting+"], 0)}
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono-num">{fmtNum(r["Decision+"], 0)}</td>
                  <td className="px-2.5 py-2 text-right font-mono-num">{fmtNum(r["Swing+"], 0)}</td>
                  <td className="px-2.5 py-2 text-right font-mono-num">{fmtNum(r["Contact+"], 0)}</td>
                  <td className="px-2.5 py-2 text-right font-mono-num">{fmtNum(r["Power+"], 0)}</td>
                  <td className="px-2.5 py-2 text-right font-mono-num">{fmtNum(r.xwoba, 3)}</td>
                  <td
                    className="px-2.5 py-2 text-right font-mono-num"
                    style={{
                      color: r.gap == null ? "var(--dim)" : r.gap > 25 ? "var(--green)" : r.gap < -25 ? "var(--clay)" : "var(--dim)",
                    }}
                  >
                    {r.gap == null ? "--" : fmtSigned(r.gap, 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
