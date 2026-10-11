"use client";

import { useState } from "react";
import { BackLink } from "@/components/BackLink";
import { useI18n } from "@/lib/i18n";

const SLOTS = 4; // Plätze pro Seite
const MAX = 4; // max. Gewichte pro Platz
const W = 400;
const PIVOT_X = 200;
const PIVOT_Y = 190;
const GAP = 42;

export default function SeesawPage() {
  const { t } = useI18n();
  const [left, setLeft] = useState<number[]>(Array(SLOTS).fill(0));
  const [right, setRight] = useState<number[]>(Array(SLOTS).fill(0));

  // Drehmoment = Gewicht × Abstand
  const torque = (arr: number[]) => arr.reduce((sum, n, i) => sum + n * (i + 1), 0);
  const tl = torque(left);
  const tr = torque(right);
  const angle = Math.max(-16, Math.min(16, (tr - tl) * 2));

  const add = (side: "l" | "r", i: number) => {
    const set = side === "l" ? setLeft : setRight;
    set((arr) => arr.map((n, j) => (j === i ? (n + 1) % (MAX + 1) : n)));
  };

  const status = tl === tr ? t("leverBalanced") : tl > tr ? t("leverLeft") : t("leverRight");

  const slot = (side: "l" | "r", i: number, count: number) => {
    const x = side === "l" ? -(i + 1) * GAP : (i + 1) * GAP;
    return (
      <g key={side + i} onClick={() => add(side, i)} style={{ cursor: "pointer" }}>
        <rect x={x - 18} y={-14 - MAX * 22} width={36} height={MAX * 22 + 14} fill="transparent" />
        <circle cx={x} cy={0} r={6} fill="#f5c518" stroke="#1f2a44" strokeWidth={1.5} />
        {[...Array(count)].map((_, k) => (
          <g key={k}>
            <rect x={x - 15} y={-8 - (k + 1) * 22} width={30} height={20} rx={4} fill="#2f8fd8" stroke="#1f2a44" strokeWidth={1.5} />
            <text x={x} y={-8 - (k + 1) * 22 + 15} fontSize="11" textAnchor="middle" fill="#fff" fontWeight={800}>
              1
            </text>
          </g>
        ))}
        <text x={x} y={24} fontSize="12" textAnchor="middle" fill="currentColor" fontWeight={700}>
          {i + 1}
        </text>
      </g>
    );
  };

  return (
    <>
      <BackLink href="/spielen" />
      <h1>⚖️ {t("simLever")}</h1>
      <p className="muted">{t("leverHelp")}</p>

      <div className="card form">
        <svg viewBox={`0 70 ${W} 190`} style={{ width: "100%", maxWidth: 620, alignSelf: "center", color: "var(--text)" }}>
          <polygon points={`${PIVOT_X},${PIVOT_Y + 4} ${PIVOT_X - 30},${PIVOT_Y + 60} ${PIVOT_X + 30},${PIVOT_Y + 60}`} fill="#f5c518" stroke="#1f2a44" strokeWidth={2} />
          <rect x={20} y={PIVOT_Y + 60} width={W - 40} height={6} rx={3} fill="var(--border)" />
          <g transform={`translate(${PIVOT_X} ${PIVOT_Y}) rotate(${angle})`} style={{ transition: "transform 0.5s" }}>
            <rect x={-SLOTS * GAP - 24} y={-4} width={(SLOTS * GAP + 24) * 2} height={10} rx={5} fill="#a5754a" stroke="#1f2a44" strokeWidth={1.5} />
            {left.map((n, i) => slot("l", i, n))}
            {right.map((n, i) => slot("r", i, n))}
          </g>
        </svg>

        <p className={tl === tr ? "ok" : ""} style={{ fontSize: "1.3rem", fontWeight: 900, textAlign: "center", margin: 0 }}>
          {status}
        </p>
        <p className="muted" style={{ textAlign: "center", margin: 0 }}>
          ⬅️ {tl} &nbsp;|&nbsp; {tr} ➡️
        </p>
        <div style={{ textAlign: "center" }}>
          <button
            className="btn secondary"
            onClick={() => {
              setLeft(Array(SLOTS).fill(0));
              setRight(Array(SLOTS).fill(0));
            }}
          >
            🧹 {t("leverClear")}
          </button>
        </div>
      </div>
    </>
  );
}
