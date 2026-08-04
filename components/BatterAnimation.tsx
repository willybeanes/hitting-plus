"use client";

type Stage = 0 | 1 | 2 | 3;

// Rotation is measured clockwise from straight up (0deg), around the pivot.
// Loaded near the back shoulder, then sweeps through contact to follow-through.
const BAT_ANGLE: Record<Stage, number> = { 0: -30, 1: 40, 2: 130, 3: 220 };
const BACK_LEG_ANGLE: Record<Stage, number> = { 0: 0, 1: -5, 2: -14, 3: -28 };
const FRONT_LEG_ANGLE: Record<Stage, number> = { 0: 0, 1: 8, 2: 18, 3: 22 };

const EASE = "cubic-bezier(0.22,1,0.36,1)";

export default function BatterAnimation({
  stage,
  revealed,
  label,
}: {
  stage: Stage;
  revealed: boolean;
  label: string;
}) {
  // Sits in the resting stance until this step is actually reached while
  // scrolling, then sweeps into its pose -- the same reveal signal that
  // already lights up the step dot and the sidebar bars.
  const shown: Stage = revealed ? stage : 0;
  const showBall = shown >= 2;
  const ballFlying = shown === 3;

  return (
    <div className="mt-5 overflow-hidden rounded-[10px] border border-[var(--rule)] bg-[var(--track)]">
      <svg viewBox="0 0 300 150" width="100%" height="140" role="img" aria-label={label}>
        <line x1="20" y1="132" x2="280" y2="132" stroke="var(--rule)" strokeWidth={1.5} />
        <path d="M 138 132 L 162 132 L 162 140 L 150 148 L 138 140 Z" fill="var(--rule)" />

        <circle cx="150" cy="38" r="9" fill="none" stroke="var(--dim)" strokeWidth={2} />
        <line x1="150" y1="47" x2="150" y2="86" stroke="var(--dim)" strokeWidth={2} />

        <g
          style={{
            transform: `rotate(${BACK_LEG_ANGLE[shown]}deg)`,
            transformOrigin: "150px 86px",
            transition: `transform 700ms ${EASE}`,
          }}
        >
          <line x1="150" y1="86" x2="140" y2="132" stroke="var(--dim)" strokeWidth={2} strokeLinecap="round" />
        </g>
        <g
          style={{
            transform: `rotate(${FRONT_LEG_ANGLE[shown]}deg)`,
            transformOrigin: "150px 86px",
            transition: `transform 700ms ${EASE}`,
          }}
        >
          <line x1="150" y1="86" x2="162" y2="132" stroke="var(--dim)" strokeWidth={2} strokeLinecap="round" />
        </g>

        <g
          style={{
            transform: `rotate(${BAT_ANGLE[shown]}deg)`,
            transformOrigin: "150px 52px",
            transition: `transform 700ms ${EASE}`,
          }}
        >
          <line x1="150" y1="52" x2="150" y2="10" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />
          <circle cx="150" cy="52" r="3" fill="var(--dim)" />
        </g>

        <line
          x1="195"
          y1="88"
          x2="262"
          y2="20"
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeDasharray="3 4"
          style={{ opacity: ballFlying ? 0.5 : 0, transition: `opacity 500ms ease 250ms` }}
        />
        <g
          style={{
            transform: showBall
              ? ballFlying
                ? "translate(67px, -68px) scale(1)"
                : "translate(0px, 0px) scale(1)"
              : "translate(0px, 0px) scale(0)",
            transformOrigin: "195px 88px",
            transition: `transform 700ms ${EASE}`,
          }}
        >
          <circle cx="195" cy="88" r="4" fill="var(--text)" />
        </g>
      </svg>
    </div>
  );
}
