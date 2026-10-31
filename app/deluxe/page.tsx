"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { notifyAuthChanged } from "@/lib/adminEvents";
import { getApi } from "@/lib/data";
import { useI18n, type DictKey } from "@/lib/i18n";
import { jingle } from "@/lib/sound";
import { useAccount } from "@/lib/useAccount";
import { formatPrice } from "@/lib/useData";

const PERKS: { icon: string; title: DictKey; sub: DictKey; soon?: boolean }[] = [
  { icon: "📡", title: "dlxPerkRadio", sub: "dlxPerkRadioSub", soon: true },
  { icon: "📞", title: "dlxPerkPrivate", sub: "dlxPerkPrivateSub", soon: true },
  { icon: "💎", title: "dlxPerkBadge", sub: "dlxPerkBadgeSub" },
  { icon: "🎁", title: "dlxPerkMore", sub: "dlxPerkMoreSub" },
];

export default function DeluxePage() {
  return (
    <Suspense>
      <Deluxe />
    </Suspense>
  );
}

function Deluxe() {
  const { t, lang } = useI18n();
  const api = getApi();
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const cancelled = params.get("cancelled");
  const { profile, membership, isDeluxe, loading, reload } = useAccount();

  const [consentStart, setConsentStart] = useState(false);
  const [consentAdult, setConsentAdult] = useState(false);
  const [state, setState] = useState<"idle" | "redirecting" | "checking" | "welcome">("idle");
  const [error, setError] = useState<DictKey | null>(null);
  const confirmed = useRef(false);

  // Zurück von der Bezahlseite: Zahlung prüfen und speichern
  useEffect(() => {
    if (!sessionId || !profile || confirmed.current) return;
    confirmed.current = true;
    setState("checking");
    api
      .confirmCheckout(sessionId)
      .then(async (ok) => {
        if (ok) {
          setState("welcome");
          jingle([523, 659, 784, 1047, 1319]);
          await reload();
          notifyAuthChanged();
        } else {
          setState("idle");
          setError("dlxNotPaid");
        }
      })
      .catch(() => {
        setState("idle");
        setError("dlxNotPaid");
      });
  }, [sessionId, profile, api, reload]);

  const buy = async () => {
    setError(null);
    setState("redirecting");
    try {
      const url = await api.startCheckout(lang);
      window.location.href = url;
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setState("idle");
      if (m === "already-member") await reload();
      else setError(m === "not-configured" ? "dlxNotConfigured" : "errorGeneric");
    }
  };

  return (
    <>
      <section className="hero">
        <span className="badge">💎 DELUXE</span>
        <h1>{t("dlxTitle")}</h1>
        <p>{t("dlxIntro")}</p>
      </section>

      {state === "welcome" && (
        <div className="card" style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: "4rem" }}>🎉💎🚀</div>
          <h2>{t("dlxWelcome")}</h2>
        </div>
      )}
      {cancelled && !isDeluxe && <p className="card muted">{t("dlxCancelled")}</p>}

      <div className="grid">
        {PERKS.map((p) => (
          <div key={p.title} className="tile yellow" style={{ minHeight: 0 }}>
            <span className="icon">{p.icon}</span>
            <span className="title">{t(p.title)}</span>
            <span className="sub">{t(p.sub)}</span>
            {p.soon && <span className="pill" style={{ alignSelf: "flex-start" }}>⏳ {t("dlxSoon")}</span>}
          </div>
        ))}
      </div>

      <div className="card deluxe-buy">
        {loading || state === "checking" ? (
          <p>{state === "checking" ? t("dlxChecking") : t("loading")}</p>
        ) : isDeluxe && membership ? (
          <>
            <div style={{ fontSize: "3rem" }}>💎</div>
            <h2>{t("dlxIsMember")}</h2>
            <p className="muted">
              {t("dlxSince")} {new Date(membership.paid_at).toLocaleDateString(lang)}
            </p>
            <Link href="/konto" className="btn">
              🪪 {t("navAccount")}
            </Link>
          </>
        ) : (
          <>
            <div className="price" style={{ fontSize: "2.4rem" }}>{formatPrice(10.5, lang)}</div>
            <p className="muted" style={{ marginTop: 0 }}>{t("dlxOnce")}</p>
            {!profile ? (
              <Link href="/konto?next=/deluxe" className="btn yellow" style={{ fontSize: "1.2rem" }}>
                🪪 {t("dlxLoginFirst")}
              </Link>
            ) : (
              <div className="form" style={{ textAlign: "left" }}>
                {api.mode === "demo" && <p className="muted">🧪 {t("dlxDemo")}</p>}
                <label className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", fontWeight: 700 }}>
                  <input type="checkbox" checked={consentAdult} onChange={(e) => setConsentAdult(e.target.checked)} style={{ marginTop: 5 }} />
                  <span>{t("dlxConsentAdult")}</span>
                </label>
                <label className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", fontWeight: 700 }}>
                  <input type="checkbox" checked={consentStart} onChange={(e) => setConsentStart(e.target.checked)} style={{ marginTop: 5 }} />
                  <span>{t("dlxConsentStart")}</span>
                </label>
                <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                  📄 <Link href="/rechtliches">{t("dlxTerms")}</Link>
                </p>
                <button
                  className="btn yellow"
                  style={{ fontSize: "1.2rem" }}
                  disabled={!consentAdult || !consentStart || state === "redirecting" || !!profile.blocked}
                  onClick={buy}
                >
                  💎 {state === "redirecting" ? t("dlxRedirecting") : `${t("dlxBuy")} · ${formatPrice(10.5, lang)}`}
                </button>
                <p className="muted" style={{ margin: 0, fontSize: "0.85rem", textAlign: "center" }}>🔒 Stripe</p>
              </div>
            )}
          </>
        )}
        {error && <p className="err">{t(error)}</p>}
      </div>
    </>
  );
}
