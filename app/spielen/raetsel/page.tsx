"use client";

import { useState } from "react";
import { BackLink } from "@/components/BackLink";
import { RIDDLES } from "@/lib/content";
import { useI18n } from "@/lib/i18n";

export default function RiddlesPage() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <>
      <BackLink href="/spielen" />
      <h1>🧩 {t("tileRiddles")}</h1>
      <div className="grid-lg">
        {RIDDLES.map((r, i) => (
          <div key={i} className="card form">
            <div style={{ fontSize: "2.4rem" }}>{r.icon}</div>
            <p style={{ fontWeight: 800, margin: 0 }}>{r.q[lang]}</p>
            {open.has(i) && <p className="ok" style={{ margin: 0 }}>💡 {r.a[lang]}</p>}
            <div>
              <button className="btn secondary small" onClick={() => toggle(i)}>
                {open.has(i) ? t("riddleHide") : t("riddleShow")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
