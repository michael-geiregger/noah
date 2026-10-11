"use client";

import { Tile } from "@/components/Tile";
import { useI18n } from "@/lib/i18n";

export default function PlayPage() {
  const { t } = useI18n();
  return (
    <>
      <h1>🎮 {t("playTitle")}</h1>
      <p className="muted">{t("playIntro")}</p>

      <h2 className="section-title">🔬 {t("simSection")}</h2>
      <div className="grid">
        <Tile href="/spielen/planeten" icon="🪐" title={t("simGravity")} sub={t("simGravitySub")} variant="blue" />
        <Tile href="/spielen/wippe" icon="⚖️" title={t("simLever")} sub={t("simLeverSub")} variant="yellow" />
        <Tile href="/spielen/stromkreis" icon="💡" title={t("simCircuit")} sub={t("simCircuitSub")} variant="blue" />
      </div>

      <h2 className="section-title">🧠 {t("brainSection")}</h2>
      <div className="grid">
        <Tile href="/spielen/quiz" icon="❓" title={t("tileQuiz")} sub={t("tileQuizSub")} variant="yellow" />
        <Tile href="/spielen/raetsel" icon="🧩" title={t("tileRiddles")} sub={t("tileRiddlesSub")} variant="blue" />
      </div>
    </>
  );
}
