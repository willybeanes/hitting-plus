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
  const H = 132;
  const PAD = 44;
  const x = (v: number) => PAD + ((v + lim) / (2 * lim)) * (W - 2 * PAD);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Contact depth by pitch type versus league average, with an elite reference mark"
    >
      <line x1={PAD} y1={H - 30} x2={W - PAD} y2={H - 30} stroke="var(--rule)" />
      <line x1={x(0)} y1={18} x2={x(0)} y2={H - 24} stroke="var(--dimmer)" strokeDasharray="2 3" />
      <text x={x(0)} y={H - 10} fill="var(--dim)" fontFamily="var(--font-dm-sans)" fontSize="10" textAnchor="middle">
        league average
      </text>
      <text x={PAD} y={14} fill="var(--dimmer)" fontFamily="var(--font-dm-sans)" fontSize="10">
        later
      </text>
      <text x={W - PAD} y={14} fill="var(--dimmer)" fontFamily="var(--font-dm-sans)" fontSize="10" textAnchor="end">
        earlier
      </text>
      {have.map((f, i) => {
        const dev = (player[f.key] as number) - leagueDepth[f.key];
        const eliteDev = eliteDepth[f.key] - leagueDepth[f.key];
        const px = x(dev);
        const ex = x(eliteDev);
        const y = 34 + i * 26;
        return (
          <g key={f.key}>
            <line x1={x(0)} y1={y} x2={px} y2={y} stroke={f.color} strokeOpacity={0.35} strokeWidth={1.5} />
            <path d={`M ${ex - 4} ${y + 9} L ${ex + 4} ${y + 9} L ${ex} ${y + 3} Z`} fill="var(--accent)" opacity={0.75} />
            <circle cx={px} cy={y} r={5} fill={f.color} />
            <text
              x={px}
              y={y - 9}
              fill={f.color}
              fontFamily="var(--font-dm-sans)"
              fontWeight={600}
              fontSize="11"
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
