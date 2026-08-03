import { COMPONENT_KEYS, ComponentKey, DepthKey, Player } from "@/lib/types";
import { fmtNum, fmtPercentile, fmtSigned } from "@/lib/metrics";
import { ramp } from "@/lib/ramp";
import { COMPONENT_ASK, COMPONENT_NOTE } from "@/lib/copy";
import ContactDiagram from "./ContactDiagram";

type PctFn = (x: number | null | undefined) => number | null;

interface Props {
  player: Player;
  pct: Record<ComponentKey | "Hitting+" | "xwoba", PctFn>;
  leagueDepth: Record<DepthKey, number>;
}

const GAP_HIGH = 25;
const GAP_LOW = -25;

export default function PlayerCard({ player: d, pct, leagueDepth }: Props) {
  const hp = pct["Hitting+"](d["Hitting+"]);
  const xp = pct["xwoba"](d.xwoba);
  const gap = hp != null && xp != null ? hp - xp : null;

  let read: string | null = null;
  let warn = false;
  if (gap != null) {
    if (gap > GAP_HIGH) {
      warn = true;
      read =
        "The swing grades far better than the batted balls. Something after contact is not going his way, or the model is seeing skills the results have not paid out yet.";
    } else if (gap < GAP_LOW) {
      warn = true;
      const extra = d.extra_bases;
      if (extra != null && extra > 0.04) {
        read = `He is producing well beyond what the swing itself explains. He also takes ${fmtSigned(
          extra,
          2
        )} extra bases per batted ball, which Hitting+ cannot see because it grades the bat, not the legs.`;
      } else {
        read =
          "He is producing well beyond what the swing itself explains. His extra bases are unremarkable, so this gap is not baserunning. It is the model missing something about how he hits.";
      }
    } else {
      read = "Grade and results line up. What the swing looks like is what it produced.";
    }
  }

  return (
    <div className="rounded border border-[var(--rule)] bg-[var(--panel)] px-5 py-6 sm:px-7 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--rule)] pb-5">
        <div>
          <div className="font-cond text-3xl font-bold leading-tight sm:text-[34px]">{d.player_name}</div>
          <div className="mt-1.5 font-mono-num text-xs text-[var(--dim)]">
            {[
              `${d.game_year}`,
              `${d.pitches.toLocaleString()} pitches`,
              `${d.swings.toLocaleString()} swings`,
              `${d.pa} PA`,
            ].join(" · ")}
          </div>
        </div>
        <div className="flex-shrink-0 text-left sm:text-right">
          <div className="font-mono-num text-[40px] font-semibold leading-none sm:text-[52px]" style={{ color: ramp(hp) }}>
            {fmtNum(d["Hitting+"], 0)}
          </div>
          <div className="mt-1 font-mono-num text-[11px] uppercase tracking-[0.14em] text-[var(--dim)]">Hitting+</div>
          <div className="mt-0.5 font-mono-num text-xs text-[var(--dim)]">{hp == null ? "" : fmtPercentile(hp)}</div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 font-mono-num text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--dim)]">
          The swing, in order
        </h2>
        <div className="relative space-y-[18px] pl-[26px]">
          <div className="absolute bottom-[14px] left-[7px] top-[10px] w-px bg-[var(--rule)]" />
          {COMPONENT_KEYS.map((k, i) => {
            const p = pct[k](d[k]);
            const w = Math.max(2, Math.min(100, p == null ? 0 : p));
            const color = ramp(p);
            return (
              <div key={k} className="relative">
                <span
                  className="absolute -left-[23px] top-[6px] h-[9px] w-[9px] rounded-full border"
                  style={{
                    background: p != null && p >= 50 ? "var(--green)" : "var(--panel)",
                    borderColor: p != null && p >= 50 ? "var(--green)" : "var(--dimmer)",
                  }}
                />
                <div className="mb-1.5 flex flex-wrap items-baseline gap-2.5">
                  <span className="font-mono-num text-[11px] tracking-[0.1em] text-[var(--dimmer)]">{i + 1}</span>
                  <span className="text-[15px] font-semibold">{k}</span>
                  <span className="text-[13px] text-[var(--dim)]">{COMPONENT_ASK[k]}</span>
                  <span className="ml-auto font-mono-num text-[17px] font-semibold" style={{ color }}>
                    {fmtNum(d[k], 0)}
                  </span>
                </div>
                <div className="relative h-[7px] overflow-hidden rounded bg-[var(--well)]">
                  <span className="absolute -bottom-0.5 -top-0.5 left-1/2 w-px bg-[var(--dimmer)]" />
                  <span
                    className="absolute bottom-0 left-0 top-0 rounded transition-[width] motion-reduce:transition-none"
                    style={{ width: `${w}%`, background: color }}
                  />
                </div>
                <div className="mt-1 font-mono-num text-[11px] text-[var(--dimmer)]">
                  {p == null ? "--" : `${p.toFixed(0)}th percentile`} &middot; {COMPONENT_NOTE[k](d)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 font-mono-num text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--dim)]">
          Where he meets the ball
        </h2>
        <div className="rounded-[3px] border border-[var(--rule)] bg-[var(--well)] px-4 pb-3 pt-[18px] sm:px-5">
          <ContactDiagram player={d} leagueDepth={leagueDepth} />
          <div className="mt-3 flex flex-wrap gap-4 font-mono-num text-[11px] text-[var(--dim)]">
            <span>
              <i className="mr-1.5 inline-block h-[9px] w-[9px] rounded-sm align-middle" style={{ background: "#E6EDF4" }} />
              <b className="font-medium">Fastball</b>
            </span>
            <span>
              <i className="mr-1.5 inline-block h-[9px] w-[9px] rounded-sm align-middle" style={{ background: "#6FA8DC" }} />
              <b className="font-medium">Breaking</b>
            </span>
            <span>
              <i className="mr-1.5 inline-block h-[9px] w-[9px] rounded-sm align-middle" style={{ background: "#C9922F" }} />
              <b className="font-medium">Offspeed</b>
            </span>
          </div>
        </div>
        <p className="mt-2 font-mono-num text-[11px] text-[var(--dimmer)]">
          Inches in front of the league average contact point for each pitch type. Everyone is early on soft stuff.
          Further right means more fooled.
        </p>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 font-mono-num text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--dim)]">
          Grade against results
        </h2>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-4">
          <div className="bg-[var(--panel)] px-4 py-3.5">
            <div className="font-mono-num text-[11px] uppercase tracking-[0.1em] text-[var(--dim)]">Hitting+</div>
            <div className="mt-1 font-mono-num text-xl font-semibold" style={{ color: ramp(hp) }}>
              {hp == null ? "--" : hp.toFixed(0)}
            </div>
            <div className="mt-0.5 font-mono-num text-[11px] text-[var(--dimmer)]">percentile</div>
          </div>
          <div className="bg-[var(--panel)] px-4 py-3.5">
            <div className="font-mono-num text-[11px] uppercase tracking-[0.1em] text-[var(--dim)]">xwOBA</div>
            <div className="mt-1 font-mono-num text-xl font-semibold">{fmtNum(d.xwoba, 3)}</div>
            <div className="mt-0.5 font-mono-num text-[11px] text-[var(--dimmer)]">
              {xp == null ? "" : `${xp.toFixed(0)}th pctile`}
            </div>
          </div>
          <div className="bg-[var(--panel)] px-4 py-3.5">
            <div className="font-mono-num text-[11px] uppercase tracking-[0.1em] text-[var(--dim)]">wOBA</div>
            <div className="mt-1 font-mono-num text-xl font-semibold">{fmtNum(d.woba, 3)}</div>
            <div className="mt-0.5 font-mono-num text-[11px] text-[var(--dimmer)]">actual</div>
          </div>
          <div className="bg-[var(--panel)] px-4 py-3.5">
            <div className="font-mono-num text-[11px] uppercase tracking-[0.1em] text-[var(--dim)]">Extra bases</div>
            <div className="mt-1 font-mono-num text-xl font-semibold">{fmtSigned(d.extra_bases, 2)}</div>
            <div className="mt-0.5 font-mono-num text-[11px] text-[var(--dimmer)]">per batted ball</div>
          </div>
        </div>
        {read && (
          <div
            className="mt-3.5 rounded-r-[3px] bg-[var(--panel2)] px-4 py-3.5 text-sm"
            style={{ borderLeft: `2px solid ${warn ? "var(--amber)" : "var(--green)"}` }}
          >
            {read}
          </div>
        )}
      </div>
    </div>
  );
}
