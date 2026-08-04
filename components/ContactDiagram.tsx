import { DepthKey, Player } from "@/lib/types";
import { fmtSigned } from "@/lib/metrics";

const FAMILIES: { key: DepthKey; label: string; color: string }[] = [
  { key: "depth_FB", label: "Fastball", color: "#1a1a1a" },
  { key: "depth_BR", label: "Breaking", color: "#7fa0cb" },
  { key: "depth_OS", label: "Offspeed", color: "#c9922f" },
];

export default function ContactDiagram({
  player,
  leagueDepth,
  eliteDepth,
}: {
  player: Player;
  leagueDepth: Record<DepthKey, number>;
  eliteDepth: Record<DepthKey, number>;
}) {
  const have = FAMILIES.filter((f) => player[f.key] != null);

  if (have.length === 0) {
    return <p className="text-xs text-[var(--dim)]">No timing data for this season.</p>;
  }

  const deviations = have.map((f) => (player[f.key] as number) - leagueDepth[f.key]);
  const eliteDeviations = have.map((f) => eliteDepth[f.key] - leagueDepth[f.key]);
  const lim = Math.max(4, Math.ceil(Math.max(...deviations.map(Math.abs), ...eliteDeviations.map(Math.abs)) + 1));
  const W = 640;
  const H = 168;
  const PAD_LEFT = 92;
  const PAD_RIGHT = 44;
  const ROW_H = 38;
  const AXIS_Y = 26 + have.length * ROW_H;
  const x = (v: number) => PAD_LEFT + ((v + lim) / (2 * lim)) * (W - PAD_LEFT - PAD_RIGHT);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Contact depth by pitch type versus league average, with an elite reference mark"
    >
      <line x1={PAD_LEFT} y1={AXIS_Y} x2={W - PAD_RIGHT} y2={AXIS_Y} stroke="var(--rule)" />
      <line x1={x(0)} y1={16} x2={x(0)} y2={AXIS_Y + 6} stroke="var(--dimmer)" strokeDasharray="2 3" />
      <text x={x(0)} y={AXIS_Y + 20} fill="var(--dim)" fontFamily="var(--font-dm-sans)" fontSize="10" textAnchor="middle">
        league average
      </text>
      <text x={PAD_LEFT} y={12} fill="var(--dimmer)" fontFamily="var(--font-dm-sans)" fontSize="10">
        later
      </text>
      <text x={W - PAD_RIGHT} y={12} fill="var(--dimmer)" fontFamily="var(--font-dm-sans)" fontSize="10" textAnchor="end">
        earlier
      </text>
      {have.map((f, i) => {
        const dev = (player[f.key] as number) - leagueDepth[f.key];
        const eliteDev = eliteDepth[f.key] - leagueDepth[f.key];
        const px = x(dev);
        const ex = x(eliteDev);
        const y = 34 + i * ROW_H;
        return (
          <g key={f.key}>
            <text
              x={PAD_LEFT - 12}
              y={y + 4}
              fill={f.color}
              fontFamily="var(--font-dm-sans)"
              fontWeight={700}
              fontSize="12"
              textAnchor="end"
            >
              {f.label}
            </text>
            <line x1={x(0)} y1={y} x2={px} y2={y} stroke={f.color} strokeOpacity={0.35} strokeWidth={1.5} />
            <line x1={ex} y1={y - 11} x2={ex} y2={y + 11} stroke="var(--accent)" strokeWidth={1.5} opacity={0.8} />
            <path
              d={`M ${ex - 4} ${y + 11} L ${ex + 4} ${y + 11} L ${ex} ${y + 17} Z`}
              fill="var(--accent)"
              opacity={0.8}
            />
            {i === 0 && (
              <text
                x={ex}
                y={y + 29}
                fill="var(--accent)"
                fontFamily="var(--font-dm-sans)"
                fontWeight={600}
                fontSize="10"
                textAnchor="middle"
              >
                elite
              </text>
            )}
            <circle cx={px} cy={y} r={5.5} fill={f.color} stroke="white" strokeWidth={1.5} />
            <text
              x={px}
              y={y - 12}
              fill={f.color}
              fontFamily="var(--font-dm-sans)"
              fontWeight={700}
              fontSize="12"
              textAnchor="middle"
            >
              {fmtSigned(dev, 1)}&quot;
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export { FAMILIES };
