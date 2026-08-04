import { Player } from "@/lib/types";
import { fmtPct } from "@/lib/metrics";

export default function WhiffDiagram({
  player,
  leagueWhiff,
  eliteWhiff,
}: {
  player: Player;
  leagueWhiff: number;
  eliteWhiff: number;
}) {
  if (player.whiff_rate == null) {
    return <p className="text-xs text-[var(--dim)]">No contact data for this season.</p>;
  }
  const whiff = player.whiff_rate;

  const allX = [0, whiff, leagueWhiff, eliteWhiff];
  const lo = 0;
  const hi = Math.max(...allX) * 1.15;

  const W = 640;
  const H = 92;
  const PAD_LEFT = 16;
  const PAD_RIGHT = 16;
  const AXIS_Y = 58;
  const x = (v: number) => PAD_LEFT + ((v - lo) / (hi - lo)) * (W - PAD_LEFT - PAD_RIGHT);

  const px = x(whiff);
  const lx = x(leagueWhiff);
  const ex = x(eliteWhiff);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Whiff rate compared to a typical hitter and the least-whiff hitters"
    >
      <line x1={PAD_LEFT} y1={AXIS_Y} x2={W - PAD_RIGHT} y2={AXIS_Y} stroke="var(--rule)" />
      <text x={PAD_LEFT} y={AXIS_Y - 30} fill="var(--dimmer)" fontFamily="var(--font-dm-sans)" fontSize="10">
        fewer whiffs
      </text>
      <text
        x={W - PAD_RIGHT}
        y={AXIS_Y - 30}
        fill="var(--dimmer)"
        fontFamily="var(--font-dm-sans)"
        fontSize="10"
        textAnchor="end"
      >
        more whiffs
      </text>

      <circle cx={lx} cy={AXIS_Y} r={3} fill="none" stroke="var(--dimmer)" strokeWidth={1.5} />
      <text x={lx} y={AXIS_Y + 18} fill="var(--dimmer)" fontFamily="var(--font-dm-sans)" fontSize="10" textAnchor="middle">
        typical
      </text>

      <line x1={ex} y1={AXIS_Y - 11} x2={ex} y2={AXIS_Y + 11} stroke="var(--accent)" strokeWidth={1.5} opacity={0.8} />
      <text
        x={ex}
        y={AXIS_Y + 22}
        fill="var(--accent)"
        fontFamily="var(--font-dm-sans)"
        fontWeight={600}
        fontSize="10"
        textAnchor="middle"
      >
        elite
      </text>

      <circle cx={px} cy={AXIS_Y} r={6} fill="var(--cool)" stroke="white" strokeWidth={1.5} />
      <text
        x={px}
        y={AXIS_Y - 14}
        fill="#1a1a1a"
        fontFamily="var(--font-dm-sans)"
        fontWeight={700}
        fontSize="13"
        textAnchor="middle"
      >
        {fmtPct(whiff)}
      </text>
    </svg>
  );
}
