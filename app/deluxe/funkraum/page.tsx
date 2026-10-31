"use client";

import { useState } from "react";
import { DeluxeGate } from "@/components/DeluxeGate";
import { CALL_STATUS, Countdown, useCall, useNow, VideoRoom } from "@/components/VideoRoom";
import { getApi } from "@/lib/data";
import { isOpen, nextSession, privateWindow } from "@/lib/funkraum";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useData } from "@/lib/useData";

export default function FunkraumPage() {
  const { t } = useI18n();
  return (
    <DeluxeGate title={t("frTitle")} icon="📡">
      <Funkraum />
      <PrivateCalls />
    </DeluxeGate>
  );
}

function Funkraum() {
  const { t, lang } = useI18n();
  const now = useNow();
  const session = nextSession(now);
  const open = isOpen(session, now);
  const { call, busy, error, join, leave } = useCall();
  const [rules, setRules] = useState([false, false, false]);

  if (call) return <VideoRoom call={call} onLeave={leave} />;

  return (
    <div className="card form">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: "1.2rem" }}>🗓️ {t("frWhen")}</div>
          {open ? (
            <div className="ok">{t("frOpenNow")}</div>
          ) : (
            <div className="muted">
              {t("frNext")}: {session.start.toLocaleString(lang, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} ·{" "}
              <Countdown to={session.start} />
            </div>
          )}
        </div>
      </div>

      <div className="card rules">
        <strong>🛡️ {t("frRulesTitle")}</strong>
        {(["frRuleKind", "frRulePrivate", "frRuleAdult"] as DictKey[]).map((key, i) => (
          <label key={key} className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", fontWeight: 700 }}>
            <input type="checkbox" checked={rules[i]} onChange={(e) => setRules(rules.map((r, j) => (j === i ? e.target.checked : r)))} style={{ marginTop: 5 }} />
            <span>{t(key)}</span>
          </label>
        ))}
        <p className="muted" style={{ margin: 0 }}>👑 {t("frRuleNoah")}</p>
      </div>

      <p className="muted" style={{ margin: 0 }}>🎥 {t("frCamera")}</p>
      <div>
        <button className="btn yellow" style={{ fontSize: "1.2rem" }} disabled={!open || busy || rules.some((r) => !r)} onClick={() => join("group")}>
          📡 {busy ? t("frJoining") : t("frJoin")}
        </button>
      </div>
      {!open && <p className="muted" style={{ margin: 0 }}>🔒 {t("frClosed")}</p>}
      {error && <p className="err">{t(error)}</p>}
    </div>
  );
}

function PrivateCalls() {
  const { t, lang } = useI18n();
  const api = getApi();
  const now = useNow();
  const { data, reload } = useData(() => api.listCallRequests());
  const { call, busy, error, join, leave } = useCall();
  const [wish, setWish] = useState("");
  const [message, setMessage] = useState("");
  const [adult, setAdult] = useState(false);
  const [adultNow, setAdultNow] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; key: DictKey } | null>(null);

  if (call) return <VideoRoom call={call} onLeave={leave} />;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.addCallRequest({ wish: wish.trim(), message: message.trim() || null, adult_present: adult });
      setWish("");
      setMessage("");
      setAdult(false);
      setMsg({ ok: true, key: "pcSent" });
      reload();
    } catch (err) {
      setMsg({ ok: false, key: err instanceof Error && err.message === "too-many-requests" ? "pcTooMany" : "errorGeneric" });
    }
  };

  return (
    <>
      <h2 className="section-title">📞 {t("pcTitle")}</h2>
      <form className="card form" onSubmit={send}>
        <p className="muted" style={{ margin: 0 }}>{t("pcIntro")}</p>
        <label className="field">
          {t("pcWish")}
          <input value={wish} onChange={(e) => setWish(e.target.value)} maxLength={200} required />
        </label>
        <label className="field">
          {t("pcMessage")}
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} rows={2} />
        </label>
        <label className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", fontWeight: 700 }}>
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} required style={{ marginTop: 5 }} />
          <span>👨‍👩‍👧 {t("pcAdult")}</span>
        </label>
        <div>
          <button className="btn" disabled={!wish.trim() || !adult}>
            ✉️ {t("pcSend")}
          </button>
        </div>
        {msg && <p className={msg.ok ? "ok" : "err"} style={{ margin: 0 }}>{t(msg.key)}</p>}
      </form>

      {data && data.length > 0 && (
        <>
          <h3 style={{ marginTop: 18 }}>📜 {t("pcMine")}</h3>
          <div className="list">
            {data.map((r) => {
              const win = r.scheduled_at ? privateWindow(r.scheduled_at) : null;
              const canJoin = r.status === "bestaetigt" && win && now >= win.start && now < win.end;
              return (
                <div key={r.id} className="card form" style={{ gap: 6 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span>{r.wish}</span>
                    <span className="pill">
                      {CALL_STATUS[r.status].icon} {t(CALL_STATUS[r.status].label)}
                    </span>
                  </div>
                  {r.status === "bestaetigt" && r.scheduled_at && (
                    <div>
                      📅 <strong>{t("pcAt")}:</strong>{" "}
                      {new Date(r.scheduled_at).toLocaleString(lang, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                      {!canJoin && <div className="muted">{t("pcOpensAt")}</div>}
                    </div>
                  )}
                  {canJoin && (
                    <div className="form" style={{ gap: 6 }}>
                      <label className="row" style={{ fontWeight: 700 }}>
                        <input type="checkbox" checked={adultNow} onChange={(e) => setAdultNow(e.target.checked)} />
                        👨‍👩‍👧 {t("pcAdultCheck")}
                      </label>
                      <div>
                        <button className="btn yellow" disabled={!adultNow || busy} onClick={() => join("private", r.id)}>
                          📞 {busy ? t("frJoining") : t("pcJoin")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      {error && <p className="err">{t(error)}</p>}
    </>
  );
}
