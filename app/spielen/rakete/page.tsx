"use client";

import { useEffect, useRef, useState } from "react";
import { BackLink } from "@/components/BackLink";
import { useI18n, type DictKey, type Tri } from "@/lib/i18n";
import { audio, beep, jingle, rocketSound, speak, stopSpeaking } from "@/lib/sound";

// Spielfeld (SVG-Einheiten)
const W = 400;
const H = 260;
const GROUND = 230;
const PAD_X = 34;
const PAD_W = 36;
const G = 100; // Schwerkraft im Spiel

const COUNTDOWN: Tri[] = [
  { de: "Drei", en: "Three", ja: "さん" },
  { de: "Zwei", en: "Two", ja: "に" },
  { de: "Eins", en: "One", ja: "いち" },
  { de: "Start!", en: "Liftoff!", ja: "はっしゃ！" },
];

type Phase = "ready" | "countdown" | "flying" | "done";
type Point = { x: number; y: number };
type Result = { stars: number; msg: DictKey; hint?: DictKey };

const randomTarget = () => 170 + Math.round(Math.random() * 190);
const speedFromFuel = (fuel: number) => 60 + fuel * 14.5;

const STAR_FIELD = [...Array(40)].map((_, i) => ({ x: (i * 97) % W, y: (i * 53) % 200, r: i % 3 === 0 ? 1.4 : 0.8 }));

export default function RocketPage() {
  const { t, lang } = useI18n();
  const [fuel, setFuel] = useState(6);
  const [angle, setAngle] = useState(50);
  const [target, setTarget] = useState(300);
  const [phase, setPhase] = useState<Phase>("ready");
  const [count, setCount] = useState(3);
  const [pos, setPos] = useState<Point>({ x: PAD_X, y: 0 });
  const [heading, setHeading] = useState(90);
  const [trail, setTrail] = useState<Point[]>([]);
  const [lastTrail, setLastTrail] = useState<Point[]>([]);
  const [flightTime, setFlightTime] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [totalStars, setTotalStars] = useState(0);
  const [sound, setSound] = useState(true);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const frame = useRef<number | null>(null);
  const stopEngine = useRef<() => void>(() => {});

  useEffect(() => {
    setTarget(randomTarget());
    try {
      setTotalStars(Number(localStorage.getItem("tpwe-rocket-stars")) || 0);
      setSound(localStorage.getItem("tpwe-sound") !== "off");
    } catch {}
    return () => {
      timers.current.forEach(clearTimeout);
      if (frame.current) cancelAnimationFrame(frame.current);
      stopEngine.current();
      stopSpeaking();
    };
  }, []);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    try {
      localStorage.setItem("tpwe-sound", next ? "on" : "off");
    } catch {}
  };

  const say = (i: number) => {
    setCount(3 - i);
    if (!sound) return;
    beep(i === 3 ? 1320 : 880, i === 3 ? 0.35 : 0.15, 0.2, "square");
    speak(COUNTDOWN[i][lang], lang);
  };

  const start = () => {
    if (phase === "countdown" || phase === "flying") return;
    if (sound) audio(); // Ton freischalten, solange wir im Klick sind
    if (trail.length) setLastTrail(trail);
    setTrail([]);
    setResult(null);
    setPos({ x: PAD_X, y: 0 });
    setHeading(90);
    setFlightTime(0);
    setPhase("countdown");
    say(0);
    timers.current = [
      setTimeout(() => say(1), 1000),
      setTimeout(() => say(2), 2000),
      setTimeout(() => {
        say(3);
        launch();
      }, 3000),
    ];
  };

  const launch = () => {
    setPhase("flying");
    if (sound) stopEngine.current = rocketSound();
    const v = speedFromFuel(fuel);
    const rad = (angle * Math.PI) / 180;
    const vx = v * Math.cos(rad);
    const vy = v * Math.sin(rad);
    const t0 = performance.now();
    const points: Point[] = [];

    const tick = (now: number) => {
      const s = (now - t0) / 1000;
      const x = PAD_X + vx * s;
      const y = vy * s - (G * s * s) / 2;
      const dirY = vy - G * s;
      setHeading((Math.atan2(dirY, vx) * 180) / Math.PI);
      setFlightTime(s);

      if ((y <= 0 && s > 0.1) || x > W + 30) {
        const landX = y <= 0 ? PAD_X + vx * ((2 * vy) / G) : x;
        setPos({ x: landX, y: 0 });
        land(landX);
        return;
      }
      points.push({ x, y });
      setPos({ x, y });
      setTrail([...points]);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const land = (landX: number) => {
    stopEngine.current();
    setPhase("done");
    const dx = landX - target;
    const d = Math.abs(dx);
    let r: Result;
    if (d <= 6) r = { stars: 3, msg: "rocketPerfect" };
    else if (d <= PAD_W / 2) r = { stars: 2, msg: "rocketGood" };
    else if (d <= 40) r = { stars: 1, msg: "rocketClose", hint: dx < 0 ? "rocketTooShort" : "rocketTooFar" };
    else r = { stars: 0, msg: "rocketMiss", hint: dx < 0 ? "rocketTooShort" : "rocketTooFar" };
    setResult(r);
    if (r.stars) {
      setTotalStars((old) => {
        const next = old + r.stars;
        try {
          localStorage.setItem("tpwe-rocket-stars", String(next));
        } catch {}
        return next;
      });
    }
    if (sound) {
      if (r.stars >= 2) jingle([523, 659, 784, 1047]);
      else if (r.stars === 1) jingle([523, 659]);
      else jingle([330, 262], 0.2);
    }
  };

  const newTarget = () => {
    setTarget(randomTarget());
    setResult(null);
    setTrail([]);
    setLastTrail([]);
    setPos({ x: PAD_X, y: 0 });
    setHeading(90);
    setPhase("ready");
  };

  const busy = phase === "countdown" || phase === "flying";
  const rocketScreenY = GROUND - pos.y;
  const toPath = (pts: Point[]) => pts.map((p) => `${p.x.toFixed(1)},${(GROUND - p.y).toFixed(1)}`).join(" ");

  return (
    <>
      <BackLink href="/spielen" />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>🚀 {t("simRocket")}</h1>
        <div className="row">
          <span className="pill">
            ⭐ {totalStars} {t("rocketStars")}
          </span>
          <button className="btn secondary small" onClick={toggleSound} aria-label={sound ? t("soundOff") : t("soundOn")}>
            {sound ? "🔊" : "🔇"}
          </button>
        </div>
      </div>
      <p className="muted">{t("rocketHelp")}</p>

      <div className="card form">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", borderRadius: 14, display: "block" }}>
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0b1026" />
              <stop offset="1" stopColor="#24346b" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#sky)" />
          {STAR_FIELD.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.8} />
          ))}
          <circle cx={350} cy={40} r={16} fill="#ffd43b" opacity={0.9} />

          {/* Boden */}
          <rect y={GROUND} width={W} height={H - GROUND} fill="#9aa0b4" />
          {[60, 140, 250, 330].map((x) => (
            <ellipse key={x} cx={x} cy={GROUND + 12} rx={12} ry={4} fill="#7d8299" />
          ))}

          {/* Startrampe */}
          <rect x={PAD_X - 14} y={GROUND - 4} width={28} height={4} fill="#5b6785" />
          <rect x={PAD_X - 20} y={GROUND - 40} width={3} height={36} fill="#5b6785" />

          {/* Landeplattform */}
          <rect x={target - PAD_W / 2} y={GROUND - 5} width={PAD_W} height={5} rx={2} fill="#f5c518" />
          <rect x={target - 1.5} y={GROUND - 6} width={3} height={6} fill="#1f9d55" />
          <line x1={target + PAD_W / 2 - 3} x2={target + PAD_W / 2 - 3} y1={GROUND - 5} y2={GROUND - 26} stroke="#fff" strokeWidth={1.5} />
          <polygon points={`${target + PAD_W / 2 - 3},${GROUND - 26} ${target + PAD_W / 2 + 9},${GROUND - 22} ${target + PAD_W / 2 - 3},${GROUND - 18}`} fill="#d64545" />

          {/* Flugbahnen */}
          {lastTrail.length > 1 && <polyline points={toPath(lastTrail)} fill="none" stroke="#ffffff55" strokeWidth={1.5} strokeDasharray="3 4" />}
          {trail.length > 1 && <polyline points={toPath(trail)} fill="none" stroke="#ffb347" strokeWidth={2} strokeDasharray="4 3" />}

          {/* Rauch beim Start */}
          {phase === "flying" && flightTime < 1.2 &&
            [0, 1, 2, 3].map((i) => (
              <circle
                key={i}
                cx={PAD_X + (i - 1.5) * 10 * (1 + flightTime)}
                cy={GROUND - 6}
                r={6 + flightTime * 10}
                fill="#e6e6e6"
                opacity={Math.max(0, 0.7 - flightTime * 0.55)}
              />
            ))}

          {/* Rakete */}
          <g transform={`translate(${pos.x} ${rocketScreenY - 11}) rotate(${90 - heading})`}>
            {phase === "flying" && (
              <polygon points="-4,9 0,22 4,9" fill="#ff7b00">
                <animate attributeName="points" values="-4,9 0,22 4,9;-4,9 0,16 4,9;-4,9 0,22 4,9" dur="0.15s" repeatCount="indefinite" />
              </polygon>
            )}
            <path d="M0,-16 C6,-10 6,0 5,9 L-5,9 C-6,0 -6,-10 0,-16 Z" fill="#f1f4fb" stroke="#1f2a44" strokeWidth={1} />
            <circle cx={0} cy={-4} r={2.6} fill="#2f8fd8" stroke="#1f2a44" strokeWidth={0.8} />
            <path d="M-5,4 L-9,11 L-5,9 Z M5,4 L9,11 L5,9 Z" fill="#d64545" />
          </g>

          {/* Countdown */}
          {phase === "countdown" && (
            <text x={W / 2} y={H / 2 + 10} fontSize="64" textAnchor="middle" fill="#ffd43b" fontWeight={900}>
              {count}
            </text>
          )}
          {result && (
            <text x={W / 2} y={60} fontSize="30" textAnchor="middle">
              {"⭐".repeat(result.stars) || "💨"}
            </text>
          )}
        </svg>

        {result && (
          <div style={{ textAlign: "center" }}>
            <p className={result.stars >= 2 ? "ok" : ""} style={{ fontSize: "1.3rem", fontWeight: 900, margin: 0 }}>
              {t(result.msg)}
            </p>
            {result.hint && <p className="muted" style={{ margin: 0 }}>{t(result.hint)}</p>}
          </div>
        )}

        <label className="field">
          ⛽ {t("rocketFuel")}: {fuel}
          <input type="range" min={1} max={10} value={fuel} disabled={busy} onChange={(e) => setFuel(Number(e.target.value))} />
        </label>
        <label className="field">
          📐 {t("rocketAngle")}: {angle}°
          <input type="range" min={20} max={80} value={angle} disabled={busy} onChange={(e) => setAngle(Number(e.target.value))} />
        </label>

        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn yellow" onClick={start} disabled={busy} style={{ fontSize: "1.3rem", padding: "12px 28px" }}>
            🚀 {t("rocketStart")}
          </button>
          <button className="btn secondary" onClick={newTarget} disabled={busy}>
            🎯 {t("rocketNewTarget")}
          </button>
        </div>
        <p className="muted" style={{ margin: 0 }}>💡 {t("rocketExplain")}</p>
      </div>
    </>
  );
}
