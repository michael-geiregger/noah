"use client";

import { useEffect, useState } from "react";
import { getApi, type CallJoin, type CallStatus } from "@/lib/data";
import { useI18n, type DictKey } from "@/lib/i18n";

/** Startet einen Video-Raum (Daily) im Fenster. Erst nach Klick – Kamera nur mit Erlaubnis. */
export function useCall() {
  const { lang } = useI18n();
  const [call, setCall] = useState<CallJoin | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<DictKey | null>(null);

  const join = async (kind: "group" | "private", requestId?: string) => {
    setBusy(true);
    setError(null);
    try {
      setCall(await getApi().joinCall(kind, lang, requestId));
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setError(m === "closed" ? "frClosed" : m === "not-configured" ? "frNotConfigured" : m === "demo-video" ? "frDemo" : "errorGeneric");
    } finally {
      setBusy(false);
    }
  };

  return { call, busy, error, join, leave: () => setCall(null) };
}

export function VideoRoom({ call, onLeave }: { call: CallJoin; onLeave: () => void }) {
  const { t, lang } = useI18n();

  // Beim Ablauf automatisch schließen (Daily wirft sowieso alle raus)
  useEffect(() => {
    const ms = new Date(call.endsAt).getTime() - Date.now();
    const timer = setTimeout(onLeave, Math.max(0, ms) + 5000);
    return () => clearTimeout(timer);
  }, [call.endsAt, onLeave]);

  return (
    <div className="form video-room">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="pill">
          ⏰ {t("chEnds")} {new Date(call.endsAt).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })}
        </span>
        <button className="btn danger" onClick={onLeave}>
          🚪 {t("frLeave")}
        </button>
      </div>
      <iframe
        title="TPWE Video"
        src={`${call.url}?t=${encodeURIComponent(call.token)}`}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="video-call"
      />
    </div>
  );
}

/** "in 2 Tg. 3 Std. 5 Min." */
export function Countdown({ to }: { to: Date }) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  let mins = Math.max(0, Math.ceil((to.getTime() - now) / 60_000));
  const d = Math.floor(mins / 1440);
  mins -= d * 1440;
  const h = Math.floor(mins / 60);
  mins -= h * 60;
  return (
    <span>
      {t("frIn")} {d > 0 && `${d} ${t("frDays")} `}
      {(d > 0 || h > 0) && `${h} ${t("frHours")} `}
      {mins} {t("frMinutes")}
    </span>
  );
}

export const CALL_STATUS: Record<CallStatus, { icon: string; label: DictKey }> = {
  neu: { icon: "⏳", label: "pcStatusNeu" },
  bestaetigt: { icon: "✅", label: "pcStatusBestaetigt" },
  abgelehnt: { icon: "🙁", label: "pcStatusAbgelehnt" },
  erledigt: { icon: "✔️", label: "pcStatusErledigt" },
};

/** Aktualisiert sich jede halbe Minute, damit "offen/geschlossen" stimmt. */
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

