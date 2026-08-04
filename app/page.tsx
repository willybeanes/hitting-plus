import { promises as fs } from "fs";
import path from "path";
import { Suspense } from "react";
import Explorer from "@/components/Explorer";
import { SwingPlusData } from "@/lib/types";

async function getData(): Promise<SwingPlusData | null> {
  const file = path.join(process.cwd(), "public", "data", "swingplus_latest.json");
  try {
    const raw = await fs.readFile(file, "utf8");
    // The Python engine writes bare NaN tokens for missing floats (via json.dump's
    // default allow_nan=True), which is not valid JSON. Treat NaN the same as the
    // documented null for missing values.
    const sanitized = raw.replace(/\bNaN\b/g, "null");
    const data = JSON.parse(sanitized) as SwingPlusData;

    // wRC+ comes from FanGraphs, not the swingplus engine, so it lives in its own
    // pre-fetched snapshot (see scripts/fetch-wrc-plus.ts) and gets merged in here.
    const wrcFile = path.join(process.cwd(), "public", "data", "wrc_plus.json");
    let wrcMap: Record<string, Record<string, number>> = {};
    try {
      wrcMap = JSON.parse(await fs.readFile(wrcFile, "utf8"));
    } catch {
      // Snapshot hasn't been generated yet; every player just gets a null wrc_plus below.
    }
    for (const p of data.players) {
      p.wrc_plus = wrcMap[p.player_name]?.[String(p.game_year)] ?? null;
    }

    return data;
  } catch {
    return null;
  }
}

export default async function Home() {
  const data = await getData();

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center shadow-[var(--panel-shadow)]">
          <p className="text-xl font-bold">No data file found</p>
          <p className="mt-3 text-sm text-[var(--dim)]">
            Expected <code className="text-[var(--accent)]">public/data/swingplus_latest.json</code>.
            See SETUP.md for how to add it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <Explorer data={data} />
    </Suspense>
  );
}
