"use client";

import { useId, useMemo, useState } from "react";
import { Player } from "@/lib/types";
import { normalize, fmtNum } from "@/lib/metrics";

interface Props {
  players: Player[];
  placeholder?: string;
  onSelect: (name: string) => void;
  excludeNames?: string[];
}

export default function SearchBox({ players, placeholder, onSelect, excludeNames }: Props) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => {
    const t = normalize(term.trim());
    if (!t) return [];
    const excluded = new Set(excludeNames ?? []);
    return players
      .filter((p) => normalize(p.player_name).includes(t) && !excluded.has(p.player_name))
      .sort((a, b) => (b["Hitting+"] ?? -Infinity) - (a["Hitting+"] ?? -Infinity))
      .slice(0, 9);
  }, [term, players, excludeNames]);

  function choose(name: string) {
    onSelect(name);
    setTerm("");
    setOpen(false);
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active].player_name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative flex-1 min-w-[220px]">
      <input
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={term}
        placeholder={placeholder ?? "Search a hitter"}
        aria-label={placeholder ?? "Search a hitter"}
        onChange={(e) => {
          setTerm(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="w-full rounded-[3px] border border-[var(--rule)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--dim)] focus-visible:outline-2 focus-visible:outline-[var(--green)]"
      />
      {open && term.trim() && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-[300px] overflow-auto rounded-[3px] border border-[var(--rule)] bg-[var(--panel2)]"
        >
          {results.length === 0 && (
            <li className="px-3 py-2 font-mono-num text-xs text-[var(--dim)]">No hitter by that name</li>
          )}
          {results.map((r, i) => (
            <li
              key={r.player_name}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(r.player_name)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                i === active ? "bg-[var(--green-dim)]" : ""
              }`}
            >
              <span>{r.player_name}</span>
              <span className="font-mono-num text-xs text-[var(--dim)]">{fmtNum(r["Hitting+"], 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
