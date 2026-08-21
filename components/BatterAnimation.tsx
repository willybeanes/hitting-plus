"use client";

type Stage = 0 | 1 | 2 | 3;

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut3 = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const sub = (t: number, lo: number, hi: number) => easeOut3((t - lo) / (hi - lo));

// Bat + front-foot pose: [gripX, gripY, barrelX, barrelY, frontFootX]
type Pose = [number, number, number, number, number];

const LOADED: Pose  = [128, 65, 145, 24, 121];
const EARLY: Pose   = [124, 70, 166, 46, 126];
const CONTACT: Pose = [119, 76, 186, 78, 130];
const THROUGH: Pose = [109, 72, 80,  96, 130];

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return a.map((v, i) => lerp(v, b[i], t)) as Pose;
}

function Batter({ pose }: { pose: Pose }) {
  const [gx, gy, bx, by, ffx] = pose;
  return (
    <g>
      <line x1={108} y1={94} x2={92}  y2={148} stroke="var(--dim)" strokeWidth={3}   strokeLinecap="round" />
      <line x1={108} y1={94} x2={ffx} y2={148} stroke="var(--dim)" strokeWidth={3}   strokeLinecap="round" />
      <line x1={108} y1={50} x2={108} y2={94}  stroke="var(--dim)" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={108} y1={62} x2={gx}  y2={gy}  stroke="var(--dim)" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={gx}  y1={gy} x2={bx}  y2={by}  stroke="var(--accent)" strokeWidth={4} strokeLinecap="round" />
      <circle cx={gx} cy={gy} r={3.5} fill="var(--dim)" />
      <circle cx={108} cy={38} r={9} fill="none" stroke="var(--dim)" strokeWidth={2.5} />
      {/* Helmet bill */}
      <path d="M111,34 Q124,37 120,44" fill="none" stroke="var(--dim)" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

function Ball({ cx, cy, r = 5.5 }: { cx: number; cy: number; r?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="var(--text)" />
      <path
        d={`M${cx - 1.5},${cy - r * 0.75} C${cx + r * 0.6},${cy - r * 0.2} ${cx + r * 0.6},${cy + r * 0.2} ${cx - 1.5},${cy + r * 0.75}`}
        fill="none" stroke="var(--track)" strokeWidth={1.2}
      />
    </>
  );
}

/** Stage 0 — Decision+: pitch approaches the plate, batter holds */
function StageDecision({ p }: { p: number }) {
  const bx = lerp(275, 157, p);
  const by = lerp(68, 80, p);

  return (
    <>
      {/* Strike zone */}
      <rect x={141} y={74} width={26} height={50} fill="none"
        stroke="var(--dimmer)" strokeWidth={1} strokeDasharray="4 3" rx={2} />
      {/* Pitch trail */}
      <line x1={275} y1={68} x2={bx} y2={by}
        stroke="var(--dimmer)" strokeWidth={1} strokeDasharray="3 4"
        opacity={clamp01(p * 6)} />
      <Ball cx={bx} cy={by} />
      <Batter pose={LOADED} />
    </>
  );
}

/** Stage 1 — Timing+: swing begins, arc shows contact window */
function StageTiming({ p }: { p: number }) {
  const pose = lerpPose(LOADED, EARLY, p);
  const arcAlpha  = clamp01(p * 3);
  const ballAlpha = clamp01((p - 0.4) * 5);

  return (
    <>
      {/* Barrel's future arc */}
      <path d="M145,24 Q192,38 186,78"
        fill="none" stroke="var(--dimmer)" strokeWidth={1.5}
        strokeDasharray="3 5" opacity={arcAlpha} />
      {/* Optimal contact zone marker */}
      <circle cx={186} cy={78} r={5} fill="none"
        stroke="var(--accent)" strokeWidth={1.5} opacity={arcAlpha} />
      {/* Ball waiting at plate */}
      <g opacity={ballAlpha}>
        <Ball cx={157} cy={80} />
      </g>
      <Batter pose={pose} />
    </>
  );
}

/** Stage 2 — Contact+: bat converges on ball, impact burst */
function StageContact({ p }: { p: number }) {
  const pose = lerpPose(EARLY, CONTACT, p);
  const [bx, by] = [pose[2], pose[3]];

  const ballX = lerp(157, bx, clamp01(p * 1.4));
  const ballY = lerp(80, by,  clamp01(p * 1.4));
  const impactP = sub(p, 0.65, 1.0);

  const RAYS = [0, 40, 80, 130, 180, 225, 270, 315];

  return (
    <>
      <Ball cx={ballX} cy={ballY} />
      {RAYS.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const r1 = 9, r2 = lerp(9, 20, impactP);
        return (
          <line key={deg}
            x1={bx + Math.cos(rad) * r1} y1={by + Math.sin(rad) * r1}
            x2={bx + Math.cos(rad) * r2} y2={by + Math.sin(rad) * r2}
            stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round"
            opacity={clamp01(impactP * 1.5) * 0.6} />
        );
      })}
      <Batter pose={pose} />
    </>
  );
}

/** Stage 3 — Power+: follow-through, ball in flight on parabolic arc */
function StagePower({ p }: { p: number }) {
  const pose = lerpPose(CONTACT, THROUGH, p);

  const sx = 186, sy = 78, ex = 272, ey = 22;
  const ballX = lerp(sx, ex, p);
  const ballY = lerp(sy, ey, p) - Math.sin(clamp01(p) * Math.PI) * 20;

  const tp = Math.max(0, p - 0.15);
  const trailX = lerp(sx, ex, tp);
  const trailY = lerp(sy, ey, tp) - Math.sin(clamp01(tp) * Math.PI) * 20;

  return (
    <>
      {/* Trajectory arc (dashed) */}
      <path
        d={`M${sx},${sy} Q${(sx + ex) / 2},${Math.min(sy, ey) - 30} ${ballX},${ballY}`}
        fill="none" stroke="var(--dimmer)" strokeWidth={1.5}
        strokeDasharray="3 4" opacity={0.5} />
      {/* Trail */}
      {p > 0.12 && (
        <line x1={trailX} y1={trailY} x2={ballX} y2={ballY}
          stroke="var(--dimmer)" strokeWidth={2.5} strokeLinecap="round" opacity={0.3} />
      )}
      <Ball cx={ballX} cy={ballY} />
      <Batter pose={pose} />
    </>
  );
}

export default function BatterAnimation({
  stage,
  progress,
  label,
}: {
  stage: Stage;
  progress: number;
  label: string;
}) {
  const p = easeOut3(progress);

  return (
    <div className="mt-5 overflow-hidden rounded-[10px] border border-[var(--rule)] bg-[var(--track)]">
      <svg viewBox="0 0 300 165" width="100%" style={{ display: "block" }}
        role="img" aria-label={label}>
        {/* Ground */}
        <line x1={15} y1={148} x2={285} y2={148} stroke="var(--rule)" strokeWidth={1.5} />
        {/* Home plate */}
        <path d="M143,148 L167,148 L167,156 L155,163 L143,156 Z"
          fill="none" stroke="var(--dimmer)" strokeWidth={1.5} />

        {stage === 0 && <StageDecision p={p} />}
        {stage === 1 && <StageTiming p={p} />}
        {stage === 2 && <StageContact p={p} />}
        {stage === 3 && <StagePower p={p} />}
      </svg>
    </div>
  );
}
