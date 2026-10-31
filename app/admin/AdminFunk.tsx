"use client";

import { useState } from "react";
import { CALL_STATUS, Countdown, useCall, useNow, VideoRoom } from "@/components/VideoRoom";
import { getApi, type CallRequest } from "@/lib/data";
import { isOpen, nextSession, privateWindow } from "@/lib/funkraum";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/useData";

const toLocalInput = (d: Date) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};

export function AdminFunk() {
  const { t, lang } = useI18n();
  const api = getApi();
  const now = useNow();
  const session = nextSession(now);
  const ownerOpen = isOpen(session, now, true);
  const { call, busy, error, join, leave } = useCall();
  const { data, reload } = useData(() => api.listCallRequests());
  const [adultNow, setAdultNow] = useState(false);

  if (call) return <VideoRoom call={call} onLeave={leave} />;

  return (
    <div className="form">
      <div className="card form">
        <div style={{ fontWeight: 900, fontSize: "1.2rem" }}>📡 {t("frWhen")}</div>
        <div className="muted">
          {isOpen(session, now) ? (
            <span className="ok">{t("frOpenNow")}</span>
          ) : (
            <>
              {t("frNext")}: {session.start.toLocaleString(lang, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} ·{" "}
              <Countdown to={session.start} />
            </>
          )}
        </div>
        <p className="muted" style={{ margin: 0 }}>{t("admOwnerEarly")}</p>
        <div>
          <button className="btn yellow" disabled={!ownerOpen || busy} onClick={() => join("group")}>
            👑 {busy ? t("frJoining") : t("admJoinOwner")}
          </button>
        </div>
        {error && <p className="err">{t(error)}</p>}
      </div>

      <h2 className="section-title">📞 {t("admRequests")}</h2>
      <label className="row" style={{ fontWeight: 700 }}>
        <input type="checkbox" checked={adultNow} onChange={(e) => setAdultNow(e.target.checked)} />
        👨‍👩‍👧 {t("pcAdultCheck")}
      </label>
      {data && data.length === 0 && <div className="card">{t("admNoRequests")}</div>}
      <div className="list">
        {data?.map((r) => (
          <RequestCard key={r.id} r={r} now={now} reload={reload} canCall={adultNow && !busy} onJoin={() => join("private", r.id)} />
        ))}
      </div>
    </div>
  );
}

function RequestCard({ r, now, reload, canCall, onJoin }: { r: CallRequest; now: Date; reload: () => void; canCall: boolean; onJoin: () => void }) {
  const { t, lang } = useI18n();
  const api = getApi();
  const [when, setWhen] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600_000);
    d.setMinutes(0, 0, 0);
    return toLocalInput(r.scheduled_at ? new Date(r.scheduled_at) : d);
  });
  const win = r.scheduled_at ? privateWindow(r.scheduled_at) : null;
  const live = r.status === "bestaetigt" && win && now >= win.start && now < win.end;

  const update = async (status: CallRequest["status"], scheduled_at?: string | null) => {
    await api.updateCallRequest(r.id, scheduled_at === undefined ? { status } : { status, scheduled_at });
    reload();
  };

  return (
    <div className="card form" style={{ gap: 8 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>
          {r.author_avatar} {r.author_name}
        </strong>
        <span className="pill">
          {CALL_STATUS[r.status].icon} {t(CALL_STATUS[r.status].label)}
        </span>
      </div>
      <div>
        🗓️ <strong>{t("admWish")}:</strong> {r.wish}
      </div>
      {r.message && <div style={{ whiteSpace: "pre-wrap" }}>💬 {r.message}</div>}
      <div className="muted" style={{ fontSize: "0.85rem" }}>
        👨‍👩‍👧 {t("pcAdult")} ✅ · {new Date(r.created_at).toLocaleString(lang)}
      </div>
      {r.scheduled_at && r.status === "bestaetigt" && (
        <div>
          📅 <strong>{t("pcAt")}:</strong> {new Date(r.scheduled_at).toLocaleString(lang, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
      {(r.status === "neu" || r.status === "bestaetigt") && (
        <div className="row">
          <label className="field" style={{ flex: "0 1 230px" }}>
            {t("admPickTime")}
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </label>
          <button className="btn small" style={{ alignSelf: "flex-end" }} onClick={() => update("bestaetigt", new Date(when).toISOString())}>
            ✅ {t("admConfirm")}
          </button>
          <button className="btn small secondary" style={{ alignSelf: "flex-end" }} onClick={() => update("abgelehnt")}>
            🙁 {t("admDecline")}
          </button>
          {r.status === "bestaetigt" && (
            <button className="btn small secondary" style={{ alignSelf: "flex-end" }} onClick={() => update("erledigt")}>
              ✔️ {t("admDone")}
            </button>
          )}
        </div>
      )}
      {live && (
        <div>
          <button className="btn yellow" disabled={!canCall} onClick={onJoin}>
            📞 {t("pcJoin")}
          </button>
        </div>
      )}
      <div>
        <button
          className="btn small danger"
          onClick={async () => {
            if (!confirm(t("confirmDelete"))) return;
            await api.deleteCallRequest(r.id);
            reload();
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
