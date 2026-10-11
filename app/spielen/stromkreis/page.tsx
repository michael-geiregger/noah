"use client";

import { useState } from "react";
import { BackLink } from "@/components/BackLink";
import { useI18n, type Tri } from "@/lib/i18n";

const MATERIALS: { icon: string; name: Tri; conducts: boolean }[] = [
  { icon: "🪙", name: { de: "Münze", en: "Coin", ja: "コイン" }, conducts: true },
  { icon: "🥄", name: { de: "Metall-Löffel", en: "Metal spoon", ja: "金属のスプーン" }, conducts: true },
  { icon: "✏️", name: { de: "Bleistiftmine", en: "Pencil lead", ja: "えんぴつのしん" }, conducts: true },
  { icon: "🪵", name: { de: "Holz", en: "Wood", ja: "木" }, conducts: false },
  { icon: "🧽", name: { de: "Radiergummi", en: "Eraser", ja: "けしゴム" }, conducts: false },
  { icon: "📏", name: { de: "Plastik-Lineal", en: "Plastic ruler", ja: "プラスチックのじょうぎ" }, conducts: false },
  { icon: "🧻", name: { de: "Papier", en: "Paper", ja: "紙" }, conducts: false },
];

export default function CircuitPage() {
  const { t, lang } = useI18n();
  const [mat, setMat] = useState<number | null>(null);
  const [on, setOn] = useState(false);

  const m = mat === null ? null : MATERIALS[mat];
  const lit = on && !!m?.conducts;
  const wire = lit ? "#f5c518" : "#5b6785";

  return (
    <>
      <BackLink href="/spielen" />
      <h1>💡 {t("simCircuit")}</h1>
      <p className="muted">{t("circuitHelp")}</p>

      <div className="card form">
        <svg viewBox="0 0 400 260" style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}>
          {/* Kabel */}
          <polyline points="60,130 60,40 340,40 340,130" fill="none" stroke={wire} strokeWidth={6} strokeLinejoin="round" />
          <polyline points="60,170 60,220 165,220" fill="none" stroke={wire} strokeWidth={6} />
          <polyline points="235,220 340,220 340,170" fill="none" stroke={wire} strokeWidth={6} />
          {/* Batterie */}
          <rect x={40} y={125} width={40} height={50} rx={6} fill="#1f2a44" />
          <rect x={52} y={118} width={16} height={8} fill="#1f2a44" />
          <text x={60} y={155} fontSize="14" textAnchor="middle" fill="#f5c518" fontWeight={900}>+ −</text>
          {/* Lampe */}
          {lit && <circle cx={200} cy={40} r={42} fill="#ffe066" opacity={0.55} />}
          <circle cx={200} cy={40} r={22} fill={lit ? "#ffe066" : "#e6e6e6"} stroke="#1f2a44" strokeWidth={2} />
          <text x={200} y={47} fontSize="20" textAnchor="middle">💡</text>
          {/* Schalter */}
          <rect x={320} y={125} width={40} height={50} rx={8} fill={on ? "#1f9d55" : "#d64545"} />
          <text x={340} y={155} fontSize="12" textAnchor="middle" fill="#fff" fontWeight={900}>
            {on ? t("circuitOn") : t("circuitOff")}
          </text>
          {/* Lücke */}
          <rect x={165} y={198} width={70} height={44} rx={10} fill="none" stroke="#5b6785" strokeWidth={2} strokeDasharray="5 5" />
          <text x={200} y={230} fontSize="28" textAnchor="middle">{m?.icon ?? "❔"}</text>
        </svg>

        <p style={{ textAlign: "center", fontWeight: 900, fontSize: "1.2rem", margin: 0 }} className={lit ? "ok" : ""}>
          {m ? `${m.name[lang]}: ${m.conducts ? t("circuitConducts") : t("circuitInsulates")}` : t("circuitNothing")}
        </p>

        <div className="row" style={{ justifyContent: "center" }}>
          <button className={`btn ${on ? "" : "yellow"}`} onClick={() => setOn(!on)}>
            🔌 {t("circuitSwitch")}: {on ? t("circuitOn") : t("circuitOff")}
          </button>
        </div>

        <div className="row" style={{ justifyContent: "center" }}>
          {MATERIALS.map((mm, i) => (
            <button key={i} className={`btn small ${mat === i ? "" : "secondary"}`} onClick={() => setMat(i)}>
              {mm.icon} {mm.name[lang]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
