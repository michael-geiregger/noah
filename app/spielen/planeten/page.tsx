"use client";

import { useEffect, useRef, useState } from "react";
import { BackLink } from "@/components/BackLink";
import { useI18n, type DictKey } from "@/lib/i18n";

const PLACES: { key: DictKey; g: number; icon: string; sky: string; ground: string }[] = [
  { key: "earth", g: 9.81, icon: "🌍", sky: "#bfe4ff", ground: "#5fb760" },
  { key: "moon", g: 1.62, icon: "🌕", sky: "#0f1630", ground: "#b9b9c4" },
  { key: "mars", g: 3.71, icon: "🔴", sky: "#f2b38a", ground: "#c1552c" },
  { key: "jupiter", g: 24.79, icon: "🪐", sky: "#e9c79a", ground: "#a5754a" },
];

const SPEED = 3.1; // Absprung-Tempo eines Kindes in m/s
const W = 360;
const H = 330;
const GROUND = 290;
const PX_PER_M = 80;

export default function PlanetJump() {
  const { t } = useI18n();
  const [place, setPlace] = useState(0);
  const [y, setY] = useState(0);
  const [jumping, setJumping] = useState(false);
  const frame = useRef<number | null>(null);

  const p = PLACES[place];
  const maxHeight = (SPEED * SPEED) / (2 * p.g);

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); }, []);

  const jump = () => {
    if (jumping) return;
    setJumping(true);
    const start = performance.now();
    const tick = (now: number) => {
      const s = (now - start) / 1000;
      const h = SPEED * s - (p.g * s * s) / 2;
      if (h <= 0 && s > 0.05) {
        setY(0);
        setJumping(false);
        return;
      }
      setY(Math.max(0, h));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const markers = [0.5, 1, 1.5, 2, 2.5, 3];

  return (
    <>
      <BackLink href="/spielen" />
      <h1>🪐 {t("simGravity")}</h1>
      <p className="muted">{t("gravityExplain")}</p>

      <div className="card form">
        <strong>{t("gravityPick")}</strong>
        <div className="row">
          {PLACES.map((pl, i) => (
            <button
              key={pl.key}
              className={`btn ${i === place ? "" : "secondary"}`}
              onClick={() => !jumping && setPlace(i)}
            >
              {pl.icon} {t(pl.key)}
            </button>
          ))}
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 560, borderRadius: 14, alignSelf: "center" }}>
          <rect width={W} height={H} fill={p.sky} />
          {p.key === "moon" &&
            [...Array(18)].map((_, i) => (
              <circle key={i} cx={(i * 73) % W} cy={(i * 41) % 200} r={1.4} fill="#fff" />
            ))}
          {markers.map((m) => (
            <g key={m}>
              <line x1={W - 70} x2={W} y1={GROUND - m * PX_PER_M} y2={GROUND - m * PX_PER_M} stroke="#ffffff99" strokeDasharray="4 4" />
              <text x={W - 6} y={GROUND - m * PX_PER_M - 4} fontSize="12" textAnchor="end" fill="#1f2a44" fontWeight={700}>
                {m} m
              </text>
            </g>
          ))}
          <line x1={0} x2={W - 70} y1={GROUND - maxHeight * PX_PER_M} y2={GROUND - maxHeight * PX_PER_M} stroke="#f5c518" strokeWidth={3} />
          <rect y={GROUND} width={W} height={H - GROUND} fill={p.ground} />
          <text x={150} y={GROUND - y * PX_PER_M - 4} fontSize="54" textAnchor="middle">
            🧒
          </text>
        </svg>

        <div className="row" style={{ justifyContent: "space-between" }}>
          <button className="btn yellow" onClick={jump} disabled={jumping} style={{ fontSize: "1.2rem" }}>
            🦘 {t("gravityJump")}
          </button>
          <div>
            <div>
              {t("gravityHeight")}: <strong>{maxHeight.toFixed(2)} m</strong>
            </div>
            <div className="muted">
              {t("gravityPull")}: {p.g} m/s²
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
